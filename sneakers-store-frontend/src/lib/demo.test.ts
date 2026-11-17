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
        // Reviews use persisted scores, never the former catalog rank.
        const productPath = '/api/v1/products/lume-ruby-101';
        const initialReviews = (await demoRequest(productPath + '/reviews', {}, 'en')) as {
            summary: { rating: number; review_count: number };
        };
        assert.equal(initialReviews.summary.review_count, 0);
        for (const rating of [5, 3]) {
            await demoRequest(
                productPath + '/review',
                {
                    method: 'PUT',
                    body: JSON.stringify({
                        rating,
                        comment: 'A comfortable pair for everyday use.',
                        user_id: 999,
                    }),
                },
                'en',
            );
            const reviews = (await demoRequest(productPath + '/reviews', {}, 'en')) as {
                data: { is_mine: boolean; author_name: string }[];
                summary: { rating: number; review_count: number };
            };
            assert.equal(reviews.summary.rating, rating);
            assert.equal(reviews.summary.review_count, 1);
            assert.equal(reviews.data[0].is_mine, true);
            assert.equal(reviews.data[0].author_name, 'Alex Demo');
            assert.equal(
                ((await demoRequest(productPath, {}, 'en')) as { data: { rating: number } }).data
                    .rating,
                rating,
            );
        }
        await assert.rejects(
            demoRequest(
                productPath + '/review',
                { method: 'PUT', body: JSON.stringify({ rating: 6, comment: 'Valid comment' }) },
                'en',
            ),
            (error) => error instanceof DemoError && error.status === 422,
        );
        await demoRequest('/api/v1/auth/logout', { method: 'POST' }, 'en');
        assert.equal(
            (
                (await demoRequest(productPath + '/reviews', {}, 'en')) as {
                    data: { is_mine: boolean }[];
                }
            ).data[0].is_mine,
            false,
        );
        await assert.rejects(
            demoRequest(productPath + '/review', { method: 'DELETE' }, 'en'),
            (error) => error instanceof DemoError && error.status === 401,
        );
        await demoRequest('/api/v1/auth/login', { method: 'POST' }, 'en');
        await demoRequest(productPath + '/review', { method: 'DELETE' }, 'en');
        assert.equal(
            (
                (await demoRequest(productPath + '/reviews', {}, 'en')) as {
                    summary: { review_count: number };
                }
            ).summary.review_count,
            0,
        );
        await demoRequest('/api/v1/cart', { method: 'DELETE' }, 'en');
        for (const size of ['40', '40', '42']) {
            await demoRequest(
                '/api/v1/cart/items',
                {
                    method: 'POST',
                    body: JSON.stringify({ product_id: 101, size, color: 'red', quantity: 1 }),
                },
                'en',
            );
        }
        const variants = (await demoRequest('/api/v1/cart', {}, 'en')) as {
            data: { id: number; size: string; color: string; quantity: number }[];
        };
        assert.equal(variants.data.length, 2);
        assert.equal(variants.data[0].quantity, 2);
        assert.equal(variants.data[1].size, '42');
        assert.notEqual(variants.data[0].id, variants.data[1].id);
        await assert.rejects(
            demoRequest(
                '/api/v1/cart/items',
                {
                    method: 'POST',
                    body: JSON.stringify({ product_id: 101, size: '99', color: 'red' }),
                },
                'en',
            ),
            (error) => error instanceof DemoError && error.status === 422,
        );
        const variantPurchase = (await demoRequest(
            '/api/v1/checkout',
            {
                method: 'POST',
                headers: { 'Idempotency-Key': 'demo-variant-purchase-1234' },
                body: JSON.stringify({
                    address_id: 1,
                    shipping_method: 'blue',
                    payment_method: 'wallet',
                }),
            },
            'en',
        )) as { data: { items: { size: string; color: string; quantity: number }[] } };
        assert.deepEqual(
            variantPurchase.data.items.map(({ size, color, quantity }) => ({
                size,
                color,
                quantity,
            })),
            [
                { size: '40', color: 'red', quantity: 2 },
                { size: '42', color: 'red', quantity: 1 },
            ],
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
