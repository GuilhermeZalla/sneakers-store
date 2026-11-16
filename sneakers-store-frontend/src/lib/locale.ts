export const storeLocales = {
    en: { language: 'en-US', currency: 'USD' },
    pt_BR: { language: 'pt-BR', currency: 'BRL' },
} as const;

export type StoreLocale = keyof typeof storeLocales;
export type Currency = (typeof storeLocales)[StoreLocale]['currency'];

export function formatMoney(cents: number, locale: StoreLocale): string {
    if (!Number.isSafeInteger(cents)) {
        throw new TypeError('Money must be an integer number of cents.');
    }

    const settings = storeLocales[locale];

    return new Intl.NumberFormat(settings.language, {
        style: 'currency',
        currency: settings.currency,
    }).format(cents / 100);
}

export function formatPriceInput(cents: string | null, locale: StoreLocale): string {
    if (cents === null || !/^\d+$/.test(cents)) return '';
    return new Intl.NumberFormat(storeLocales[locale].language, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: false,
    }).format(Number(cents) / 100);
}

export function parsePriceInput(value: string, locale: StoreLocale): number | null | undefined {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const separator = locale === 'pt_BR' ? ',' : '.';
    const pattern = locale === 'pt_BR' ? /^\d+(?:,\d{1,2})?$/ : /^\d+(?:\.\d{1,2})?$/;
    if (!pattern.test(trimmed)) return undefined;
    const cents = Math.round(Number(trimmed.replace(separator, '.')) * 100);
    return Number.isSafeInteger(cents) ? cents : undefined;
}

export function formatOrderStatus(status: string, locale: StoreLocale): string {
    const labels: Record<string, [string, string]> = {
        pending: ['Pending', 'Pendente'],
        processing: ['Processing', 'Em processamento'],
        paid: ['Paid', 'Pago'],
        shipped: ['Shipped', 'Enviado'],
        delivered: ['Delivered', 'Entregue'],
        canceled: ['Canceled', 'Cancelado'],
        cancelled: ['Cancelled', 'Cancelado'],
    };
    const label = labels[status.toLowerCase()];
    return label ? label[locale === 'pt_BR' ? 1 : 0] : status;
}

export function formatProductColor(color: string, locale: StoreLocale): string {
    const colors: Record<string, string> = {
        beige: 'bege',
        black: 'preto',
        blue: 'azul',
        brown: 'marrom',
        green: 'verde',
        grey: 'cinza',
        navy: 'azul-marinho',
        orange: 'laranja',
        pink: 'rosa',
        red: 'vermelho',
        white: 'branco',
    };
    return locale === 'pt_BR' ? (colors[color.toLowerCase()] ?? color) : color;
}

export function formatProductType(type: string, locale: StoreLocale): string {
    const types: Record<string, [string, string]> = {
        sneaker: ['Sneakers', 'Tênis'],
        shirt: ['Clothing', 'Roupas'],
        cap: ['Caps', 'Bonés'],
        gift: ['Gifts', 'Presentes'],
    };
    const label = types[type.toLowerCase()];
    return label ? label[locale === 'pt_BR' ? 1 : 0] : type;
}

export function formatDate(date: string | Date, locale: StoreLocale): string {
    const value =
        typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
            ? new Date(`${date}T00:00:00Z`)
            : new Date(date);

    return new Intl.DateTimeFormat(storeLocales[locale].language, {
        dateStyle: 'short',
        timeZone: 'UTC',
    }).format(value);
}
