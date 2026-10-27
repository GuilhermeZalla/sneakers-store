import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { Button } from './ui';

export function ProtectedRoute() {
    const { user, loading, unavailable, refresh } = useAuth();
    const { locale } = useLocale();
    const location = useLocation();
    if (loading)
        return (
            <main className="status-page" role="status">
                {locale === 'pt_BR' ? 'Carregando...' : 'Loading...'}
            </main>
        );
    if (unavailable)
        return (
            <main className="status-page">
                <p role="alert">
                    {locale === 'pt_BR'
                        ? 'Não foi possível conectar à loja.'
                        : 'Could not connect to the store.'}
                </p>
                <Button onClick={() => void refresh()}>
                    {locale === 'pt_BR' ? 'Tentar novamente' : 'Try again'}
                </Button>
            </main>
        );
    if (!user)
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location.pathname + location.search + location.hash }}
            />
        );
    if (!user.email_verified_at && location.pathname !== '/account')
        return <Navigate to="/verify-email" replace />;
    return <Outlet />;
}
