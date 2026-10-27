import assert from 'node:assert/strict';
import test from 'node:test';
import {
    createAttempt,
    submitCheckout,
    formatPostalCode,
    formatPhone,
    formatOrderMoney,
} from './checkout.ts';

Object.defineProperty(globalThis, 'document', {
    value: { cookie: 'XSRF-TOKEN=token' },
    configurable: true,
});

test('checkout retries reuse the same idempotency key and frozen payload', async () => {
    const attempt = createAttempt(4, 'blue', 'pt_BR');
    const original = globalThis.fetch;
    const calls: { key: string | null; language: string | null; body: string }[] = [];
    globalThis.fetch = async (_url, init) => {
        const headers = new Headers(init?.headers);
        calls.push({
            key: headers.get('Idempotency-Key'),
            language: headers.get('Accept-Language'),
            body: String(init?.body),
        });
        if (calls.length === 1) throw new TypeError('network');
        return new Response(JSON.stringify({ data: { id: 7, total: 17535, currency: 'BRL' } }), {
            status: 200,
        });
    };
    try {
        await assert.rejects(() => submitCheckout(attempt), TypeError);
        const order = await submitCheckout(attempt);
        assert.deepEqual(calls[0], calls[1]);
        assert.equal(calls[0].key, attempt.key);
        assert.equal(calls[0].language, 'pt-BR');
        assert.deepEqual(JSON.parse(calls[0].body), {
            address_id: 4,
            shipping_method: 'blue',
            payment_method: 'wallet',
        });
        assert.equal(order.total, 17535);
    } finally {
        globalThis.fetch = original;
    }
});

test('postal code and telephone masks preserve identifiers as strings', () => {
    assert.equal(formatPostalCode('01234567'), '01234-567');
    assert.equal(formatPostalCode('012'), '012');
    assert.equal(formatPhone('11999999999'), '(11) 99999-9999');
    assert.equal(formatPhone('+5511999999999'), '+5511999999999');
});

test('order values retain their saved currency regardless of current language', () => {
    assert.equal(formatOrderMoney(123456, 'USD'), '$1,234.56');
    assert.equal(formatOrderMoney(123456, 'BRL').replace(/\s/g, ' '), 'R$ 1.234,56');
});
