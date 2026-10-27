import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { formatMoney, storeLocales, type StoreLocale } from '../lib/locale';

type LocaleContextValue = {
    locale: StoreLocale;
    setLocale: (locale: StoreLocale) => void;
    currency: 'USD' | 'BRL';
    money: (cents: number) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
    const [locale, setLocale] = useState<StoreLocale>(() =>
        localStorage.getItem('store-locale') === 'pt_BR' ? 'pt_BR' : 'en',
    );

    useEffect(() => {
        localStorage.setItem('store-locale', locale);
        document.documentElement.lang = storeLocales[locale].language;
    }, [locale]);

    return (
        <LocaleContext.Provider
            value={{
                locale,
                setLocale,
                currency: storeLocales[locale].currency,
                money: (cents) => formatMoney(cents, locale),
            }}
        >
            {children}
        </LocaleContext.Provider>
    );
}

export function useLocale(): LocaleContextValue {
    const context = useContext(LocaleContext);
    if (!context) throw new Error('LocaleProvider is missing');
    return context;
}
