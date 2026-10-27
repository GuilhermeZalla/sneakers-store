import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { createServer } from 'vite';

test('mounted notification bell and provider in a real browser', { timeout: 120000 }, async (t) => {
    const browserPath = [
        process.env.BROWSER_PATH,
        'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ].find((file) => file && existsSync(file));
    assert.ok(browserPath, 'Install Chrome/Edge or set BROWSER_PATH to run browser tests.');
    const profile = mkdtempSync(path.join(tmpdir(), 'sneakers-notifications-'));
    const frontendRoot = path.resolve(import.meta.dirname, '../..');
    const server = await createServer({
        root: frontendRoot,
        configFile: path.join(frontendRoot, 'vite.config.ts'),
        server: { host: '127.0.0.1', port: 0, strictPort: false },
        plugins: [
            {
                name: 'notification-test-page',
                configureServer(vite) {
                    vite.middlewares.use(async (request, response, next) => {
                        if (request.url !== '/__notification_test') return next();
                        response.setHeader('Content-Type', 'text/html');
                        response.end(
                            await vite.transformIndexHtml(
                                request.url,
                                '<html><body><div id="root"></div><script type="module" src="/src/lib/notifications.fixture.tsx"></script></body></html>',
                            ),
                        );
                    });
                },
            },
        ],
    });
    let browser;
    let socket;
    let sequence = 0;
    const pending = new Map();
    const command = (method, params = {}) =>
        new Promise((resolve, reject) => {
            const id = ++sequence;
            const timeout = setTimeout(() => {
                pending.delete(id);
                reject(new Error('CDP timeout: ' + method));
            }, 15000);
            pending.set(id, {
                resolve: (value) => {
                    clearTimeout(timeout);
                    resolve(value);
                },
                reject: (error) => {
                    clearTimeout(timeout);
                    reject(error);
                },
            });
            socket.send(JSON.stringify({ id, method, params }));
        });
    const evaluate = async (expression) => {
        const result = await command('Runtime.evaluate', {
            expression,
            awaitPromise: true,
            returnByValue: true,
        });
        assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
        return result.result.value;
    };
    const until = async (expression) => {
        for (let attempt = 0; attempt < 200; attempt++) {
            if (await evaluate(expression)) return;
            await delay(25);
        }
        assert.fail('Browser condition timed out: ' + expression);
    };
    const state = () =>
        evaluate('JSON.parse(document.querySelector("#notification-state").textContent)');
    try {
        await server.listen();
        const port = server.httpServer.address().port;
        browser = spawn(
            browserPath,
            [
                '--headless=new',
                '--no-sandbox',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--no-first-run',
                '--no-default-browser-check',
                '--remote-debugging-port=0',
                '--user-data-dir=' + profile,
                'about:blank',
            ],
            { windowsHide: true, stdio: 'ignore' },
        );
        const activePort = path.join(profile, 'DevToolsActivePort');
        for (let attempt = 0; !existsSync(activePort) && attempt < 200; attempt++) await delay(25);
        assert.ok(existsSync(activePort), 'Browser did not start');
        const debugPort = readFileSync(activePort, 'utf8').split('\n')[0];
        const targets = await fetch('http://127.0.0.1:' + debugPort + '/json/list').then(
            (response) => response.json(),
        );
        socket = new WebSocket(
            targets.find((target) => target.type === 'page').webSocketDebuggerUrl,
        );
        await new Promise((resolve, reject) => {
            socket.onopen = resolve;
            socket.onerror = reject;
        });
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            const operation = pending.get(message.id);
            if (!operation) return;
            pending.delete(message.id);
            if (message.error) operation.reject(new Error(JSON.stringify(message.error)));
            else operation.resolve(message.result);
        };
        await command('Page.enable');
        await command('Page.bringToFront');
        await command('Emulation.setFocusEmulationEnabled', { enabled: true });
        const boot = async () => {
            await command('Page.navigate', {
                url: 'http://127.0.0.1:' + port + '/__notification_test',
            });
            await until(
                '!!document.querySelector("#notification-state") && document.querySelector("#notification-state").textContent.includes("Private account 1")',
            );
        };
        await t.test('keyboard opens and closes the mounted bell with focus restored', async () => {
            await boot();
            await evaluate('document.querySelector(".notification-trigger").focus()');
            await command('Input.dispatchKeyEvent', {
                type: 'keyDown',
                key: 'Enter',
                code: 'Enter',
                text: '\r',
                windowsVirtualKeyCode: 13,
            });
            await command('Input.dispatchKeyEvent', {
                type: 'keyUp',
                key: 'Enter',
                code: 'Enter',
                windowsVirtualKeyCode: 13,
            });
            await until('!!document.querySelector("[role=dialog]")');
            await command('Input.dispatchKeyEvent', {
                type: 'keyDown',
                key: 'Escape',
                code: 'Escape',
                windowsVirtualKeyCode: 27,
            });
            await until('!document.querySelector("[role=dialog]")');
            assert.equal(
                await evaluate('document.activeElement.classList.contains("notification-trigger")'),
                true,
            );
            await command('Input.dispatchKeyEvent', {
                type: 'keyDown',
                key: 'ArrowDown',
                code: 'ArrowDown',
                windowsVirtualKeyCode: 40,
            });
            await until(
                '!!document.querySelector("[role=dialog]") && document.activeElement.tagName === "A"',
            );
        });
        await t.test('polling pauses while hidden and resumes on visibility change', async () => {
            await boot();
            const before = await evaluate('window.notificationHarness.listCalls');
            await evaluate(
                'window.notificationHarness.hidden=true;window.notificationHarness.tick()',
            );
            await delay(80);
            assert.equal(await evaluate('window.notificationHarness.listCalls'), before);
            await evaluate(
                'window.notificationHarness.hidden=false;document.dispatchEvent(new Event("visibilitychange"))',
            );
            await until('window.notificationHarness.listCalls > ' + before);
        });
        await t.test(
            'loading empty error and retry states preserve the unread count on failure',
            async () => {
                await boot();
                await evaluate(
                    'window.notificationHarness.hold=true;document.querySelector("#notifications-refresh").click()',
                );
                await until('!!document.querySelector(".notification-skeleton")');
                await evaluate(
                    'window.notificationHarness.hold=false;window.notificationHarness.release()',
                );
                await until(
                    '!JSON.parse(document.querySelector("#notification-state").textContent).loading',
                );
                await evaluate(
                    'window.notificationHarness.fail=true;window.notificationHarness.tick()',
                );
                await until(
                    'JSON.parse(document.querySelector("#notification-state").textContent).error',
                );
                assert.equal((await state()).count, 2);
                assert.equal(await evaluate('!!document.querySelector("[role=alert]")'), true);
                await evaluate(
                    'window.notificationHarness.fail=false;window.notificationHarness.items=[];window.notificationHarness.count=0;[...document.querySelectorAll("button")].find(b=>b.textContent==="Try again").click()',
                );
                await until('document.body.innerText.includes("No notifications yet.")');
                assert.equal((await state()).count, 0);
            },
        );
        await t.test(
            'late responses cannot restore previous account notifications after account change or logout',
            async () => {
                await boot();
                await evaluate(
                    'window.notificationHarness.hold=true;document.querySelector("#notifications-refresh").click()',
                );
                await until('window.notificationHarness.pending.length === 2');
                await evaluate(
                    'window.notificationHarness.hold=false;window.notificationHarness.account(2);document.querySelector("#auth-refresh").click()',
                );
                await until(
                    'document.querySelector("#notification-state").textContent.includes("Private account 2")',
                );
                await evaluate('window.notificationHarness.release()');
                await delay(80);
                assert.equal(JSON.stringify(await state()).includes('Private account 1'), false);
                await evaluate(
                    'window.notificationHarness.hold=true;document.querySelector("#notifications-refresh").click()',
                );
                await until('window.notificationHarness.pending.length === 2');
                await evaluate(
                    'window.notificationHarness.account(null);document.querySelector("#auth-refresh").click()',
                );
                await until('!document.querySelector(".notification-trigger")');
                await evaluate('window.notificationHarness.release()');
                await delay(80);
                assert.deepEqual((await state()).items, []);
                assert.equal((await state()).count, 0);
                const callsAfterLogout = await evaluate('window.notificationHarness.listCalls');
                await evaluate('window.notificationHarness.tick()');
                await delay(80);
                assert.equal(
                    await evaluate('window.notificationHarness.listCalls'),
                    callsAfterLogout,
                );
            },
        );
        await t.test(
            'recovery form shows the same result for known and unknown email addresses',
            async () => {
                const messages = [];
                for (const email of ['account1@example.test', 'unknown@example.test']) {
                    await boot();
                    await evaluate(
                        '(()=>{const field=document.querySelector("#recovery-email");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(field,' +
                            JSON.stringify(email) +
                            ');field.dispatchEvent(new Event("input",{bubbles:true}));})()',
                    );
                    await evaluate('document.querySelector("form").requestSubmit()');
                    await until(
                        'document.body.innerText.includes("If an account exists for this email")',
                    );
                    messages.push(
                        await evaluate(
                            'document.querySelector(".access-page [role=status]").textContent',
                        ),
                    );
                }
                assert.equal(messages[0], messages[1]);
            },
        );
    } finally {
        if (socket) socket.close();
        if (browser?.pid) {
            if (process.platform === 'win32')
                spawnSync(
                    path.join(process.env.SystemRoot ?? 'C:/Windows', 'System32/taskkill.exe'),
                    ['/PID', String(browser.pid), '/T', '/F'],
                    {
                        windowsHide: true,
                        stdio: 'ignore',
                    },
                );
            else browser.kill('SIGTERM');
        }
        await server.close();
        await delay(300);
        assert.equal(path.dirname(path.resolve(profile)), path.resolve(tmpdir()));
        assert.ok(path.basename(profile).startsWith('sneakers-notifications-'));
        rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    }
});
