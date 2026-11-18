import { useEffect, useState } from 'react';
import { useLocale } from '../context/LocaleContext';
import { catalogFilterKeys } from '../lib/catalog';
import { formatPriceInput, formatProductType, parsePriceInput } from '../lib/locale';
import { Button, Select } from './ui';

type PriceKey = 'min_price' | 'max_price';
export function CatalogFilters({
    params,
    update,
    clear,
}: {
    params: URLSearchParams;
    update: (name: string, value: string) => void;
    clear: () => void;
}) {
    const { locale, money } = useLocale();
    const pt = locale === 'pt_BR';
    const [open, setOpen] = useState(false);
    const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
    useEffect(() => {
        const media = window.matchMedia('(min-width: 1024px)');
        const sync = () => setDesktop(media.matches);
        media.addEventListener('change', sync);
        sync();
        return () => media.removeEventListener('change', sync);
    }, []);
    const expanded = open || desktop;
    const min = params.get('min_price');
    const max = params.get('max_price');
    const [prices, setPrices] = useState({
        min_price: formatPriceInput(min, locale),
        max_price: formatPriceInput(max, locale),
    });
    const [error, setError] = useState<PriceKey | null>(null);
    useEffect(() => {
        setPrices({
            min_price: formatPriceInput(min, locale),
            max_price: formatPriceInput(max, locale),
        });
        setError(null);
    }, [min, max, locale]);
    const active = catalogFilterKeys.filter((key) => !!params.get(key));
    function commitPrice(key: PriceKey) {
        const cents = parsePriceInput(prices[key], locale);
        if (cents === undefined) {
            setError(key);
            return;
        }
        setError(null);
        setPrices((previous) => ({
            ...previous,
            [key]: cents === null ? '' : formatPriceInput(String(cents), locale),
        }));
        update(key, cents === null ? '' : String(cents));
    }
    const names = {
        search: pt ? 'Busca' : 'Search',
        brand: pt ? 'Marca' : 'Brand',
        type: pt ? 'Categoria' : 'Category',
        min_price: pt ? 'Mínimo' : 'Minimum',
        max_price: pt ? 'Máximo' : 'Maximum',
    };
    return (
        <section
            className="catalog-filters"
            aria-label={pt ? 'Filtros do catálogo' : 'Catalog filters'}
        >
            <div className="catalog-toolbar">
                <label>
                    {pt ? 'Buscar' : 'Search'}
                    <input
                        className="input"
                        type="search"
                        maxLength={100}
                        placeholder={pt ? 'Nome do produto' : 'Product name'}
                        value={params.get('search') || ''}
                        onChange={(event) => update('search', event.target.value)}
                    />
                </label>
                <label>
                    {pt ? 'Ordenar' : 'Sort'}
                    <Select
                        value={params.get('sort') || 'name'}
                        onChange={(event) => update('sort', event.target.value)}
                    >
                        <option value="name">{pt ? 'Nome A–Z' : 'Name A–Z'}</option>
                        <option value="-name">{pt ? 'Nome Z–A' : 'Name Z–A'}</option>
                        <option value="price">{pt ? 'Menor preço' : 'Price low to high'}</option>
                        <option value="-price">{pt ? 'Maior preço' : 'Price high to low'}</option>
                        <option value="-rating">{pt ? 'Melhor avaliação' : 'Top rated'}</option>
                        <option value="rating">{pt ? 'Menor avaliação' : 'Lowest rated'}</option>
                    </Select>
                </label>
                <Button
                    className="catalog-filter-toggle"
                    variant="secondary"
                    aria-expanded={open}
                    aria-controls="catalog-filter-fields"
                    onClick={() => setOpen((value) => !value)}
                >
                    {open
                        ? pt
                            ? 'Ocultar filtros'
                            : 'Hide filters'
                        : pt
                          ? 'Mostrar filtros'
                          : 'Show filters'}
                    {active.length ? ` (${active.length})` : ''}
                </Button>
            </div>
            <div
                id="catalog-filter-fields"
                className={'catalog-filter-reveal' + (expanded ? ' is-open' : '')}
                aria-hidden={!expanded}
                inert={!expanded}
            >
                <div className="catalog-filter-clip">
                    <div className="catalog-filter-fields">
                        <label>
                            {pt ? 'Marca' : 'Brand'}
                            <input
                                className="input"
                                value={params.get('brand') || ''}
                                onChange={(event) =>
                                    update('brand', event.target.value.toLowerCase())
                                }
                            />
                        </label>
                        <label>
                            {pt ? 'Categoria' : 'Category'}
                            <Select
                                value={params.get('type') || ''}
                                onChange={(event) => update('type', event.target.value)}
                            >
                                <option value="">{pt ? 'Todas' : 'All'}</option>
                                <option value="sneaker">{pt ? 'Tênis' : 'Sneakers'}</option>
                                <option value="shirt">{pt ? 'Roupas' : 'Clothing'}</option>
                                <option value="cap">{pt ? 'Bonés' : 'Caps'}</option>
                                <option value="gift">{pt ? 'Presentes' : 'Gifts'}</option>
                            </Select>
                        </label>
                        {(['min_price', 'max_price'] as const).map((key) => (
                            <label key={key}>
                                {key === 'min_price'
                                    ? pt
                                        ? 'Preço mínimo (R$)'
                                        : 'Minimum price ($)'
                                    : pt
                                      ? 'Preço máximo (R$)'
                                      : 'Maximum price ($)'}
                                <input
                                    className="input"
                                    type="text"
                                    inputMode="decimal"
                                    value={prices[key]}
                                    onChange={(event) =>
                                        setPrices((previous) => ({
                                            ...previous,
                                            [key]: event.target.value,
                                        }))
                                    }
                                    onBlur={() => commitPrice(key)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') event.currentTarget.blur();
                                    }}
                                    aria-invalid={error === key}
                                    aria-describedby={error === key ? key + '-error' : undefined}
                                />
                                {error === key && (
                                    <span className="field-error" id={key + '-error'} role="alert">
                                        {pt
                                            ? 'Use um valor como 150,00.'
                                            : 'Use an amount like 150.00.'}
                                    </span>
                                )}
                            </label>
                        ))}
                    </div>
                </div>
            </div>
            {!!active.length && (
                <div
                    className="catalog-active-filters"
                    role="group"
                    aria-label={pt ? 'Filtros ativos' : 'Active filters'}
                >
                    {active.map((key) => {
                        const value = params.get(key)!;
                        const display =
                            key === 'type'
                                ? formatProductType(value, locale)
                                : key.endsWith('_price') && Number.isFinite(Number(value))
                                  ? money(Number(value))
                                  : value;
                        const label = `${names[key]}: ${display}`;
                        return (
                            <button
                                className="filter-chip"
                                key={key}
                                aria-label={(pt ? 'Remover filtro: ' : 'Remove filter: ') + label}
                                onClick={() => update(key, '')}
                            >
                                {label}
                                <span aria-hidden="true">×</span>
                            </button>
                        );
                    })}
                    <button
                        className="text-button"
                        onClick={() => {
                            setPrices({ min_price: '', max_price: '' });
                            setError(null);
                            clear();
                        }}
                    >
                        {pt ? 'Limpar filtros' : 'Clear filters'}
                    </button>
                </div>
            )}
        </section>
    );
}
