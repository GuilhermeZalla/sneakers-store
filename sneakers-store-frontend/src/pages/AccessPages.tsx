import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { apiRequest, ApiError, initializeCsrf } from '../lib/api';
import { Button, Input } from '../components/ui';

export function PasswordRecoveryPage({ reset = false }: { reset?: boolean }) {
    const { locale } = useLocale();
    const pt = locale === 'pt_BR';
    const [params] = useSearchParams();
    const [email, setEmail] = useState(params.get('email') ?? '');
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');
    const [fields, setFields] = useState<Record<string, string[]>>({});
    async function submit(event: FormEvent) {
        event.preventDefault();
        setBusy(true);
        setError('');
        setFields({});
        try {
            await initializeCsrf(locale);
            await apiRequest(
                '/api/v1/auth/' + (reset ? 'reset-password' : 'forgot-password'),
                {
                    method: 'POST',
                    body: JSON.stringify({
                        email,
                        ...(reset
                            ? {
                                  token: params.get('token') ?? '',
                                  password,
                                  password_confirmation: confirmation,
                              }
                            : {}),
                    }),
                },
                locale,
            );
            setPassword('');
            setConfirmation('');
            setDone(true);
            if (reset) window.history.replaceState(null, '', '/reset-password');
        } catch (failure) {
            if (failure instanceof ApiError) {
                setFields(failure.errors);
                setError(
                    failure.status === 429
                        ? pt
                            ? 'Aguarde um minuto antes de tentar novamente.'
                            : 'Wait a minute before trying again.'
                        : failure.message,
                );
            } else
                setError(
                    pt
                        ? 'Não foi possível conectar. Tente novamente.'
                        : 'Could not connect. Try again.',
                );
        } finally {
            setBusy(false);
        }
    }
    return (
        <main className="store-section access-page">
            <h1>
                {reset
                    ? pt
                        ? 'NOVA SENHA.'
                        : 'NEW PASSWORD.'
                    : pt
                      ? 'RECUPERAR ACESSO.'
                      : 'RECOVER ACCESS.'}
            </h1>
            <section className="dashboard-panel">
                {done ? (
                    <p role="status">
                        {reset
                            ? pt
                                ? 'Senha alterada. Entre com sua nova senha.'
                                : 'Password changed. Sign in with your new password.'
                            : pt
                              ? 'Se houver uma conta com esse e-mail, você receberá um link de redefinição.'
                              : 'If an account exists for this email, you will receive a reset link.'}
                    </p>
                ) : (
                    <form onSubmit={(event) => void submit(event)}>
                        <div className="field">
                            <label htmlFor="recovery-email">{pt ? 'E-mail' : 'Email'}</label>
                            <Input
                                id="recovery-email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                            />
                        </div>
                        {reset && (
                            <>
                                <div className="field">
                                    <label htmlFor="new-password">
                                        {pt ? 'Nova senha' : 'New password'}
                                    </label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                    />
                                </div>
                                <div className="field">
                                    <label htmlFor="confirm-password">
                                        {pt ? 'Confirme a senha' : 'Confirm password'}
                                    </label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        value={confirmation}
                                        onChange={(event) => setConfirmation(event.target.value)}
                                    />
                                </div>
                            </>
                        )}
                        {error && (
                            <div role="alert">
                                <p>{error}</p>
                                {Object.entries(fields).map(([key, messages]) => (
                                    <p key={key}>{messages.join(' ')}</p>
                                ))}
                            </div>
                        )}
                        <Button type="submit" disabled={busy}>
                            {busy
                                ? pt
                                    ? 'Enviando...'
                                    : 'Sending...'
                                : pt
                                  ? 'Continuar'
                                  : 'Continue'}
                        </Button>
                    </form>
                )}
                <p>
                    <Link to="/login">{pt ? 'Voltar para entrar' : 'Back to sign in'}</Link>
                </p>
            </section>
        </main>
    );
}

export function VerifyEmailPage() {
    const { user, refresh } = useAuth();
    const { locale } = useLocale();
    const pt = locale === 'pt_BR';
    const { id, hash } = useParams();
    const [params] = useSearchParams();
    const query = params.toString();
    const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const started = useRef(false);
    const refreshRef = useRef(refresh);
    refreshRef.current = refresh;
    useEffect(() => {
        if (!id || !hash || started.current) return;
        started.current = true;
        setState('loading');
        apiRequest(
            '/api/v1/auth/email/verify/' +
                encodeURIComponent(id) +
                '/' +
                encodeURIComponent(hash) +
                '?' +
                query,
            {},
            locale,
        )
            .then(async () => {
                window.history.replaceState(null, '', '/verify-email');
                setState('success');
                await refreshRef.current();
            })
            .catch(() => setState('error'));
    }, [id, hash, query, locale]);
    async function resend() {
        setBusy(true);
        setMessage('');
        try {
            await initializeCsrf(locale);
            await apiRequest(
                '/api/v1/auth/email/verification-notification',
                { method: 'POST' },
                locale,
            );
            setMessage(pt ? 'Verifique sua caixa de entrada.' : 'Check your inbox.');
        } catch (failure) {
            setMessage(
                failure instanceof ApiError && failure.status === 429
                    ? pt
                        ? 'Aguarde um minuto antes de reenviar.'
                        : 'Wait a minute before resending.'
                    : pt
                      ? 'Não foi possível reenviar. Tente novamente.'
                      : 'Could not resend. Try again.',
            );
        } finally {
            setBusy(false);
        }
    }
    return (
        <main className="store-section access-page">
            <h1>{pt ? 'VERIFIQUE SEU E-MAIL.' : 'VERIFY YOUR EMAIL.'}</h1>
            <section className="dashboard-panel">
                {state === 'loading' && (
                    <p className="notification-skeleton" role="status">
                        {pt ? 'Confirmando...' : 'Confirming...'}
                    </p>
                )}
                {state === 'success' || user?.email_verified_at ? (
                    <>
                        <p role="status">
                            {pt
                                ? 'E-mail confirmado. Você já pode acessar sua conta.'
                                : 'Email verified. You can access your account.'}
                        </p>
                        <Link to={user ? '/account' : '/login'}>
                            {pt ? 'Continuar' : 'Continue'} →
                        </Link>
                    </>
                ) : (
                    <>
                        {state === 'error' ? (
                            <p role="alert">
                                {pt
                                    ? 'O link é inválido, expirou ou já foi utilizado.'
                                    : 'This link is invalid, expired or already used.'}
                            </p>
                        ) : (
                            state !== 'loading' && (
                                <p>
                                    {pt
                                        ? 'Enviamos um link para confirmar seu e-mail. Ele expira em 30 minutos.'
                                        : 'We sent a link to verify your email. It expires in 30 minutes.'}
                                </p>
                            )
                        )}
                        {user ? (
                            <Button disabled={busy} onClick={() => void resend()}>
                                {pt ? 'Reenviar verificação' : 'Resend verification'}
                            </Button>
                        ) : (
                            <Link to="/login">
                                {pt
                                    ? 'Entre para reenviar a verificação'
                                    : 'Sign in to resend verification'}
                            </Link>
                        )}
                    </>
                )}
                {message && <p role="status">{message}</p>}
            </section>
        </main>
    );
}
