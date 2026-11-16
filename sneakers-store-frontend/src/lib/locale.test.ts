import assert from 'node:assert/strict';
import test from 'node:test';
import {
    formatDate,
    formatMoney,
    formatOrderStatus,
    formatPriceInput,
    formatProductColor,
    formatProductType,
    parsePriceInput,
    storeLocales,
} from './locale.ts';

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

test('price fields display currency units while keeping cent-based filters', () => {
    assert.equal(formatPriceInput('12345', 'pt_BR'), '123,45');
    assert.equal(formatPriceInput('12345', 'en'), '123.45');
    assert.equal(parsePriceInput('123,45', 'pt_BR'), 12345);
    assert.equal(parsePriceInput('123.45', 'en'), 12345);
    assert.equal(parsePriceInput('', 'pt_BR'), null);
    assert.equal(parsePriceInput('123,456', 'pt_BR'), undefined);
    assert.equal(parsePriceInput('-1', 'en'), undefined);
});

test('customer-facing product and order labels follow the selected language', () => {
    assert.equal(formatOrderStatus('pending', 'pt_BR'), 'Pendente');
    assert.equal(formatOrderStatus('shipped', 'en'), 'Shipped');
    assert.equal(formatOrderStatus('custom', 'pt_BR'), 'custom');
    assert.equal(formatProductColor('black', 'pt_BR'), 'preto');
    assert.equal(formatProductColor('black', 'en'), 'black');
    assert.equal(formatProductType('sneaker', 'pt_BR'), 'Tênis');
});
