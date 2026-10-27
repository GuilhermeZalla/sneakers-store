import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
    NotificationIndicator,
    notificationApi,
    notificationLabel,
    POLL_INTERVAL,
} from './notifications.ts';

Object.defineProperty(globalThis, 'document', {
    value: { cookie: 'XSRF-TOKEN=csrf-token' },
    configurable: true,
});
test('notification bell exposes an accessible localized unread count and caps the visible badge', () => {
    for (const locale of ['en', 'pt_BR'] as const) {
        const html = renderToStaticMarkup(
            createElement(NotificationIndicator, { count: 120, locale }),
        );
        assert.ok(html.includes(notificationLabel(120, locale)));
        assert.ok(html.includes('99+'));
        assert.ok(html.includes('aria-hidden="true"'));
    }
    const empty = renderToStaticMarkup(
        createElement(NotificationIndicator, { count: 0, locale: 'pt_BR' }),
    );
    assert.ok(empty.includes('Notificações: 0 não lidas'));
    assert.ok(!empty.includes('class="notification-count"'));
});
test('notification API uses paginated lists and server counts with session cookies', async () => {
    const original = globalThis.fetch;
    const calls: { path: string; method: string }[] = [];
    globalThis.fetch = async (input, init) => {
        calls.push({ path: String(input), method: init?.method ?? 'GET' });
        assert.equal(init?.credentials, 'include');
        assert.equal(new Headers(init?.headers).get('Accept-Language'), 'pt-BR');
        if (init?.method === 'PATCH') {
            assert.equal(new Headers(init.headers).get('X-XSRF-TOKEN'), 'csrf-token');
            return new Response(null, { status: 204 });
        }
        return new Response(JSON.stringify({ data: { unread_count: 3 } }), { status: 200 });
    };
    try {
        await notificationApi.list(2, 'pt_BR');
        assert.equal((await notificationApi.count('pt_BR')).data.unread_count, 3);
        await notificationApi.read('notification-id', 'pt_BR');
        await notificationApi.readAll('pt_BR');
        assert.deepEqual(calls, [
            { path: '/api/v1/notifications?page=2', method: 'GET' },
            { path: '/api/v1/notifications/unread-count', method: 'GET' },
            { path: '/api/v1/notifications/notification-id/read', method: 'PATCH' },
            { path: '/api/v1/notifications/read-all', method: 'PATCH' },
        ]);
        assert.ok(POLL_INTERVAL >= 30_000);
    } finally {
        globalThis.fetch = original;
    }
});
test('notification API failures remain errors instead of replacing the unread count with zero', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async () => new Response('{}', { status: 503 });
    try {
        await assert.rejects(() => notificationApi.count('en'));
    } finally {
        globalThis.fetch = original;
    }
});
