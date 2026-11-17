import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ProductGallery } from '../components/ProductGallery';
import { CatalogFilters } from '../components/CatalogFilters';
import { clearCatalogFilters, relatedProducts, updateCatalogParams } from '../lib/catalog';
import { FavoriteButton, ProductCard } from '../components/ProductCard';
import { ProductReviews, RatingSummary } from '../components/ProductReviews';
import { VariantDetails } from '../components/VariantDetails';
import type { ReviewSummary } from '../lib/reviews';
import { ProductImage } from '../components/ProductImage';
import { Button, Select } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { useStore } from '../context/StoreContext';
import { apiRequest } from '../lib/api';
import { formatProductColor, formatProductType } from '../lib/locale';
import type { Product } from '../lib/store';

type ProductList = {
    data: Product[];
    meta: { current_page: number; last_page: number; total: number };
};
function ListStatus({
    loading,
    error,
    empty,
    retry,
}: {
    loading: boolean;
    error: boolean;
    empty: boolean;
    retry: () => void;
}) {
    const { locale } = useLocale();
    const pt = locale === 'pt_BR';
    if (loading)
        return (
            <p className="list-message" role="status">
                {pt ? 'Carregando...' : 'Loading...'}
            </p>
        );
    if (error)
        return (
            <div className="list-message" role="alert">
                <p>
                    {pt
                        ? 'Não foi possível carregar. Tente novamente.'
                        : 'Could not load. Please try again.'}
                </p>
                <Button onClick={retry}>{pt ? 'Tentar novamente' : 'Try again'}</Button>
            </div>
        );
    if (empty)
        return <p className="list-message">{pt ? 'Nenhum item encontrado.' : 'No items found.'}</p>;
    return null;
}
function useProducts(query: string) {
    const { locale } = useLocale();
    const [data, setData] = useState<ProductList | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(false);
        setData(null);
        apiRequest<ProductList>('/api/v1/products?' + query, {}, locale)
            .then((result) => {
                if (active) setData(result);
            })
            .catch(() => {
                if (active) setError(true);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [query, locale, retry]);
    return { data, loading, error, retry: () => setRetry((v) => v + 1) };
}
function Grid({ products }: { products: Product[] }) {
    return (
        <div className="product-grid">
            {products.map((product) => (
                <ProductCard product={product} key={product.id} />
            ))}
        </div>
    );
}

export function HomePage() {
    const { locale } = useLocale();
    const pt = locale === 'pt_BR';
    const { data, loading, error, retry } = useProducts('type=sneaker&per_page=8');
    return (
        <main>
            <section className="store-hero">
                <span className="store-eyebrow">
                    ✳ SNEAKERS / {pt ? 'PARA TODOS OS CAMINHOS' : 'FOR EVERY MOVE'}
                </span>
                <h1>
                    {pt ? (
                        <>
                            SEU PASSO.
                            <br />
                            SEU ESTILO.
                        </>
                    ) : (
                        <>
                            YOUR STEP.
                            <br />
                            YOUR STYLE.
                        </>
                    )}
                </h1>
                <p>{pt ? 'Encontre seu próximo favorito.' : 'Find your next favorite.'}</p>
                <Link className="store-link-button" to="/catalog">
                    {pt ? 'VER CATÁLOGO' : 'SHOP THE COLLECTION'} ↗
                </Link>
                <Link
                    className="store-hero-feature"
                    to="/products/lume-ruby-101"
                    aria-label={
                        pt ? 'Conhecer o tênis Lume Ruby' : 'Explore the Lume Ruby sneakers'
                    }
                >
                    <img
                        src={import.meta.env.BASE_URL + 'products/lume-ruby.webp'}
                        alt={pt ? 'Tênis vermelho Lume Ruby' : 'Red Lume Ruby sneakers'}
                        width="440"
                        height="360"
                    />
                    <span>
                        Lume Ruby <span aria-hidden="true">↗</span>
                    </span>
                </Link>
            </section>
            <section className="store-section">
                <div className="section-heading">
                    <div>
                        <span className="store-eyebrow">
                            {pt ? 'ESCOLHAS PARA VOCÊ' : 'PICKS FOR YOU'}
                        </span>
                        <h2>{pt ? 'EM DESTAQUE.' : 'THE LINEUP.'}</h2>
                    </div>
                    <Link to="/catalog">{pt ? 'Ver tudo ↗' : 'View all ↗'}</Link>
                </div>
                <ListStatus
                    loading={loading}
                    error={error}
                    empty={!data?.data.length}
                    retry={retry}
                />
                {!loading && !error && data && <Grid products={data.data} />}
            </section>
        </main>
    );
}
export function CatalogPage() {
    const { locale } = useLocale();
    const pt = locale === 'pt_BR';
    const [params, setParams] = useSearchParams();
    const latestParams = useRef(params);
    useEffect(() => {
        latestParams.current = params;
    }, [params]);
    const query = params.toString();
    const { data, loading, error, retry } = useProducts(query);
    function update(name: string, value: string) {
        const next = updateCatalogParams(latestParams.current, name, value);
        latestParams.current = next;
        setParams(next);
    }
    function clearFilters() {
        const next = clearCatalogFilters(latestParams.current);
        latestParams.current = next;
        setParams(next);
    }
    return (
        <main className="store-section">
            <div className="catalog-heading">
                <span className="store-eyebrow">✳ {pt ? 'A COLEÇÃO' : 'THE COLLECTION'}</span>
                <h1>{pt ? 'ENCONTRE SEU PAR.' : 'FIND YOUR PAIR.'}</h1>
                <p>{pt ? 'Escolha o que combina com você.' : 'Find what moves you.'}</p>
            </div>
            <CatalogFilters params={params} update={update} clear={clearFilters} />
            <ListStatus loading={loading} error={error} empty={!data?.data.length} retry={retry} />
            {!loading && !error && data && (
                <>
                    <p className="result-count">
                        {data.meta.total}{' '}
                        {pt
                            ? data.meta.total === 1
                                ? 'produto'
                                : 'produtos'
                            : data.meta.total === 1
                              ? 'product'
                              : 'products'}
                    </p>
                    <Grid products={data.data} />
                    <div className="pagination">
                        <Button
                            variant="secondary"
                            disabled={data.meta.current_page <= 1}
                            onClick={() => update('page', String(data.meta.current_page - 1))}
                        >
                            {pt ? 'Anterior' : 'Previous'}
                        </Button>
                        <span>
                            {data.meta.current_page} / {data.meta.last_page}
                        </span>
                        <Button
                            variant="secondary"
                            disabled={data.meta.current_page >= data.meta.last_page}
                            onClick={() => update('page', String(data.meta.current_page + 1))}
                        >
                            {pt ? 'Próxima' : 'Next'}
                        </Button>
                    </div>
                </>
            )}
        </main>
    );
}
export function ProductPage() {
    const { slug } = useParams();
    const { locale, money } = useLocale();
    const pt = locale === 'pt_BR';
    const { user } = useAuth();
    const { addCart, busy, cartError } = useStore();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [retry, setRetry] = useState(0);
    const [added, setAdded] = useState(false);
    const [size, setSize] = useState('');
    const [color, setColor] = useState('');
    const updateRating = useCallback(
        (summary: ReviewSummary) =>
            setProduct((current) => (current ? { ...current, ...summary } : current)),
        [],
    );
    useEffect(() => {
        setSize('');
        setColor('');
        setAdded(false);
    }, [slug]);
    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(false);
        setProduct(null);
        apiRequest<{ data: Product }>(
            '/api/v1/products/' + encodeURIComponent(slug ?? ''),
            {},
            locale,
        )
            .then((result) => {
                if (active) setProduct(result.data);
            })
            .catch(() => {
                if (active) setError(true);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [slug, locale, retry]);
    const add = async (checkout = false) => {
        if (busy) return;
        if (!user) {
            navigate('/login', { state: { from: '/products/' + slug } });
            return;
        }
        try {
            if (
                !product ||
                (product.sizes.length > 0 && !size) ||
                (product.colors.length > 0 && !color)
            )
                return;
            await addCart(product.id, { ...(size ? { size } : {}), ...(color ? { color } : {}) });
            setAdded(true);
            if (checkout) navigate('/checkout');
        } catch {}
    };
    return (
        <main className="store-section">
            <Link to="/catalog" className="back-link">
                ← {pt ? 'Voltar ao catálogo' : 'Back to catalog'}
            </Link>
            <ListStatus
                loading={loading}
                error={error}
                empty={!product}
                retry={() => setRetry((v) => v + 1)}
            />
            {product && !loading && (
                <div className="product-detail">
                    <ProductGallery key={product.slug} product={product} />
                    <div className="detail-copy">
                        <FavoriteButton product={product} className="detail-favorite" />
                        <span className="store-eyebrow">
                            {product.brand} / {formatProductType(product.type, locale)}
                        </span>
                        <h1>{product.name}</h1>
                        <strong className="detail-price">{money(product.price)}</strong>
                        <p>{product.description}</p>
                        <button
                            type="button"
                            className="product-rating-link"
                            onClick={() =>
                                document
                                    .getElementById('product-reviews')
                                    ?.scrollIntoView({ block: 'start' })
                            }
                        >
                            <RatingSummary
                                rating={product.rating}
                                review_count={product.review_count}
                            />
                        </button>
                        {product.colors.length > 0 && (
                            <fieldset className="product-options">
                                <legend>{pt ? 'Cor' : 'Color'}</legend>
                                <div>
                                    {product.colors.map((option) => (
                                        <label
                                            key={option}
                                            className={color === option ? 'is-selected' : ''}
                                        >
                                            <input
                                                type="radio"
                                                name="product-color"
                                                value={option}
                                                checked={color === option}
                                                onChange={() => {
                                                    setColor(option);
                                                    setAdded(false);
                                                }}
                                            />
                                            <span>{formatProductColor(option, locale)}</span>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                        )}
                        {product.sizes.length > 0 && (
                            <fieldset className="product-options">
                                <legend>{pt ? 'Tamanho' : 'Size'}</legend>
                                <div>
                                    {product.sizes.map((option) => (
                                        <label
                                            key={option}
                                            className={size === option ? 'is-selected' : ''}
                                        >
                                            <input
                                                type="radio"
                                                name="product-size"
                                                value={option}
                                                checked={size === option}
                                                onChange={() => {
                                                    setSize(option);
                                                    setAdded(false);
                                                }}
                                            />
                                            <span>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                        )}
                        {((product.sizes.length > 0 && !size) ||
                            (product.colors.length > 0 && !color)) && (
                            <p className="variant-guidance" id="variant-guidance">
                                {pt
                                    ? 'Selecione as opções acima para adicionar à sacola.'
                                    : 'Select the options above to add to your bag.'}
                            </p>
                        )}
                        <div className="button-row product-purchase-actions">
                            <Button
                                disabled={
                                    busy ||
                                    (product.sizes.length > 0 && !size) ||
                                    (product.colors.length > 0 && !color)
                                }
                                aria-describedby={
                                    (product.sizes.length > 0 && !size) ||
                                    (product.colors.length > 0 && !color)
                                        ? 'variant-guidance'
                                        : undefined
                                }
                                onClick={() => void add()}
                            >
                                {pt ? 'ADICIONAR AO CARRINHO' : 'ADD TO CART'} ↗
                            </Button>
                            <Button
                                variant="secondary"
                                disabled={
                                    busy ||
                                    (product.sizes.length > 0 && !size) ||
                                    (product.colors.length > 0 && !color)
                                }
                                aria-describedby={
                                    (product.sizes.length > 0 && !size) ||
                                    (product.colors.length > 0 && !color)
                                        ? 'variant-guidance'
                                        : undefined
                                }
                                onClick={() => void add(true)}
                            >
                                {pt ? 'COMPRAR AGORA' : 'BUY NOW'} →
                            </Button>
                        </div>
                        {added && (
                            <p role="status">
                                {pt ? 'Adicionado ao carrinho.' : 'Added to cart.'}{' '}
                                <Link to="/cart">{pt ? 'Ver carrinho' : 'View cart'}</Link>
                            </p>
                        )}
                        {cartError && (
                            <p role="alert">
                                {pt
                                    ? 'Não foi possível atualizar o carrinho.'
                                    : 'Could not update the cart.'}
                            </p>
                        )}
                    </div>
                </div>
            )}
            {product && !loading && (
                <div id="product-reviews">
                    <ProductReviews slug={product.slug} onSummary={updateRating} />
                </div>
            )}
            {product && !loading && <RelatedProducts product={product} />}
        </main>
    );
}
function RelatedProducts({ product }: { product: Product }) {
    const { locale } = useLocale();
    const pt = locale === 'pt_BR';
    const { data, loading, error, retry } = useProducts(
        new URLSearchParams({ type: product.type, per_page: '30' }).toString(),
    );
    const related = relatedProducts(data?.data || [], product);
    if (!loading && !error && !related.length) return null;
    return (
        <section className="related-products" aria-labelledby="related-products-heading">
            <div className="section-heading">
                <div>
                    <span className="store-eyebrow">
                        {pt ? 'CONTINUE EXPLORANDO' : 'KEEP EXPLORING'}
                    </span>
                    <h2 id="related-products-heading">
                        {pt ? 'NA MESMA LINHA.' : 'MORE IN THIS CATEGORY.'}
                    </h2>
                </div>
                <Link to={'/catalog?type=' + encodeURIComponent(product.type)}>
                    {pt ? 'Ver categoria ↗' : 'View category ↗'}
                </Link>
            </div>
            <ListStatus loading={loading} error={error} empty={false} retry={retry} />
            {!loading && !error && <Grid products={related} />}
        </section>
    );
}
export function WishlistPage() {
    const { locale } = useLocale();
    const pt = locale === 'pt_BR';
    const { wishlist, wishlistLoading, wishlistError, refreshWishlist } = useStore();
    return (
        <main className="store-section">
            <div className="catalog-heading">
                <span className="store-eyebrow">
                    ✳ {pt ? 'SALVOS PARA DEPOIS' : 'SAVED FOR LATER'}
                </span>
                <h1>{pt ? 'SEUS FAVORITOS.' : 'YOUR WISHLIST.'}</h1>
            </div>
            <ListStatus
                loading={wishlistLoading}
                error={wishlistError}
                empty={wishlist.length === 0}
                retry={() => void refreshWishlist()}
            />
            {!wishlistLoading && !wishlistError && (
                <Grid products={wishlist.map((item) => item.product)} />
            )}
        </main>
    );
}
export function CartPage() {
    const { locale, money } = useLocale();
    const pt = locale === 'pt_BR';
    const { cart, cartLoading, cartError, busy, refreshCart, updateCart, removeCart, clearCart } =
        useStore();
    const mutate = useCallback((action: Promise<void>) => {
        void action.catch(() => {});
    }, []);
    return (
        <main className="store-section">
            <div className="catalog-heading">
                <span className="store-eyebrow">
                    ✳ {pt ? 'SELECIONADOS POR VOCÊ' : 'PICKED BY YOU'}
                </span>
                <h1>{pt ? 'SEU CARRINHO.' : 'YOUR CART.'}</h1>
            </div>
            <ListStatus
                loading={cartLoading}
                error={cartError}
                empty={!cart?.data.length}
                retry={() => void refreshCart()}
            />
            {!cartLoading && !cartError && cart && cart.data.length > 0 && (
                <div className="cart-layout">
                    <div className="cart-list">
                        {cart.data.map((item) => (
                            <article className="cart-item" key={item.id}>
                                <Link to={'/products/' + item.product.slug} className="cart-image">
                                    <ProductImage
                                        src={item.product.thumbnail}
                                        alt={
                                            item.product.type === 'sneaker'
                                                ? `${item.product.name}: ${item.product.description}`
                                                : item.product.name
                                        }

                                        width="160"
                                        height="160"
                                    />
                                </Link>
                                <div>
                                    <Link
                                        className="product-name"
                                        to={'/products/' + item.product.slug}
                                    >
                                        {item.product.name}
                                    </Link>
                                    <VariantDetails size={item.size} color={item.color} />
                                    <p>
                                        {money(item.unit_price)} {pt ? 'cada' : 'each'}
                                    </p>
                                    <label>
                                        {pt ? 'Quantidade' : 'Quantity'}{' '}
                                        <Select
                                            disabled={busy}
                                            value={item.quantity}
                                            onChange={(e) =>
                                                mutate(updateCart(item.id, Number(e.target.value)))
                                            }
                                        >
                                            {Array.from(
                                                { length: Math.max(10, item.quantity) },
                                                (_, i) => (
                                                    <option key={i + 1} value={i + 1}>
                                                        {i + 1}
                                                    </option>
                                                ),
                                            )}
                                        </Select>
                                    </label>
                                    <button
                                        className="text-button"
                                        disabled={busy}
                                        onClick={() => mutate(removeCart(item.id))}
                                    >
                                        {pt ? 'Remover' : 'Remove'}
                                    </button>
                                </div>
                                <strong>{money(item.subtotal)}</strong>
                            </article>
                        ))}
                        <button
                            className="text-button"
                            disabled={busy}
                            onClick={() => mutate(clearCart())}
                        >
                            {pt ? 'Esvaziar carrinho' : 'Clear cart'}
                        </button>
                    </div>
                    <aside className="cart-summary">
                        <h2>{pt ? 'RESUMO' : 'SUMMARY'}</h2>
                        <div>
                            <span>Subtotal</span>
                            <strong>{money(cart.meta.subtotal)}</strong>
                        </div>
                        <p>
                            {pt
                                ? 'Frete calculado no checkout.'
                                : 'Shipping calculated at checkout.'}
                        </p>
                        <Link className="store-link-button" to="/checkout">
                            {pt ? 'FINALIZAR COMPRA' : 'CHECKOUT'} →
                        </Link>
                    </aside>
                </div>
            )}
        </main>
    );
}
