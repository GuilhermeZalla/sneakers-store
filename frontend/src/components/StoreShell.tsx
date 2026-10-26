import { Heart, ShoppingBag, UserRound } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useStore } from '../context/StoreContext';
import { Select } from './ui';

export function StoreShell() {
    const { locale, setLocale } = useLocale();
    const pt = locale === 'pt_BR';
    const { wishlistError, refreshWishlist } = useStore();
    return (
        <>
            <header className="store-header">
                <Link to="/" className="wordmark">
                    SNEAKERS<span>✳</span>
                </Link>
                <nav
                    aria-label={pt ? 'Navegação principal' : 'Main navigation'}
                    className="store-nav"
                >
                    <Link to="/catalog">{pt ? 'CATÁLOGO' : 'SHOP'}</Link>
                    <Link to="/wishlist" aria-label={pt ? 'Favoritos' : 'Wishlist'}>
                        <Heart size={20} />
                    </Link>
                    <Link to="/cart" aria-label={pt ? 'Carrinho' : 'Cart'}>
                        <ShoppingBag size={20} />
                    </Link>
                    <Link to="/account" aria-label={pt ? 'Minha conta' : 'My account'}>
                        <UserRound size={20} />
                    </Link>
                </nav>
                <label className="locale-label">
                    <span className="sr-only">
                        {pt ? 'Idioma e moeda' : 'Language and currency'}
                    </span>
                    <Select
                        value={locale}
                        onChange={(e) => setLocale(e.target.value === 'pt_BR' ? 'pt_BR' : 'en')}
                    >
                        <option value="en">EN / USD</option>
                        <option value="pt_BR">PT / BRL</option>
                    </Select>
                </label>
            </header>
            {wishlistError && (
                <div className="form-alert" role="alert">
                    {pt
                        ? 'Não foi possível atualizar os favoritos.'
                        : 'Could not update your wishlist.'}{' '}
                    <button className="text-button" onClick={() => void refreshWishlist()}>
                        {pt ? 'Tentar novamente' : 'Try again'}
                    </button>
                </div>
            )}
            <Outlet />
            <footer className="store-footer">
                <strong>SNEAKERS ✳</strong>
                <span>{pt ? 'FEITO PARA O SEU PRÓXIMO PASSO' : 'MADE FOR YOUR NEXT MOVE'}</span>
            </footer>
        </>
    );
}
