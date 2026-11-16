import catalog from './demo-catalog.json' with { type: 'json' };
import type { StoreLocale } from './locale.ts';
import type { Address, Order } from './checkout.ts';
import type { Product } from './store.ts';

const storageKey = 'sneakers-demo-v1';
type DemoState = {
    signedIn: boolean;
    locale: StoreLocale;
    cart: { id: number; quantity: number }[];
    wishlist: number[];
    addresses: Address[];
    orders: Order[];
    readNotifications: boolean;
    attempts: Record<string, number>;
};
const initial = (): DemoState => ({
    signedIn: true,
    locale: 'en',
    cart: [{ id: 101, quantity: 1 }],
    wishlist: [102],
    addresses: [
        {
            id: 1,
            type: 'home',
            postal_code: '01001-000',
            street: 'Rua Exemplo',
            number: '100',
            complement: null,
            reference: null,
            district: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            is_default: true,
        },
    ],
    orders: [],
    readNotifications: false,
    attempts: {},
});
let state: DemoState | undefined;
function session(): DemoState {
    if (!state) {
        try {
            state = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null') as
                | DemoState
                | undefined;
        } catch {
            /* A fresh session remains usable when stored demo data is unavailable. */
        }
        state ??= initial();
    }
    return state;
}
function save() {
    try {
        sessionStorage.setItem(storageKey, JSON.stringify(session()));
    } catch {
        /* Demo works in memory when storage is unavailable. */
    }
}
export function resetDemo() {
    state = initial();
    save();
    sessionStorage.removeItem('checkout-attempt-1');
    window.location.reload();
}
export class DemoError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}
function products(locale: StoreLocale): Product[] {
    return catalog.map((item) => ({
        id: Number(item.id),
        name: item.shoeName,
        slug: item.shoeName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + item.id,
        description: locale === 'pt_BR' ? item.description_pt_br : item.description,
        brand: item.brand,
        type: item.type,
        price:
            locale === 'pt_BR'
                ? (item.price_brl ?? Number(item.price) * 500)
                : Number(item.price) * 100,
        currency: locale === 'pt_BR' ? 'BRL' : 'USD',
        thumbnail: item.thumbnail,
        images: [item.image_url].flat(),
        colors: item.color,
        sizes: item.size ?? [],
        rating: item.rank,
    }));
}
export async function demoRequest(
    path: string,
    options: RequestInit,
    locale: StoreLocale,
): Promise<unknown> {
    const current = session();
    const url = new URL(path, 'https://demo.invalid');
    const route = url.pathname;
    const method = options.method ?? 'GET';
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    const pt = locale === 'pt_BR';
    const fail = (status = 404) => {
        throw new DemoError(
            status,
            pt
                ? 'Esta ação não está disponível na demonstração.'
                : 'This action is unavailable in the demo.',
        );
    };
    const list = products(locale);
    const user = () => ({
        id: 1,
        name: 'Alex Demo',
        email: 'alex@example.test',
        locale: current.locale,
        email_verified_at: '2026-11-16T12:00:00Z',
        phone: '11999990000',
        birthday: '1995-06-15',
        gender: 'not_informed',
        second_contact: null,
    });
    const cart = () => {
        const data = current.cart.flatMap((item) => {
            const product = list.find((p) => p.id === item.id);
            return product
                ? [
                      {
                          id: item.id,
                          product_id: item.id,
                          product,
                          quantity: item.quantity,
                          unit_price: product.price,
                          currency: product.currency,
                          subtotal: product.price * item.quantity,
                      },
                  ]
                : [];
        });
        return {
            data,
            meta: {
                currency: pt ? 'BRL' : 'USD',
                subtotal: data.reduce((sum, item) => sum + item.subtotal, 0),
            },
        };
    };
    if (route === '/sanctum/csrf-cookie') return null;
    if (route === '/api/v1/products') {
        let filtered = list.filter(
            (p) =>
                (!url.searchParams.get('search') ||
                    (p.name + ' ' + p.description)
                        .toLowerCase()
                        .includes(url.searchParams.get('search')!.toLowerCase())) &&
                (!url.searchParams.get('brand') || p.brand === url.searchParams.get('brand')) &&
                (!url.searchParams.get('type') || p.type === url.searchParams.get('type')) &&
                (!url.searchParams.has('min_price') ||
                    p.price >= Number(url.searchParams.get('min_price'))) &&
                (!url.searchParams.has('max_price') ||
                    p.price <= Number(url.searchParams.get('max_price'))),
        );
        const sort = url.searchParams.get('sort') ?? 'name';
        filtered = filtered.sort((a, b) => {
            const field = sort.replace('-', '');
            const difference =
                field === 'price'
                    ? a.price - b.price
                    : field === 'rating'
                      ? a.rating - b.rating
                      : a.name.localeCompare(b.name);
            return sort.startsWith('-') ? -difference : difference;
        });
        const perPage = Math.max(1, Math.min(30, Number(url.searchParams.get('per_page')) || 30));
        const lastPage = Math.max(1, Math.ceil(filtered.length / perPage));
        const page = Math.max(1, Math.min(lastPage, Number(url.searchParams.get('page')) || 1));
        return {
            data: filtered.slice((page - 1) * perPage, page * perPage),
            meta: { current_page: page, last_page: lastPage, total: filtered.length },
        };
    }
    if (route.startsWith('/api/v1/products/')) {
        const product = list.find((p) => p.slug === decodeURIComponent(route.split('/').at(-1)!));
        return product ? { data: product } : fail();
    }
    if (route === '/api/v1/auth/login') {
        current.signedIn = true;
        current.locale = locale;
        save();
        return null;
    }
    if (route === '/api/v1/auth/logout') {
        current.signedIn = false;
        save();
        return null;
    }
    if (route.startsWith('/api/v1/auth/')) return fail(403);
    if (!current.signedIn) return fail(401);
    if (route === '/api/v1/user/locale') {
        current.locale = locale;
        save();
        return { data: user() };
    }
    if (route === '/api/v1/user') {
        if (method !== 'GET') return fail(403);
        return { data: user() };
    }
    if (route === '/api/v1/user/password') return fail(403);
    if (route.startsWith('/api/v1/cart')) {
        const id = Number(route.split('/').at(-1));
        if (method === 'DELETE')
            current.cart = route.endsWith('/cart')
                ? []
                : current.cart.filter((item) => item.id !== id);
        if (method === 'POST') {
            const product = list.find((p) => p.id === Number(body.product_id));
            if (!product) return fail();
            const existing = current.cart.find((item) => item.id === product.id);
            if (existing) existing.quantity += 1;
            else current.cart.push({ id: product.id, quantity: 1 });
        }
        if (method === 'PATCH') {
            const item = current.cart.find((entry) => entry.id === id);
            if (item) item.quantity = Math.max(1, Math.min(99, Number(body.quantity) || 1));
        }
        save();
        return cart();
    }
    if (route.startsWith('/api/v1/wishlist')) {
        if (method === 'POST' && !current.wishlist.includes(Number(body.product_id)))
            current.wishlist.push(Number(body.product_id));
        if (method === 'DELETE')
            current.wishlist = current.wishlist.filter(
                (id) => id !== Number(route.split('/').at(-1)),
            );
        save();
        return {
            data: current.wishlist.flatMap((id) => {
                const product = list.find((p) => p.id === id);
                return product ? [{ id, product_id: id, product }] : [];
            }),
        };
    }
    if (route.startsWith('/api/v1/addresses')) {
        const id = Number(route.split('/')[4]);
        if (method === 'POST') {
            if (current.addresses.length >= 4) return fail(422);
            const address = { ...body, id: Date.now() } as Address;
            if (address.is_default || !current.addresses.length) {
                current.addresses.forEach((a) => (a.is_default = false));
                address.is_default = true;
            }
            current.addresses.push(address);
            save();
            return { data: address };
        }
        const address = current.addresses.find((a) => a.id === id);
        if (method === 'PATCH' && address) Object.assign(address, body, { id });
        if (method === 'PUT' && address)
            current.addresses.forEach((a) => (a.is_default = a.id === id));
        if (method === 'DELETE') {
            current.addresses = current.addresses.filter((a) => a.id !== id);
            if (current.addresses.length && !current.addresses.some((a) => a.is_default))
                current.addresses[0].is_default = true;
        }
        save();
        return { data: address ?? current.addresses };
    }
    const shipping = {
        blue: { price: pt ? 7535 : 1507, days: 4 },
        sedex: { price: pt ? 4450 : 890, days: 2 },
        fedex: { price: pt ? 11010 : 2202, days: 5 },
        red: { price: pt ? 2350 : 470, days: 7 },
    };
    if (route === '/api/v1/shipping-methods')
        return { data: shipping, currency: pt ? 'BRL' : 'USD' };
    if (route === '/api/v1/checkout') {
        const key = new Headers(options.headers).get('Idempotency-Key') ?? '';
        current.attempts ??= {};
        const previous = current.orders.find((o) => o.id === current.attempts[key]);
        if (previous) return { data: previous };
        const address = current.addresses.find((a) => a.id === body.address_id);
        const delivery = shipping[body.shipping_method as keyof typeof shipping];
        const summary = cart();
        if (!address || !delivery || !summary.data.length) return fail(422);
        const order: Order = {
            id: Date.now(),
            order_number: 'DEMO-' + String(current.orders.length + 1).padStart(4, '0'),
            status: 'pending',
            payment_method: 'wallet',
            shipping_method: body.shipping_method,
            currency: pt ? 'BRL' : 'USD',
            locale,
            subtotal: summary.meta.subtotal,
            shipping_price: delivery.price,
            total: summary.meta.subtotal + delivery.price,
            ordered_at: new Date().toISOString(),
            shipping_address: { ...address, name: 'Alex Demo' },
            items: summary.data.map((item) => ({
                product_id: item.product_id,
                product_name: item.product.name,
                unit_price: item.unit_price,
                quantity: item.quantity,
            })),
        };
        current.orders.unshift(order);
        current.attempts[key] = order.id;
        current.cart = [];
        save();
        return { data: order };
    }
    if (route === '/api/v1/orders')
        return { data: current.orders, meta: { current_page: 1, last_page: 1 } };
    if (route.startsWith('/api/v1/orders/')) {
        const order = current.orders.find((o) => o.id === Number(route.split('/').at(-1)));
        return order ? { data: order } : fail();
    }
    if (route.startsWith('/api/v1/notifications')) {
        if (method === 'PATCH') {
            current.readNotifications = true;
            save();
            return null;
        }
        if (route.endsWith('/unread-count'))
            return { data: { unread_count: current.readNotifications ? 0 : 1 } };
        return {
            data: [
                {
                    id: 'demo-welcome',
                    event: 'welcome',
                    title: pt ? 'Explore a demonstração' : 'Explore the demo',
                    body: pt
                        ? 'Monte seu carrinho e experimente uma compra fictícia.'
                        : 'Build your cart and try a simulated purchase.',
                    url: '/catalog',
                    read_at: current.readNotifications ? new Date().toISOString() : null,
                    created_at: '2026-11-16T12:00:00Z',
                },
            ],
            meta: { current_page: 1, last_page: 1 },
        };
    }
    return fail();
}
