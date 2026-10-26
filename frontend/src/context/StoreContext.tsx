import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { useLocale } from './LocaleContext';
import { storeApi, type Cart, type WishlistItem } from '../lib/store';

type StoreContextValue = {
    cart: Cart | null;
    wishlist: WishlistItem[];
    cartLoading: boolean;
    wishlistLoading: boolean;
    cartError: boolean;
    wishlistError: boolean;
    busy: boolean;
    refreshCart: () => Promise<void>;
    refreshWishlist: () => Promise<void>;
    addCart: (id: number) => Promise<void>;
    updateCart: (id: number, quantity: number) => Promise<void>;
    removeCart: (id: number) => Promise<void>;
    clearCart: () => Promise<void>;
    toggleWishlist: (id: number) => Promise<void>;
};
const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { locale } = useLocale();
    const [cart, setCart] = useState<Cart | null>(null);
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [cartLoading, setCartLoading] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [cartError, setCartError] = useState(false);
    const [wishlistError, setWishlistError] = useState(false);
    const [busy, setBusy] = useState(false);
    const version = useRef(0);
    const wishlistSequence = useRef(0);
    const wishlistRef = useRef<WishlistItem[]>([]);
    wishlistRef.current = wishlist;

    const refreshCart = useCallback(async () => {
        if (!user) return;
        const request = version.current;
        setCartLoading(true);
        try {
            const data = await storeApi.cart(locale);
            if (request === version.current) {
                setCart(data);
                setCartError(false);
            }
        } catch {
            if (request === version.current) setCartError(true);
        } finally {
            if (request === version.current) setCartLoading(false);
        }
    }, [user, locale]);
    const refreshWishlist = useCallback(async () => {
        if (!user) return;
        const request = version.current;
        const sequence = ++wishlistSequence.current;
        setWishlistLoading(true);
        try {
            const pending = sessionStorage.getItem('pending-wishlist');
            if (pending) {
                const id = Number(pending);
                if (Number.isSafeInteger(id) && id > 0) await storeApi.addWishlist(id, locale);
                if (sessionStorage.getItem('pending-wishlist') === pending)
                    sessionStorage.removeItem('pending-wishlist');
            }
            const data = await storeApi.wishlist(locale);
            if (request === version.current && sequence === wishlistSequence.current) {
                setWishlist(data.data);
                setWishlistError(false);
            }
        } catch {
            if (request === version.current && sequence === wishlistSequence.current)
                setWishlistError(true);
        } finally {
            if (request === version.current && sequence === wishlistSequence.current)
                setWishlistLoading(false);
        }
    }, [user, locale]);
    useEffect(() => {
        version.current++;
        setCart(null);
        setWishlist([]);
        setCartError(false);
        setWishlistError(false);
        if (user) {
            void refreshCart();
            void refreshWishlist();
        } else {
            setCartLoading(false);
            setWishlistLoading(false);
        }
    }, [user, locale, refreshCart, refreshWishlist]);

    const mutate = async (
        action: () => Promise<unknown>,
        refresh: () => Promise<void>,
        failure: (v: boolean) => void,
    ) => {
        setBusy(true);
        try {
            await action();
            await refresh();
        } catch (error) {
            failure(true);
            throw error;
        } finally {
            setBusy(false);
        }
    };
    return (
        <StoreContext.Provider
            value={{
                cart,
                wishlist,
                cartLoading,
                wishlistLoading,
                cartError,
                wishlistError,
                busy,
                refreshCart,
                refreshWishlist,
                addCart: (id) =>
                    mutate(() => storeApi.addCart(id, 1, locale), refreshCart, setCartError),
                updateCart: (id, quantity) =>
                    mutate(
                        () => storeApi.updateCart(id, quantity, locale),
                        refreshCart,
                        setCartError,
                    ),
                removeCart: (id) =>
                    mutate(() => storeApi.removeCart(id, locale), refreshCart, setCartError),
                clearCart: () =>
                    mutate(() => storeApi.clearCart(locale), refreshCart, setCartError),
                toggleWishlist: (id) =>
                    mutate(
                        () => {
                            const item = wishlistRef.current.find(
                                (entry) => entry.product_id === id,
                            );
                            return item
                                ? storeApi.removeWishlist(item.id, locale)
                                : storeApi.addWishlist(id, locale);
                        },
                        refreshWishlist,
                        setWishlistError,
                    ),
            }}
        >
            {children}
        </StoreContext.Provider>
    );
}
export function useStore(): StoreContextValue {
    const context = useContext(StoreContext);
    if (!context) throw new Error('StoreProvider is missing');
    return context;
}
