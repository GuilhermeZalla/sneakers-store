import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { apiRequest, ApiError, initializeCsrf } from '../lib/api';
import { useLocale } from './LocaleContext';

export type User = {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    birthday?: string | null;
    gender?: string | null;
    second_contact?: string | null;
};
export type Registration = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone: string;
    birthday: string;
    gender: string;
    second_contact?: string;
};
type AuthContextValue = {
    user: User | null;
    loading: boolean;
    unavailable: boolean;
    refresh: () => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    register: (data: Registration) => Promise<void>;
    logout: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { locale } = useLocale();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [unavailable, setUnavailable] = useState(false);
    const requestVersion = useRef(0);

    const refresh = useCallback(async () => {
        const version = ++requestVersion.current;
        try {
            const response = await apiRequest<{ data: User }>('/api/v1/user', {}, locale);
            if (version !== requestVersion.current) return;
            setUser(response.data);
            setUnavailable(false);
        } catch (error) {
            if (version !== requestVersion.current) return;
            if (error instanceof ApiError && (error.status === 401 || error.status === 419)) {
                setUser(null);
                setUnavailable(false);
            } else {
                setUnavailable(true);
            }
        } finally {
            if (version === requestVersion.current) setLoading(false);
        }
    }, [locale]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const authenticate = async (path: string, data: object) => {
        ++requestVersion.current;
        setLoading(false);
        await initializeCsrf(locale);
        await apiRequest(path, { method: 'POST', body: JSON.stringify(data) }, locale);
        const response = await apiRequest<{ data: User }>('/api/v1/user', {}, locale);
        setUser(response.data);
        setUnavailable(false);
        setLoading(false);
    };

    const logout = async () => {
        ++requestVersion.current;
        try {
            await apiRequest('/api/v1/auth/logout', { method: 'POST' }, locale);
            setUser(null);
        } catch (error) {
            if (error instanceof ApiError && (error.status === 401 || error.status === 419))
                setUser(null);
            throw error;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                unavailable,
                refresh,
                login: (email, password) => authenticate('/api/v1/auth/login', { email, password }),
                register: (data) => authenticate('/api/v1/auth/register', data),
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) throw new Error('AuthProvider is missing');
    return context;
}
