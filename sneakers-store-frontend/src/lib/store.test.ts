import assert from 'node:assert/strict';
import test from 'node:test';
import { storeApi } from './store.ts';

Object.defineProperty(globalThis, 'document', {
    value: { cookie: 'XSRF-TOKEN=token' },
    configurable: true,
});

test('cart mutations send identifiers and quantities, never client prices', async () => {
    const original = globalThis.fetch;
    const calls: { path: string; method: string; body: unknown; language: string | null }[] = [];
    globalThis.fetch = async (input, init) => {
        calls.push({
            path: String(input),
            method: init?.method ?? 'GET',
            body: init?.body ? JSON.parse(String(init.body)) : null,
            language: new Headers(init?.headers).get('Accept-Language'),
        });
        return new Response(null, { status: 204 });
    };
    try {
        await storeApi.addCart(12, 1, 'pt_BR');
        await storeApi.updateCart(7, 3, 'pt_BR');
        await storeApi.removeCart(7, 'pt_BR');
        await storeApi.clearCart('pt_BR');
        assert.deepEqual(
            calls.map(({ path, method, body }) => ({ path, method, body })),
            [
                {
                    path: '/api/v1/cart/items',
                    method: 'POST',
                    body: { product_id: 12, quantity: 1 },
                },
                { path: '/api/v1/cart/items/7', method: 'PATCH', body: { quantity: 3 } },
                { path: '/api/v1/cart/items/7', method: 'DELETE', body: null },
                { path: '/api/v1/cart', method: 'DELETE', body: null },
            ],
        );
        assert.ok(calls.every((call) => call.language === 'pt-BR'));
    } finally {
        globalThis.fetch = original;
    }
});

test('wishlist uses product id to add and wishlist record id to remove', async () => {
    const original = globalThis.fetch;
    const calls: [string, string, unknown][] = [];
    globalThis.fetch = async (input, init) => {
        calls.push([
            String(input),
            init?.method ?? 'GET',
            init?.body ? JSON.parse(String(init.body)) : null,
        ]);
        return new Response(null, { status: 204 });
    };
    try {
        await storeApi.addWishlist(12, 'en');
        await storeApi.removeWishlist(7, 'en');
        assert.deepEqual(calls, [
            ['/api/v1/wishlist', 'POST', { product_id: 12 }],
            ['/api/v1/wishlist/7', 'DELETE', null],
        ]);
    } finally {
        globalThis.fetch = original;
    }
});

test('cart totals are read from the server for the selected currency', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async (_input, init) => {
        assert.equal(new Headers(init?.headers).get('Accept-Language'), 'pt-BR');
        return new Response(
            JSON.stringify({ data: [], meta: { currency: 'BRL', subtotal: 4567 } }),
            { status: 200 },
        );
    };
    try {
        assert.equal((await storeApi.cart('pt_BR')).meta.subtotal, 4567);
    } finally {
        globalThis.fetch = original;
    }
});
