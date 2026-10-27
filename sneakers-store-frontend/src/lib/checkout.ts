import { apiRequest } from './api.ts';
import type { StoreLocale } from './locale.ts';

export type Address = {
    id: number;
    type: string;
    postal_code: string;
    street: string;
    number: string;
    complement: string | null;
    reference: string | null;
    district: string;
    city: string;
    state: string;
    is_default: boolean;
};
export type AddressInput = Omit<Address, 'id'>;
export type ShippingOptions = {
    data: Record<string, { price: number; days: number }>;
    currency: string;
};
export type Order = {
    id: number;
    order_number: string;
    status: string;
    payment_method: string;
    shipping_method: string;
    currency: 'USD' | 'BRL';
    locale: string;
    subtotal: number;
    shipping_price: number;
    total: number;
    ordered_at: string;
    shipping_address: {
        name: string;
        street: string;
        number: string;
        city: string;
        state: string;
        postal_code: string;
    };
    items: {
        product_id: number | null;
        product_name: string;
        unit_price: number;
        quantity: number;
    }[];
};
export type CheckoutAttempt = {
    key: string;
    locale: StoreLocale;
    payload: { address_id: number; shipping_method: string; payment_method: 'wallet' };
};

export function createAttempt(
    addressId: number,
    shippingMethod: string,
    locale: StoreLocale,
): CheckoutAttempt {
    return {
        key: crypto.randomUUID(),
        locale,
        payload: {
            address_id: addressId,
            shipping_method: shippingMethod,
            payment_method: 'wallet',
        },
    };
}
export async function submitCheckout(attempt: CheckoutAttempt): Promise<Order> {
    const result = await apiRequest<{ data: Order }>(
        '/api/v1/checkout',
        {
            method: 'POST',
            headers: { 'Idempotency-Key': attempt.key },
            body: JSON.stringify(attempt.payload),
        },
        attempt.locale,
    );
    return result.data;
}
export function formatPostalCode(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    return digits.length > 5 ? digits.slice(0, 5) + '-' + digits.slice(5) : digits;
}
export function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, value.startsWith('+') ? 15 : 11);
    if (value.startsWith('+')) return '+' + digits;
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return '(' + digits.slice(0, 2) + ') ' + digits.slice(2);
    const split = digits.length > 10 ? 7 : 6;
    return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, split) + '-' + digits.slice(split);
}
export function formatOrderMoney(cents: number, currency: 'USD' | 'BRL'): string {
    return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', {
        style: 'currency',
        currency,
    }).format(cents / 100);
}
