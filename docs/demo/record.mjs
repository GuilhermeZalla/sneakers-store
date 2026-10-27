/**
 * Real browser demo recorder. Tested with Node 24, Playwright 1.64 and FFmpeg 9.
 * Install recording tools outside this repository; no application dependency changes.
 * Required environment: PLAYWRIGHT_MODULE, PHP_BINARY, MAILPIT_BINARY,
 * FFMPEG_BINARY, FFPROBE_BINARY, DEMO_DB_USERNAME.
 * Optional: MYSQL_BINARY, DEMO_DB_PASSWORD, PHP_EXTENSION_DIR, DEMO_KEEP_DIAGNOSTICS=1.
 * Run from the repository root: node docs/demo/record.mjs
 * Creates its own localhost-only MySQL database and removes all demo data in finally.
 * Sources: https://playwright.dev/docs/videos and https://ffmpeg.org/ffmpeg-filters.html
 */
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, copyFile, writeFile, readFile, rm } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.join(root, 'docs/demo');
const backend = path.join(root, 'sneakers-store-backend');
const frontend = path.join(root, 'sneakers-store-frontend');
for (const key of ['PLAYWRIGHT_MODULE', 'PHP_BINARY', 'MAILPIT_BINARY', 'FFMPEG_BINARY', 'FFPROBE_BINARY', 'DEMO_DB_USERNAME']) {
    assert.ok(process.env[key], 'Set ' + key + ' before recording.');
}
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const temporary = await mkdtemp(path.join(tmpdir(), 'sneakers-demo-'));
const artifactDirectory = path.join(temporary, 'artifacts');
await mkdir(artifactDirectory);
const database = 'sneakers_test_' + randomBytes(16).toString('hex');
const host = '127.0.0.1';
assert.ok(['127.0.0.1', 'localhost', '::1'].includes(host));
assert.match(database, /^sneakers_test_[a-f0-9]{32}$/);
const baseUrl = 'http://localhost:18151';
const apiUrl = 'http://localhost:18150';
const mailpitUrl = 'http://127.0.0.1:18035';
const password = randomBytes(32).toString('base64url') + '!aA9';
const env = {
    ...process.env,
    APP_ENV: 'testing', APP_DEBUG: 'false', APP_KEY: 'base64:' + randomBytes(32).toString('base64'),
    APP_CONFIG_CACHE: path.join(temporary, 'config.php'), APP_URL: apiUrl, FRONTEND_URL: baseUrl,
    DB_CONNECTION: 'mysql', DB_HOST: host, DB_PORT: '3306', DB_DATABASE: database,
    DB_USERNAME: process.env.DEMO_DB_USERNAME, DB_PASSWORD: process.env.DEMO_DB_PASSWORD ?? '', DB_URL: '',
    CACHE_STORE: 'database', SESSION_DRIVER: 'database', SESSION_DOMAIN: 'null',
    SESSION_COOKIE: 'sneakers_demo', SESSION_SECURE_COOKIE: 'false',
    SANCTUM_STATEFUL_DOMAINS: 'localhost:18151,localhost:18150',
    VITE_API_URL: apiUrl, BCRYPT_ROUNDS: '4', LOG_CHANNEL: 'stderr',
    MAIL_MAILER: 'smtp', MAIL_HOST: host, MAIL_PORT: '11035', MAIL_SCHEME: 'smtp',
    MAIL_USERNAME: 'null', MAIL_PASSWORD: 'null', MAIL_URL: 'null',
    MAIL_FROM_ADDRESS: 'demo@example.test', MAIL_FROM_NAME: 'Sneakers', QUEUE_CONNECTION: 'database',
};
const phpArguments = process.env.PHP_EXTENSION_DIR ? ['-d', 'extension_dir=' + process.env.PHP_EXTENSION_DIR] : [];
const children = [];
const contexts = [];
const artifacts = [];
const checkpoints = [];
let browser;
let created = false;
let succeeded = false;
let currentPage;
let recordingBegan;
let emailScene;
function run(binary, args, cwd = root, childEnv = env) {
    const result = spawnSync(binary, args, { cwd, env: childEnv, windowsHide: true, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
    if (result.status !== 0) {
        throw new Error(path.basename(binary) + ' failed: ' + (result.stderr || result.stdout || result.error?.message).slice(-3000));
    }
    return result.stdout;
}
function php(args) { return run(process.env.PHP_BINARY, [...phpArguments, ...args], backend); }
function sql(statement, selected = false) {
    assert.match(database, /^sneakers_test_[a-f0-9]{32}$/);
    assert.equal(host, '127.0.0.1');
    return run(process.env.MYSQL_BINARY || 'mysql',
        ['--host=' + host, '--port=3306', '--user=' + env.DB_USERNAME, '--batch', '--skip-column-names', ...(selected ? [database] : []), '--execute=' + statement],
        root, { ...env, MYSQL_PWD: env.DB_PASSWORD });
}
function start(binary, args, cwd, name) {
    const stream = createWriteStream(path.join(temporary, name + '.log'));
    const child = spawn(binary, args, { cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.pipe(stream);
    child.stderr.pipe(stream);
    child.on('error', (error) => stream.write(error.message));
    children.push(child);
}
async function ready(url) {
    for (let attempt = 0; attempt < 120; attempt++) {
        try { const response = await fetch(url); if (response.ok) return; } catch {}
        await delay(250);
    }
    throw new Error('Service did not start: ' + new URL(url).port);
}
async function api(context, route, method = 'GET', data, locale = 'pt-BR') {
    const cookie = (await context.cookies(baseUrl)).find((entry) => entry.name === 'XSRF-TOKEN');
    const response = await context.request.fetch(baseUrl + route, {
        method, data,
        headers: { Accept: 'application/json', Origin: baseUrl, 'Accept-Language': locale, ...(cookie ? { 'X-XSRF-TOKEN': decodeURIComponent(cookie.value) } : {}) },
    });
    assert.ok(response.ok(), method + ' ' + route + ': ' + response.status());
    const body = await response.text();
    return body ? JSON.parse(body) : null;
}
async function context(options = {}) {
    const result = await browser.newContext({ locale: 'pt-BR', ...options });
    result.setDefaultTimeout(12000);
    contexts.push(result);
    return result;
}
async function images(page) {
    await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].filter((image) => image.getBoundingClientRect().top < innerHeight).map((image) => image.decode()));
    });
    assert.equal(await page.locator('.image-fallback').count(), 0, 'Product placeholder found');
}
async function navigate(page, route) {
    await page.goto(baseUrl + route);
    await page.locator('main').waitFor();
    await page.locator('[role=status]').filter({ hasText: /Loading|Carregando/ }).waitFor({ state: 'hidden' }).catch(() => {});
    if (route === '/' || route.startsWith('/catalog')) await page.locator('.product-card').first().waitFor();
    await images(page);
}
async function pause(milliseconds = 700) { await delay(milliseconds); }
async function scroll(page, top) {
    await page.evaluate((value) => window.scrollTo({ top: value, behavior: 'smooth' }), top);
    await pause(550);
}
async function checkpoint(page, name) {
    assert.equal(await page.locator('.image-fallback').count(), 0);
    const sensitive = await page.locator('body').innerText();
    assert.ok(!sensitive.includes(password), 'Password leaked');
    assert.ok(!/[A-Za-z]:\\(?:Users|home)\\|APP_KEY=|DB_PASSWORD=/.test(sensitive), 'Local data leaked');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal overflow');
    const filename = path.join(temporary, name + '.png');
    await page.screenshot({ path: filename });
    checkpoints.push(filename);
}
async function verificationMail(email) {
    for (let attempt = 0; attempt < 80; attempt++) {
        const inbox = await fetch(mailpitUrl + '/api/v1/messages').then((response) => response.json());
        const found = inbox.messages.find((message) => message.To.some((recipient) => recipient.Address === email) && /Verifique|Verify/.test(message.Subject));
        if (found) return fetch(mailpitUrl + '/api/v1/message/' + found.ID).then((response) => response.json());
        await delay(200);
    }
    throw new Error('Verification email was not delivered by the worker.');
}
async function verifyInMailpit(page, email) {
    const message = await verificationMail(email);
    assert.ok(!message.HTML.includes(password) && !message.Text.includes(password));
    await page.goto(mailpitUrl);
    emailScene = { start: (performance.now() - recordingBegan) / 1000 };
    await page.getByText(message.Subject, { exact: true }).first().click();
    await pause(850);
    let action;
    for (let attempt = 0; attempt < 30 && !action; attempt++) {
        for (const frame of page.frames()) {
            const candidate = frame.locator('a[href*="/verify-email/"]').first();
            if (await candidate.isVisible().catch(() => false)) { action = candidate; break; }
        }
        if (!action) await delay(100);
    }
    assert.ok(action, 'Verification button missing from Mailpit HTML preview');
    await checkpoint(page, 'compra-mailpit');
    // Mailpit sandboxes its preview. Navigate the recorded tab to the real email href.
    const href = await action.getAttribute('href');
    assert.equal(new URL(href).origin, baseUrl);
    emailScene.end = (performance.now() - recordingBegan) / 1000;
    await page.goto(href);
    await page.waitForURL((url) => url.origin === baseUrl && url.pathname.startsWith('/verify-email'));
    await page.getByText('E-mail confirmado.', { exact: false }).waitFor();
    await pause(850);
}
async function registerPrepared() {
    const prepared = await context();
    const page = await prepared.newPage();
    await api(prepared, '/sanctum/csrf-cookie');
    await api(prepared, '/api/v1/auth/register', 'POST', {
        name: 'Lia Demo', email: 'lia.demo@example.test', password, password_confirmation: password,
        phone: '11999990000', birthday: '1995-05-15', gender: 'not_informed', locale: 'en',
    }, 'en');
    const mail = await verificationMail('lia.demo@example.test');
    const link = mail.HTML.match(/href="([^"]*\/verify-email\/[^"]+)"/)?.[1]?.replaceAll('&amp;', '&');
    assert.ok(link);
    await page.goto(link);
    await page.getByText(/Email verified/).waitFor();
    assert.ok((await api(prepared, '/api/v1/user')).data.email_verified_at);
    await page.evaluate(() => localStorage.setItem('store-locale', 'en'));
    const storage = await prepared.storageState();
    await prepared.close();
    return storage;
}
async function record(name, options, route, flow) {
    const viewport = options.viewport ?? { width: 1280, height: 720 };
    const { beforeStart, ...contextOptions } = options;
    const recording = await context({ viewport, recordVideo: { dir: path.join(temporary, 'raw'), size: viewport }, ...contextOptions });
    const page = await recording.newPage();
    currentPage = page;
    const videoStart = performance.now();
    await navigate(page, route);
    if (beforeStart) { await beforeStart(page); await images(page); }
    await pause(200);
    const start = (performance.now() - videoStart) / 1000;
    const began = performance.now();
    recordingBegan = began;
    emailScene = null;
    console.log('Recording ' + name);
    await flow(page, recording);
    const elapsed = (performance.now() - began) / 1000;
    if (elapsed < 16) await pause((16 - elapsed) * 1000);
    await checkpoint(page, name + '-final');
    const duration = (performance.now() - began) / 1000;
    assert.ok(duration <= 30, name + ' is too long: ' + duration.toFixed(2) + ' seconds');
    const state = await recording.storageState();
    const video = page.video();
    await recording.close();
    const raw = await video.path();
    await convert(name, raw, start, duration, viewport);
    console.log('Recorded ' + name + ': ' + duration.toFixed(2) + ' seconds');
    return state;
}
async function convert(name, raw, start, duration, viewport) {
    const mp4 = path.join(artifactDirectory, name + '.mp4');
    // Mask only the raw signed URL below the Mailpit email button, in both deliverables.
    const privacy = emailScene ? ['-vf', "drawbox=x=480:y=660:w=800:h=60:color=white:t=fill:enable='between(t," + Math.max(0, emailScene.start - 0.25) + ',' + (emailScene.end + 0.1) + ")'"] : [];
    run(process.env.FFMPEG_BINARY, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(start), '-i', raw, '-t', String(duration),
        ...privacy, '-map_metadata', '-1', '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
    const gif = path.join(artifactDirectory, name + '.gif');
    let selected;
    for (const [width, fps, colors] of [[800, 12, 192], [800, 10, 128], [640, 10, 128], [viewport.width < 800 ? 390 : 640, 10, 96]]) {
        const graph = 'fps=' + fps + ',scale=' + width + ':-2:flags=lanczos,split[a][b];[a]palettegen=max_colors=' + colors +
            ':stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle';
        run(process.env.FFMPEG_BINARY, ['-hide_banner', '-loglevel', 'error', '-y', '-i', mp4, '-filter_complex', graph, '-loop', '0', gif]);
        const buffer = await readFile(gif);
        if (buffer.length < 5_000_000) { selected = { width, fps, bytes: buffer.length }; break; }
    }
    assert.ok(selected, name + ' GIF exceeds 5 MB');
    const probe = JSON.parse(run(process.env.FFPROBE_BINARY, ['-v', 'error', '-show_entries', 'format=duration,size:stream=width,height', '-of', 'json', mp4]));
    assert.ok(Number(probe.format.duration) >= 15 && Number(probe.format.duration) <= 30);
    artifacts.push({ name, duration: Number(probe.format.duration), mp4: Number(probe.format.size), gif: selected });
}
async function storeFlow(page, mobile = false) {
    await pause(800);
    await scroll(page, mobile ? 470 : 320);
    await pause(700);
    await checkpoint(page, mobile ? 'mobile-home' : 'loja-home');
    await page.locator('.store-nav a[href="/catalog"]').click();
    await page.getByRole('combobox', { name: /^Category/ }).selectOption(mobile ? 'shirt' : 'sneaker');
    await pause(500);
    await page.getByRole('combobox', { name: /^Sort/ }).selectOption('price');
    await pause(650);
    const first = page.locator('.product-name').first();
    await first.waitFor();
    await first.scrollIntoViewIfNeeded();
    await images(page);
    await pause(900);
    await checkpoint(page, mobile ? 'mobile-catalogo' : 'loja-catalogo');
    await first.click();
    await page.locator('.detail-price').waitFor();
    await images(page);
    await pause(850);
    await checkpoint(page, mobile ? 'mobile-produto' : 'loja-produto');
    await page.locator('.detail-favorite').click();
    await page.locator('.detail-favorite[aria-pressed=true]').waitFor();
    await pause(500);
    await page.getByRole('button', { name: /ADD TO CART/ }).click();
    await page.getByText('Added to cart.', { exact: false }).waitFor();
    await pause(600);
    await page.getByRole('link', { name: 'View cart', exact: true }).click();
    await page.locator('.cart-item').first().waitFor();
    await pause(700);
    await scroll(page, 0);
    await page.getByLabel('Language and currency').selectOption('pt_BR');
    await page.getByLabel('Idioma e moeda').waitFor();
    await page.getByText(/R\$/).first().waitFor();
    await pause(1100);
}
let purchaseState;
try {
    console.log('Temporary diagnostics: ' + temporary);
    console.log('Verifying isolated database host=' + host + ', name=' + database);
    for (const port of [18150, 18151, 18035, 11035]) {
        await new Promise((resolve, reject) => {
            const server = createServer();
            server.once('error', reject);
            server.listen(port, 'localhost', () => server.close(resolve));
        });
    }
    sql('CREATE DATABASE ' + database + ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    created = true;
    const inspected = JSON.parse(php(['artisan', 'integration:mysql-fixture', 'inspect', '--no-interaction']));
    assert.equal(inspected.host, host);
    assert.equal(inspected.database, database);
    php(['artisan', 'migrate', '--seed', '--no-interaction']);
    assert.equal(Number(sql('SELECT COUNT(*) FROM products', true).trim()), 30);
    start(process.env.MAILPIT_BINARY, ['--listen', host + ':18035', '--smtp', host + ':11035', '--database', path.join(temporary, 'mailpit.sqlite'), '--disable-version-check'], root, 'mailpit');
    start(process.env.PHP_BINARY, [...phpArguments, '-d', 'opcache.enable=0', '-S', 'localhost:18150', '-t', 'public', 'public/index.php'], backend, 'backend');
    start(process.env.PHP_BINARY, [...phpArguments, 'artisan', 'queue:work', 'database', '--sleep=1', '--tries=3', '--timeout=30', '--no-interaction'], backend, 'worker');
    if (process.platform === 'win32') {
        start('powershell.exe', ['-NoProfile', '-Command', 'npm.cmd run dev -- --port 18151'], frontend, 'frontend');
    } else {
        start('npm', ['run', 'dev', '--', '--port', '18151'], frontend, 'frontend');
    }
    await Promise.all([ready(baseUrl), ready(apiUrl + '/api/v1/products'), ready(mailpitUrl + '/api/v1/messages')]);
    browser = await chromium.launch({ headless: true });
    const storeState = await registerPrepared();
    await record('loja-desktop', { storageState: storeState }, '/', (page) => storeFlow(page));
    const reset = await context({ storageState: storeState });
    await api(reset, '/api/v1/cart', 'DELETE');
    const favorites = await api(reset, '/api/v1/wishlist');
    for (const favorite of favorites.data) await api(reset, '/api/v1/wishlist/' + favorite.id, 'DELETE');
    await reset.close();
    // Only the isolated Mailpit instance is cleared, before the recorded registration.
    await fetch(mailpitUrl + '/api/v1/messages', { method: 'DELETE' });
    purchaseState = await record('compra-desktop', {}, '/register', async (page, recording) => {
        await page.getByLabel('Language and currency').selectOption('pt_BR');
        await pause(500);
        for (const [field, value] of Object.entries({ name: 'Rafa Demo', email: 'rafa.demo@example.test', password,
            password_confirmation: password, phone: '11999990000', birthday: '1995-05-15' })) {
            await page.locator('#' + field).fill(value);
        }
        await pause(700);
        await page.getByRole('button', { name: 'CRIAR CONTA', exact: true }).click();
        await page.waitForURL(baseUrl + '/account');
        await pause(700);
        await verifyInMailpit(page, 'rafa.demo@example.test');
        // Prepare cart/address through the real API; their UI flows are shown in the other clips.
        const products = await api(recording, '/api/v1/products?type=shirt&sort=price');
        await api(recording, '/api/v1/cart/items', 'POST', { product_id: products.data[0].id, quantity: 1 });
        await api(recording, '/api/v1/addresses', 'POST', { type: 'home', postal_code: '01001-000', street: 'Rua da Demonstração',
            number: '100', district: 'Bairro Exemplo', city: 'Cidade Exemplo', state: 'SP', is_default: true });
        await navigate(page, '/checkout');
        await page.getByRole('button', { name: /Continuar/ }).click();
        await page.locator('input[name=address]').waitFor();
        await pause(850);
        await checkpoint(page, 'compra-entrega');
        await page.getByRole('button', { name: /Continuar/ }).click();
        await page.getByText(/pagamento simulado pelo valor integral/).waitFor();
        await pause(1100);
        await checkpoint(page, 'compra-wallet');
        await page.getByRole('button', { name: 'Finalizar pedido', exact: true }).click();
        await page.getByText('PEDIDO CONFIRMADO.', { exact: true }).waitFor();
        await pause(1400);
    });
    await record('conta-desktop', { storageState: purchaseState }, '/account', async (page) => {
        await pause(850);
        await page.getByRole('button', { name: 'Endereços', exact: true }).click();
        await page.getByText('Rua da Demonstração, 100', { exact: true }).waitFor();
        await pause(600);
        await page.getByRole('button', { name: 'Novo endereço', exact: true }).click();
        for (const [field, value] of Object.entries({ postal_code: '02002-000', number: '200', street: 'Rua do Exemplo',
            district: 'Bairro Modelo', city: 'Cidade Exemplo' })) await page.locator('#address-' + field).fill(value);
        await pause(600);
        await page.getByRole('button', { name: 'Salvar endereço', exact: true }).click();
        const row = page.locator('.dashboard-row').filter({ hasText: 'Rua do Exemplo, 200' });
        await row.waitFor();
        await pause(600);
        await row.getByRole('button', { name: 'Definir padrão', exact: true }).click();
        await row.getByText('Padrão', { exact: true }).waitFor();
        await pause(700);
        await checkpoint(page, 'conta-endereco');
        await page.getByRole('button', { name: 'Pedidos', exact: true }).click();
        await page.getByRole('link', { name: /Ver detalhes/ }).waitFor();
        await pause(1100);
        await checkpoint(page, 'conta-pedidos');
        await scroll(page, 0);
        await page.locator('.notification-trigger').focus();
        await page.keyboard.press('Enter');
        await page.getByRole('dialog').getByText('Pedido confirmado', { exact: true }).waitFor();
        await pause(1700);
    });
    // The same real, verified account is reused; its language preference was updated by the desktop clip.
    await record('loja-mobile', {
        storageState: storeState, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
        beforeStart: async (page) => {
            await page.locator('.locale-label select').selectOption('en');
            await pause(350);
            await page.locator('.product-card').first().waitFor();
            await page.getByLabel('Language and currency').waitFor();
        },
    }, '/', (page) => storeFlow(page, true));
    await writeFile(path.join(temporary, 'verification.json'), JSON.stringify({ artifacts, checkpoints: checkpoints.map((file) => path.basename(file)) }, null, 2));
    for (const artifact of artifacts) {
        for (const extension of ['gif', 'mp4']) await copyFile(path.join(artifactDirectory, artifact.name + '.' + extension), path.join(output, artifact.name + '.' + extension));
    }
    succeeded = true;
    console.log(JSON.stringify(artifacts, null, 2));
} catch (error) {
    if (currentPage && !currentPage.isClosed()) {
        await currentPage.screenshot({ path: path.join(temporary, 'failure.png') }).catch(() => {});
        await writeFile(path.join(temporary, 'failure.html'), await currentPage.content().catch(() => ''));
    }
    throw error;
} finally {
    for (const item of contexts) await item.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    for (const child of children.reverse()) {
        if (!child.pid) continue;
        if (process.platform === 'win32') spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
        else child.kill('SIGTERM');
    }
    if (created) {
        try {
            const exists = sql("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='" + database + "' AND table_name='users'").trim();
            if (exists === '1') {
                sql('DELETE FROM orders; DELETE FROM users; SELECT COUNT(*) FROM orders; SELECT COUNT(*) FROM users;', true);
            }
        } finally {
            sql('DROP DATABASE ' + database);
            assert.equal(sql("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name='" + database + "'").trim(), '0');
            console.log('Temporary accounts, orders and database removed.');
        }
    }
    if (succeeded && process.env.DEMO_KEEP_DIAGNOSTICS !== '1') {
        const relative = path.relative(path.resolve(tmpdir()), path.resolve(temporary));
        assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
        assert.ok(path.basename(temporary).startsWith('sneakers-demo-'));
        await rm(temporary, { recursive: true, force: true });
    }
    // Failed runs retain diagnostics outside the repository; their MySQL database is still removed.
}
