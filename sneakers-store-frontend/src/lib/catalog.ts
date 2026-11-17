import type { Product } from './store.ts';

export const catalogFilterKeys = ['search', 'brand', 'type', 'min_price', 'max_price'] as const;

export function updateCatalogParams(params: URLSearchParams, name: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    if (name !== 'page') next.delete('page');
    return next;
}

export function clearCatalogFilters(params: URLSearchParams) {
    const next = new URLSearchParams(params);
    catalogFilterKeys.forEach((key) => next.delete(key));
    next.delete('page');
    return next;
}

export function productImages(product: Pick<Product, 'images' | 'thumbnail'>) {
    const images = [...new Set(product.images.map((src) => src.trim()).filter(Boolean))];
    return images.length ? images : product.thumbnail ? [product.thumbnail] : [];
}

export function relatedProducts(products: Product[], current: Product, limit = 4) {
    const seen = new Set<number>();
    return products
        .filter((product) => {
            if (
                product.id === current.id ||
                product.slug === current.slug ||
                product.type !== current.type ||
                seen.has(product.id)
            )
                return false;
            seen.add(product.id);
            return true;
        })
        .sort(
            (a, b) =>
                Number(b.brand === current.brand) - Number(a.brand === current.brand) ||
                a.name.localeCompare(b.name) ||
                a.id - b.id,
        )
        .slice(0, Math.max(0, limit));
}
