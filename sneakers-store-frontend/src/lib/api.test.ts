import assert from 'node:assert/strict';
import test from 'node:test';
import { apiRequest, ApiError, initializeCsrf } from './api.ts';

Object.defineProperty(globalThis, 'document', {
    value: { cookie: 'other=1; XSRF-TOKEN=csrf%2Btoken' },
    configurable: true,
});

test('requests use credentials, locale and decoded CSRF token', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
        assert.equal(input, '/api/v1/auth/login');
        assert.equal(init?.credentials, 'include');
        const headers = new Headers(init?.headers);
        assert.equal(headers.get('X-XSRF-TOKEN'), 'csrf+token');
        assert.equal(headers.get('Accept-Language'), 'pt-BR');
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    };
    try {
        assert.deepEqual(
            await apiRequest('/api/v1/auth/login', { method: 'POST', body: '{}' }, 'pt_BR'),
            { ok: true },
        );
    } finally {
        globalThis.fetch = original;
    }
});

test('CSRF initialization uses the cookie endpoint', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
        assert.equal(input, '/sanctum/csrf-cookie');
        assert.equal(init?.credentials, 'include');
        return new Response(null, { status: 204 });
    };
    try {
        await initializeCsrf('en');
    } finally {
        globalThis.fetch = original;
    }
});

test('API errors preserve authentication, CSRF and validation status', async () => {
    const original = globalThis.fetch;
    try {
        for (const status of [401, 419, 422]) {
            globalThis.fetch = async () =>
                new Response(
                    JSON.stringify({ message: 'Error', errors: { email: ['Invalid email'] } }),
                    { status },
                );
            await assert.rejects(
                () => apiRequest('/api/v1/user'),
                (error: unknown) =>
                    error instanceof ApiError &&
                    error.status === status &&
                    error.errors.email[0] === 'Invalid email',
            );
        }
    } finally {
        globalThis.fetch = original;
    }
});
