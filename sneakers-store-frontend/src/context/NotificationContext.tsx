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
import { notificationApi, POLL_INTERVAL, type StoreNotification } from '../lib/notifications';

type NotificationState = {
    items: StoreNotification[];
    count: number;
    page: number;
    lastPage: number;
    loading: boolean;
    error: boolean;
    busy: boolean;
    refresh: (page?: number) => Promise<void>;
    read: (id: string) => Promise<boolean>;
    readAll: () => Promise<void>;
};
const Context = createContext<NotificationState | null>(null);
export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { locale } = useLocale();
    const [items, setItems] = useState<StoreNotification[]>([]);
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [busy, setBusy] = useState(false);
    const version = useRef(0);
    const sequence = useRef(0);
    const currentPage = useRef(1);
    const userId = user?.id;
    const refresh = useCallback(
        async (nextPage = currentPage.current) => {
            if (!userId) return;
            const request = ++sequence.current;
            const session = version.current;
            setLoading(true);
            try {
                const [list, unread] = await Promise.all([
                    notificationApi.list(nextPage, locale),
                    notificationApi.count(locale),
                ]);
                if (session !== version.current || request !== sequence.current) return;
                setItems(list.data);
                setCount(unread.data.unread_count);
                setPage(list.meta.current_page);
                setLastPage(list.meta.last_page);
                currentPage.current = nextPage;
                setError(false);
            } catch {
                if (session === version.current && request === sequence.current) setError(true);
            } finally {
                if (session === version.current && request === sequence.current) setLoading(false);
            }
        },
        [userId, locale],
    );
    useEffect(() => {
        version.current++;
        setItems([]);
        setCount(0);
        setPage(1);
        setLastPage(1);
        setError(false);
        setBusy(false);
        currentPage.current = 1;
        if (!userId) {
            setLoading(false);
            return;
        }
        void refresh(1);
        const timer = window.setInterval(() => {
            if (document.visibilityState === 'visible') void refresh();
        }, POLL_INTERVAL);
        const focus = () => {
            if (document.visibilityState === 'visible') void refresh();
        };
        document.addEventListener('visibilitychange', focus);
        return () => {
            version.current++;
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', focus);
        };
    }, [userId, refresh]);
    const read = async (id: string) => {
        const session = version.current;
        setBusy(true);
        try {
            await notificationApi.read(id, locale);
            if (session !== version.current) return false;
            await refresh();
            return true;
        } catch {
            if (session === version.current) setError(true);
            return false;
        } finally {
            if (session === version.current) setBusy(false);
        }
    };
    const readAll = async () => {
        const session = version.current;
        setBusy(true);
        try {
            await notificationApi.readAll(locale);
            if (session === version.current) await refresh();
        } catch {
            if (session === version.current) setError(true);
        } finally {
            if (session === version.current) setBusy(false);
        }
    };
    return (
        <Context.Provider
            value={{ items, count, page, lastPage, loading, error, busy, refresh, read, readAll }}
        >
            {children}
        </Context.Provider>
    );
}
export function useNotifications(): NotificationState {
    const context = useContext(Context);
    if (!context) throw new Error('NotificationProvider is missing');
    return context;
}
