import assert from 'node:assert/strict';
import test from 'node:test';
import { formatDate, formatMoney, storeLocales } from './locale.ts';

test('language selects its fixed currency and monetary formatting', () => {
    assert.equal(storeLocales.en.currency, 'USD');
    assert.equal(storeLocales.pt_BR.currency, 'BRL');
    assert.equal(formatMoney(123456, 'en'), '$1,234.56');
    assert.equal(formatMoney(123456, 'pt_BR').replace(/\s/g, ' '), 'R$ 1.234,56');
    assert.throws(() => formatMoney(12.5, 'en'), TypeError);
});

test('date-only values keep the same day in both languages', () => {
    assert.equal(formatDate('2026-10-26', 'pt_BR'), '26/10/2026');
    assert.equal(formatDate('2026-10-26', 'en'), '10/26/26');
});
