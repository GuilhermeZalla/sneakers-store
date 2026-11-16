import assert from 'node:assert/strict';
import test from 'node:test';
import { demoRequest, DemoError } from './demo.ts';

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
        assert.equal(purchase.data.total, 35250);
        assert.equal(purchase.data.currency, 'BRL');
        assert.deepEqual(
            ((await demoRequest('/api/v1/cart', {}, 'pt_BR')) as { data: unknown[] }).data,
            [],
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
