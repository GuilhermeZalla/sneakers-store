import { Heart } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { useStore } from '../context/StoreContext';
import type { Product } from '../lib/store';

export function FavoriteButton({
    product,
    className = 'heart-button',
}: {
    product: Product;
    className?: string;
}) {
    const { user, loading } = useAuth();
    const { locale } = useLocale();
    const { wishlist, toggleWishlist, busy } = useStore();
    const location = useLocation();
    const navigate = useNavigate();
    const pt = locale === 'pt_BR';
    const selected = wishlist.some((item) => item.product_id === product.id);
    function toggle() {
        if (!user) {
            sessionStorage.setItem('pending-wishlist', String(product.id));
            navigate('/login', {
                state: { from: location.pathname + location.search + location.hash },
            });
            return;
        }
        void toggleWishlist(product.id).catch(() => {});
    }
    return (
        <button
            className={className}
            onClick={toggle}
            disabled={busy || loading}
            aria-pressed={selected}
            aria-label={
                selected
                    ? pt
                        ? 'Remover dos favoritos'
                        : 'Remove from wishlist'
                    : pt
                      ? 'Adicionar aos favoritos'
                      : 'Add to wishlist'
            }
        >
            <Heart size={21} fill={selected ? 'currentColor' : 'none'} />
        </button>
    );
}

export function ProductCard({ product }: { product: Product }) {
    const { money } = useLocale();
    return (
        <article className="product-card">
            <div className="product-image">
                <Link to={'/products/' + product.slug}>
                    <img
                        src={product.thumbnail}
                        alt={product.name}
                        loading="lazy"
                        width="328"
                        height="240"
                    />
                </Link>
                <FavoriteButton product={product} />
            </div>
            <div className="product-info">
                <span className="product-brand">{product.brand}</span>
                <Link className="product-name" to={'/products/' + product.slug}>
                    {product.name}
                </Link>
                <strong>{money(product.price)}</strong>
            </div>
        </article>
    );
}
