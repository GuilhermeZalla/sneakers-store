import { apiRequest } from './api.ts';
import type { StoreLocale } from './locale.ts';

export type Product = {
    id: number;
    slug: string;
    name: string;
    description: string;
    brand: string;
    type: string;
    price: number;
    currency: string;
    thumbnail: string;
    images: string[];
    colors: string[];
    sizes: string[];
    rating: number;
};
export type WishlistItem = { id: number; product_id: number; product: Product };
export type CartItem = {
    id: number;
    product_id: number;
    product: Product;
    quantity: number;
    unit_price: number;
    currency: string;
    subtotal: number;
};
export type Cart = { data: CartItem[]; meta: { currency: string; subtotal: number } };

export const storeApi = {
    cart: (locale: StoreLocale) => apiRequest<Cart>('/api/v1/cart', {}, locale),
    addCart: (productId: number, quantity: number, locale: StoreLocale) =>
        apiRequest(
            '/api/v1/cart/items',
            { method: 'POST', body: JSON.stringify({ product_id: productId, quantity }) },
            locale,
        ),
    updateCart: (id: number, quantity: number, locale: StoreLocale) =>
        apiRequest(
            '/api/v1/cart/items/' + id,
            { method: 'PATCH', body: JSON.stringify({ quantity }) },
            locale,
        ),
    removeCart: (id: number, locale: StoreLocale) =>
        apiRequest('/api/v1/cart/items/' + id, { method: 'DELETE' }, locale),
    clearCart: (locale: StoreLocale) => apiRequest('/api/v1/cart', { method: 'DELETE' }, locale),
    wishlist: (locale: StoreLocale) =>
        apiRequest<{ data: WishlistItem[] }>('/api/v1/wishlist', {}, locale),
    addWishlist: (productId: number, locale: StoreLocale) =>
        apiRequest(
            '/api/v1/wishlist',
            { method: 'POST', body: JSON.stringify({ product_id: productId }) },
            locale,
        ),
    removeWishlist: (id: number, locale: StoreLocale) =>
        apiRequest('/api/v1/wishlist/' + id, { method: 'DELETE' }, locale),
};
