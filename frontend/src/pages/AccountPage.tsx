import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Shell';
import { Badge, Button, Card } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';

export function AccountPage() {
    const { user, logout } = useAuth();
    const { locale } = useLocale();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    const navigate = useNavigate();
    async function handleLogout() {
        setBusy(true);
        setError(false);
        try {
            await logout();
            navigate('/login', { replace: true });
        } catch {
            setError(true);
        } finally {
            setBusy(false);
        }
    }
    return (
        <>
            <Header />
            <main className="account-wrap">
                <Card className="account-card">
                    <Badge>{locale === 'pt_BR' ? 'SUA CONTA' : 'YOUR ACCOUNT'}</Badge>
                    <h1>
                        {locale === 'pt_BR' ? 'Olá,' : 'Hello,'} {user?.name}.
                    </h1>
                    <p>{user?.email}</p>
                    <p>{locale === 'pt_BR' ? 'Você está conectado.' : 'You are signed in.'}</p>
                    {error && (
                        <p role="alert">
                            {locale === 'pt_BR'
                                ? 'Não foi possível sair. Tente novamente.'
                                : 'Could not sign out. Please try again.'}
                        </p>
                    )}
                    <Button disabled={busy} onClick={() => void handleLogout()}>
                        {busy ? '...' : locale === 'pt_BR' ? 'Sair' : 'Sign out'}
                    </Button>
                </Card>
            </main>
        </>
    );
}
