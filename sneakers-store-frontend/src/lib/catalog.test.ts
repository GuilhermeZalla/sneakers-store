import assert from 'node:assert/strict';
import test from 'node:test';
import {
    clearCatalogFilters,
    productImages,
    relatedProducts,
    updateCatalogParams,
} from './catalog.ts';
import type { Product } from './store.ts';

const product = (id: number, brand = 'lume', type = 'sneaker'): Product => ({
    id,
    slug: `product-${id}`,
    name: `Product ${id}`,
    description: '',
    brand,
    type,
    price: 1000,
    currency: 'USD',
    thumbnail: '/thumb.webp',
    images: ['/image.webp'],
    colors: [],
    sizes: [],
    rating: 0,
    review_count: 0,
});

test('gallery uses unique supplied photos and falls back without inventing angles', () => {
    assert.deepEqual(
        productImages({
            images: [' /a.webp ', '/a.webp', '', '/b.webp'],
            thumbnail: '/thumb.webp',
        }),
        ['/a.webp', '/b.webp'],
    );
    assert.deepEqual(productImages({ images: [], thumbnail: '/thumb.webp' }), ['/thumb.webp']);
    assert.deepEqual(productImages({ images: [''], thumbnail: '' }), []);
});

test('related products exclude the current product, duplicates and unrelated categories', () => {
    const current = product(1);
    const input = [
        current,
        product(3, 'other'),
        product(2),
        product(2),
        product(4, 'lume', 'shirt'),
        { ...product(5), slug: current.slug },
    ];
    assert.deepEqual(
        relatedProducts(input, current).map((item) => item.id),
        [2, 3],
    );
    assert.deepEqual(
        relatedProducts(input, current, 1).map((item) => item.id),
        [2],
    );
    assert.deepEqual(relatedProducts([current], current), []);
    assert.deepEqual(
        input.map((item) => item.id),
        [1, 3, 2, 2, 4, 5],
    );
});

test('filter removal resets pagination while preserving other filters and sorting', () => {
    const original = new URLSearchParams(
        'search=Ruby&brand=lume&type=sneaker&min_price=1000&max_price=5000&sort=-price&page=3&per_page=10',
    );
    const one = updateCatalogParams(original, 'brand', '');
    assert.equal(one.has('brand'), false);
    assert.equal(one.has('page'), false);
    assert.equal(one.get('search'), 'Ruby');
    assert.equal(one.get('sort'), '-price');
    assert.equal(original.get('page'), '3');
    const cleared = clearCatalogFilters(original);
    assert.equal(cleared.toString(), 'sort=-price&per_page=10');
    assert.equal(updateCatalogParams(original, 'page', '4').get('brand'), 'lume');
    assert.equal(updateCatalogParams(original, 'page', '4').get('page'), '4');
});
