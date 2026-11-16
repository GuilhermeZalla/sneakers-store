import assert from 'node:assert/strict';
import test from 'node:test';
import { demoRequest, DemoError, restoreDemoState } from './demo.ts';

test('demo supports a complete isolated purchase, currency and retry flow', async () => {
    const storage = new Map<string, string>();
    Object.defineProperty(globalThis, 'sessionStorage', {
        configurable: true,
        value: {
            getItem: (key: string) => storage.get(key) ?? null,
            setItem: (key: string, value: string) => storage.set(key, value),
        },
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = () => {
        throw new Error('The demo must never contact an API.');
    };
    try {
        const catalog = (await demoRequest(
            '/api/v1/products?type=sneaker&min_price=30000&sort=price',
            {},
            'pt_BR',
        )) as { data: { price: number; type: string }[] };
        assert.ok(catalog.data.length > 0);
        assert.ok(catalog.data.every((p) => p.type === 'sneaker' && p.price >= 30000));
        const before = (await demoRequest('/api/v1/cart', {}, 'en')) as {
            meta: { subtotal: number };
        };
        const portuguese = (await demoRequest('/api/v1/cart', {}, 'pt_BR')) as {
            meta: { subtotal: number };
        };
        assert.equal(before.meta.subtotal, 6900);
        assert.equal(portuguese.meta.subtotal, 32900);
        const request = {
            method: 'POST',
            headers: { 'Idempotency-Key': 'demo-test-unique-key' },
            body: JSON.stringify({
                address_id: 1,
                shipping_method: 'red',
                payment_method: 'wallet',
            }),
        };
        const purchase = (await demoRequest('/api/v1/checkout', request, 'pt_BR')) as {
            data: { id: number; total: number; currency: string };
        };
        const retry = await demoRequest('/api/v1/checkout', request, 'pt_BR');
        assert.deepEqual(retry, purchase);
        await assert.rejects(
            demoRequest('/api/v1/checkout', request, 'en'),
            (error) => error instanceof DemoError && error.status === 409,
        );
        await assert.rejects(
            demoRequest(
                '/api/v1/checkout',
                {
                    ...request,
                    body: JSON.stringify({
                        address_id: 1,
                        shipping_method: 'blue',
                        payment_method: 'wallet',
                    }),
                },
                'pt_BR',
            ),
            (error) => error instanceof DemoError && error.status === 409,
        );
        assert.equal(purchase.data.total, 35250);
        assert.equal(purchase.data.currency, 'BRL');
        assert.deepEqual(
            ((await demoRequest('/api/v1/cart', {}, 'pt_BR')) as { data: unknown[] }).data,
            [],
        );
        await demoRequest('/api/v1/notifications/read-all', { method: 'PATCH' }, 'pt_BR');
        await demoRequest(
            '/api/v1/cart/items',
            { method: 'POST', body: JSON.stringify({ product_id: 101 }) },
            'pt_BR',
        );
        const notifications = (await demoRequest('/api/v1/notifications', {}, 'pt_BR')) as {
            data: { id: string; title: string; body: string; url: string }[];
        };
        assert.equal(notifications.data[0].title, 'Produto adicionado ao carrinho');
        assert.ok(notifications.data[0].body.includes('Lume Ruby'));
        assert.equal(notifications.data[0].url, '/cart');
        assert.equal(
            (
                (await demoRequest('/api/v1/notifications/unread-count', {}, 'pt_BR')) as {
                    data: { unread_count: number };
                }
            ).data.unread_count,
            1,
        );
        await demoRequest(
            '/api/v1/notifications/' + notifications.data[0].id + '/read',
            { method: 'PATCH' },
            'pt_BR',
        );
        assert.equal(
            (
                (await demoRequest('/api/v1/notifications/unread-count', {}, 'pt_BR')) as {
                    data: { unread_count: number };
                }
            ).data.unread_count,
            0,
        );
        await demoRequest('/api/v1/notifications/read', { method: 'DELETE' }, 'pt_BR');
        assert.equal(
            ((await demoRequest('/api/v1/notifications', {}, 'pt_BR')) as { data: unknown[] }).data
                .length,
            0,
        );
        for (let index = 0; index < 16; index++) {
            await demoRequest(
                '/api/v1/cart/items',
                { method: 'POST', body: JSON.stringify({ product_id: 101 }) },
                'en',
            );
        }
        const secondPage = (await demoRequest('/api/v1/notifications?page=2', {}, 'en')) as {
            data: { id: string }[];
        };
        assert.equal(secondPage.data.length, 1);
        await demoRequest(
            '/api/v1/notifications/' + secondPage.data[0].id,
            { method: 'DELETE' },
            'en',
        );
        const afterDeletion = (await demoRequest('/api/v1/notifications?page=2', {}, 'en')) as {
            data: unknown[];
            meta: { current_page: number; last_page: number };
        };
        assert.equal(afterDeletion.meta.current_page, 1);
        assert.equal(afterDeletion.meta.last_page, 1);
        assert.equal(afterDeletion.data.length, 15);
        await demoRequest('/api/v1/notifications/read', { method: 'DELETE' }, 'en');
        assert.equal(
            (
                (await demoRequest('/api/v1/notifications/unread-count', {}, 'en')) as {
                    data: { unread_count: number };
                }
            ).data.unread_count,
            15,
        );
        const newAddress = (await demoRequest(
            '/api/v1/addresses',
            {
                method: 'POST',
                body: JSON.stringify({
                    type: 'home',
                    postal_code: '01001-000',
                    street: 'Sample Road',
                    number: '2',
                    district: 'Centro',
                    city: 'São Paulo',
                    state: 'SP',
                    is_default: false,
                }),
            },
            'en',
        )) as { data: { id: number } };
        await demoRequest(
            '/api/v1/addresses/' + newAddress.data.id,
            { method: 'PATCH', body: JSON.stringify({ is_default: true }) },
            'en',
        );
        const addresses = (await demoRequest('/api/v1/addresses', {}, 'en')) as {
            data: { id: number; is_default: boolean }[];
        };
        assert.deepEqual(
            addresses.data.filter((address) => address.is_default).map((address) => address.id),
            [newAddress.data.id],
        );
        await assert.rejects(
            demoRequest(
                '/api/v1/user/password',
                { method: 'PUT', body: JSON.stringify({ password: 'never-store-this' }) },
                'en',
            ),
            DemoError,
        );
        assert.ok(!Array.from(storage.values()).join('').includes('never-store-this'));
        await demoRequest('/api/v1/auth/logout', { method: 'POST' }, 'en');
        await assert.rejects(
            demoRequest('/api/v1/orders', {}, 'en'),
            (error) => error instanceof DemoError && error.status === 401,
        );
        await demoRequest('/api/v1/auth/login', { method: 'POST' }, 'en');
        assert.equal(
            ((await demoRequest('/api/v1/user', {}, 'en')) as { data: { name: string } }).data.name,
            'Alex Demo',
        );
    } finally {
        globalThis.fetch = originalFetch;
        Reflect.deleteProperty(globalThis, 'sessionStorage');
    }
});

test('invalid or outdated stored demo data safely restores the initial session', () => {
    for (const raw of [
        'invalid JSON',
        'null',
        '{}',
        '{"cart":{}}',
        '{"signedIn":true,"locale":"xx"}',
    ]) {
        assert.equal(restoreDemoState(raw).cart[0].quantity, 1);
    }
    const valid = restoreDemoState(null);
    assert.deepEqual(restoreDemoState(JSON.stringify(valid)), valid);
    const corrupted = { ...valid, cart: [{ id: 101, quantity: 'invalid' }] };
    assert.deepEqual(restoreDemoState(JSON.stringify(corrupted)), valid);
});
