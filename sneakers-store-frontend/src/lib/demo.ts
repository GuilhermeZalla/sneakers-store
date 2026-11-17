import catalogData from '../../../sneakers-store-backend/database/seeders/data/products.json' with { type: 'json' };
import descriptions from '../../../sneakers-store-backend/database/seeders/data/descriptions.pt_BR.json' with { type: 'json' };
import shippingData from '../../../sneakers-store-backend/database/seeders/data/shipping.json' with { type: 'json' };
const catalog = catalogData.products;
import type { StoreLocale } from './locale.ts';
import type { Address, Order } from './checkout.ts';
import type { Product } from './store.ts';

const storageKey = 'sneakers-demo-v3';
type DemoState = {
    signedIn: boolean;
    locale: StoreLocale;
    cart: { id: number; product_id: number; quantity: number; size: string; color: string }[];
    reviews: {
        id: number;
        product_id: number;
        user_id: number;
        author_name: string;
        rating: number;
        comment: string;
        created_at: string;
        updated_at: string;
    }[];
    wishlist: number[];
    addresses: Address[];
    orders: Order[];
    readNotifications: boolean;
    attempts: Record<string, { orderId: number; fingerprint: string }>;
    welcomeRemoved?: boolean;
    cartNotices?: { id: string; productName: string; created_at: string; read_at: string | null }[];
};
const initial = (): DemoState => ({
    signedIn: true,
    locale: 'en',
    cart: [{ id: 101, product_id: 101, quantity: 1, size: '38', color: 'red' }],
    reviews: [],
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
function record(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function integer(value: unknown): value is number {
    return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}
export function restoreDemoState(raw: string | null): DemoState {
    try {
        const value: unknown = JSON.parse(raw ?? 'null');
        if (
            !record(value) ||
            typeof value.signedIn !== 'boolean' ||
            !['en', 'pt_BR'].includes(String(value.locale)) ||
            typeof value.readNotifications !== 'boolean' ||
            !record(value.attempts)
        )
            return initial();
        const arrays = ['cart', 'wishlist', 'addresses', 'orders', 'reviews'];
        if (arrays.some((key) => !Array.isArray(value[key]))) return initial();
        if (
            !(value.cart as unknown[]).every(
                (item) =>
                    record(item) &&
                    integer(item.id) &&
                    integer(item.product_id) &&
                    typeof item.size === 'string' &&
                    typeof item.color === 'string' &&
                    integer(item.quantity) &&
                    item.quantity >= 1 &&
                    item.quantity <= 999,
            )
        )
            return initial();
        if (
            !(value.reviews as unknown[]).every(
                (item) =>
                    record(item) &&
                    integer(item.id) &&
                    integer(item.product_id) &&
                    integer(item.user_id) &&
                    integer(item.rating) &&
                    item.rating >= 1 &&
                    item.rating <= 5 &&
                    typeof item.comment === 'string' &&
                    item.comment.trim().length >= 5 &&
                    item.comment.length <= 2000 &&
                    typeof item.author_name === 'string' &&
                    typeof item.created_at === 'string' &&
                    typeof item.updated_at === 'string',
            )
        )
            return initial();
        if (!(value.wishlist as unknown[]).every(integer)) return initial();
        if (
            !(value.addresses as unknown[]).every(
                (item) =>
                    record(item) &&
                    integer(item.id) &&
                    typeof item.is_default === 'boolean' &&
                    ['street', 'number', 'district', 'city', 'state', 'postal_code', 'type'].every(
                        (key) => typeof item[key] === 'string',
                    ),
            )
        )
            return initial();
        if (
            !(value.orders as unknown[]).every(
                (item) =>
                    record(item) &&
                    integer(item.id) &&
                    [
                        'order_number',
                        'status',
                        'ordered_at',
                        'shipping_method',
                        'payment_method',
                        'locale',
                    ].every((key) => typeof item[key] === 'string') &&
                    ['USD', 'BRL'].includes(String(item.currency)) &&
                    ['subtotal', 'shipping_price', 'total'].every((key) => integer(item[key])) &&
                    record(item.shipping_address) &&
                    ['street', 'number', 'city', 'state', 'postal_code', 'name'].every(
                        (key) =>
                            typeof (item.shipping_address as Record<string, unknown>)[key] ===
                            'string',
                    ) &&
                    Array.isArray(item.items) &&
                    item.items.every(
                        (entry) =>
                            record(entry) &&
                            typeof entry.product_name === 'string' &&
                            integer(entry.quantity) &&
                            integer(entry.unit_price),
                    ),
            )
        )
            return initial();
        if (
            !Object.values(value.attempts).every(
                (entry) =>
                    record(entry) &&
                    integer(entry.orderId) &&
                    typeof entry.fingerprint === 'string',
            )
        )
            return initial();
        if (
            value.cartNotices !== undefined &&
            (!Array.isArray(value.cartNotices) ||
                !value.cartNotices.every(
                    (entry) =>
                        record(entry) &&
                        typeof entry.id === 'string' &&
                        typeof entry.productName === 'string' &&
                        typeof entry.created_at === 'string' &&
                        (entry.read_at === null || typeof entry.read_at === 'string'),
                ))
        )
            return initial();
        if (value.welcomeRemoved !== undefined && typeof value.welcomeRemoved !== 'boolean')
            return initial();
        return value as unknown as DemoState;
    } catch {
        return initial();
    }
}
let state: DemoState | undefined;
function session(): DemoState {
    if (!state) {
        try {
            state = restoreDemoState(sessionStorage.getItem(storageKey));
        } catch {
            state = initial();
        }
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
    try {
        sessionStorage.removeItem('checkout-attempt-1');
    } catch {
        /* In-memory reset still works when storage is blocked. */
    }
    window.location.reload();
}
export class DemoError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}
function reviewSummary(productId: number) {
    const reviews = session().reviews.filter((review) => review.product_id === productId);
    return {
        rating: reviews.length
            ? Math.round(
                  (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10,
              ) / 10
            : 0,
        review_count: reviews.length,
    };
}
function products(locale: StoreLocale): Product[] {
    return catalog.map((item) => ({
        id: Number(item.id),
        name: item.shoeName,
        slug: item.shoeName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + item.id,
        description:
            locale === 'pt_BR'
                ? descriptions[item.id as keyof typeof descriptions]
                : item.description,
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
        ...reviewSummary(Number(item.id)),
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
            const product = list.find((p) => p.id === item.product_id);
            return product
                ? [
                      {
                          id: item.id,
                          product_id: item.product_id,
                          size: item.size,
                          color: item.color,
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
        const segments = route.split('/');
        const product = list.find((p) => p.slug === decodeURIComponent(segments[4] ?? ''));
        if (!product) return fail();
        const reviewRoute = segments[5];
        if (reviewRoute === 'reviews' && method === 'GET') {
            const reviews = current.reviews
                .filter((review) => review.product_id === product.id)
                .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id);
            const own = current.signedIn
                ? (reviews.find((review) => review.user_id === 1) ?? null)
                : null;
            const serialize = (review: (typeof current.reviews)[number]) => ({
                id: review.id,
                rating: review.rating,
                comment: review.comment,
                author_name: review.author_name,
                is_mine: current.signedIn && review.user_id === 1,
                created_at: review.created_at,
                updated_at: review.updated_at,
            });
            const lastPage = Math.max(1, Math.ceil(reviews.length / 10));
            const page = Math.max(1, Math.min(lastPage, Number(url.searchParams.get('page')) || 1));
            return {
                data: reviews.slice((page - 1) * 10, page * 10).map(serialize),
                summary: reviewSummary(product.id),
                own_review: own ? serialize(own) : null,
                meta: { current_page: page, last_page: lastPage, total: reviews.length },
            };
        }
        if (reviewRoute === 'review') {
            if (!current.signedIn) return fail(401);
            const own = current.reviews.find(
                (review) => review.product_id === product.id && review.user_id === 1,
            );
            if (method === 'PUT') {
                if (
                    !Number.isInteger(body.rating) ||
                    body.rating < 1 ||
                    body.rating > 5 ||
                    typeof body.comment !== 'string' ||
                    body.comment.trim().length < 5 ||
                    body.comment.trim().length > 2000
                ) {
                    throw new DemoError(
                        422,
                        pt
                            ? 'Escolha uma nota de 1 a 5 e escreva de 5 a 2.000 caracteres.'
                            : 'Choose 1 to 5 stars and write 5 to 2,000 characters.',
                    );
                }
                const review = own ?? {
                    id: Math.max(0, ...current.reviews.map((item) => item.id)) + 1,
                    product_id: product.id,
                    user_id: 1,
                    author_name: 'Alex Demo',
                    rating: 0,
                    comment: '',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                review.rating = body.rating;
                review.comment = body.comment.trim();
                review.updated_at = new Date().toISOString();
                if (!own) current.reviews.push(review);
                save();
                return {
                    data: {
                        id: review.id,
                        rating: review.rating,
                        comment: review.comment,
                        author_name: review.author_name,
                        is_mine: true,
                        created_at: review.created_at,
                        updated_at: review.updated_at,
                    },
                };
            }
            if (method === 'DELETE') {
                if (!own) return fail();
                current.reviews = current.reviews.filter((review) => review !== own);
                save();
                return null;
            }
            return fail(405);
        }
        return !reviewRoute && method === 'GET' ? { data: product } : fail();
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
            const size = body.size ?? product.sizes[0] ?? '';
            const color = body.color ?? product.colors[0] ?? '';
            const quantity = body.quantity ?? 1;
            if (
                !(product.sizes.length ? product.sizes : ['']).includes(size) ||
                !(product.colors.length ? product.colors : ['']).includes(color) ||
                !Number.isInteger(quantity) ||
                quantity < 1 ||
                quantity > 999
            )
                return fail(422);
            const existing = current.cart.find(
                (item) =>
                    item.product_id === product.id && item.size === size && item.color === color,
            );
            if (existing) {
                if (existing.quantity + quantity > 999) return fail(422);
                existing.quantity += quantity;
            } else
                current.cart.push({
                    id: Math.max(0, ...current.cart.map((item) => item.id)) + 1,
                    product_id: product.id,
                    quantity,
                    size,
                    color,
                });
            current.cartNotices ??= [];
            current.cartNotices.unshift({
                id: crypto.randomUUID(),
                productName: product.name,
                created_at: new Date().toISOString(),
                read_at: null,
            });
            current.cartNotices = current.cartNotices.slice(0, 50);
        }
        if (method === 'PATCH') {
            const item = current.cart.find((entry) => entry.id === id);
            if (item) item.quantity = Math.max(1, Math.min(999, Number(body.quantity) || 1));
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
        if (method === 'PATCH' && address) {
            if (body.is_default === true)
                current.addresses.forEach((a) => (a.is_default = a.id === id));
            Object.assign(address, body, { id });
            if (!current.addresses.some((a) => a.is_default)) address.is_default = true;
        }
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
    const shipping = shippingData[pt ? 'BRL' : 'USD'];
    if (route === '/api/v1/shipping-methods')
        return { data: shipping, currency: pt ? 'BRL' : 'USD' };
    if (route === '/api/v1/checkout') {
        const key = new Headers(options.headers).get('Idempotency-Key') ?? '';
        if (!/^[a-zA-Z0-9_-]{16,64}$/.test(key) || body.payment_method !== 'wallet')
            return fail(422);
        current.attempts ??= {};
        const fingerprint = JSON.stringify([
            body.address_id,
            body.shipping_method,
            body.payment_method,
            locale,
        ]);
        const attempt = Object.hasOwn(current.attempts, key) ? current.attempts[key] : undefined;
        if (attempt) {
            if (attempt.fingerprint !== fingerprint) return fail(409);
            const previous = current.orders.find((o) => o.id === attempt.orderId);
            if (previous) return { data: previous };
        }
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
                size: item.size,
                color: item.color,
            })),
        };
        current.orders.unshift(order);
        current.attempts[key] = { orderId: order.id, fingerprint };
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
        if (method === 'DELETE') {
            const clearRead = route.endsWith('/read');
            const id = decodeURIComponent(route.split('/')[4] ?? '');
            if ((clearRead && current.readNotifications) || id === 'demo-welcome')
                current.welcomeRemoved = true;
            current.cartNotices = (current.cartNotices ?? []).filter((notice) =>
                clearRead ? !notice.read_at : notice.id !== id,
            );
            save();
            return null;
        }
        if (method === 'PATCH') {
            const id = decodeURIComponent(route.split('/')[4] ?? '');
            const all = route.endsWith('/read-all');
            if (all || id === 'demo-welcome') current.readNotifications = true;
            for (const notice of current.cartNotices ?? []) {
                if (all || notice.id === id) notice.read_at = new Date().toISOString();
            }
            save();
            return null;
        }
        if (route.endsWith('/unread-count'))
            return {
                data: {
                    unread_count:
                        (current.readNotifications || current.welcomeRemoved ? 0 : 1) +
                        (current.cartNotices ?? []).filter((notice) => !notice.read_at).length,
                },
            };
        const notices = (current.cartNotices ?? []).map((notice) => ({
            ...notice,
            event: 'cart_added',
            title: pt ? 'Produto adicionado ao carrinho' : 'Item added to cart',
            body: pt
                ? notice.productName + ' está na sua sacola.'
                : notice.productName + ' is in your bag.',
            url: '/cart',
        }));
        const items = [
            ...notices,
            {
                id: 'demo-welcome',
                event: 'welcome',
                title: pt ? 'Explore a demonstração' : 'Explore the demo',
                body: pt
                    ? 'Monte seu carrinho e experimente uma compra fictícia.'
                    : 'Build your cart and try a simulated purchase.',
                url: '/catalog',
                read_at: current.readNotifications ? '2026-11-16T12:00:00Z' : null,
                created_at: '2026-11-16T12:00:00Z',
            },
        ];
        const visibleItems = items.filter(
            (item) => item.id !== 'demo-welcome' || !current.welcomeRemoved,
        );
        const lastPage = Math.max(1, Math.ceil(visibleItems.length / 15));
        const page = Math.max(1, Math.min(lastPage, Number(url.searchParams.get('page')) || 1));
        return {
            data: visibleItems.slice((page - 1) * 15, page * 15),
            meta: { current_page: page, last_page: lastPage },
        };
    }
    return fail();
}
