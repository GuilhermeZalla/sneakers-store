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
