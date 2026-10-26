import { ArrowRight, Asterisk, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components/Shell';
import { Badge, Button, Card, Input, Select } from '../components/ui';
import { useAuth, type Registration } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { ApiError } from '../lib/api';

const copy = {
    en: {
        eyebrow: 'THE SNEAKERS COMMUNITY',
        hero: 'GOOD SHOES.\nGOOD MOVES.',
        sub: 'Your next favorite pair is waiting. Get in and make your move.',
        loginTitle: 'WELCOME BACK.',
        loginSub: 'Sign in to pick up where you left off.',
        registerTitle: 'JOIN THE CLUB.',
        registerSub: 'Create your account and step into something new.',
        name: 'Full name',
        email: 'Email address',
        password: 'Password',
        confirm: 'Confirm password',
        phone: 'Phone number',
        second: 'Alternative phone (optional)',
        birthday: 'Date of birth',
        gender: 'Gender',
        male: 'Male',
        female: 'Female',
        other: 'Prefer not to say',
        login: 'SIGN IN',
        register: 'CREATE ACCOUNT',
        wait: 'PLEASE WAIT...',
        noAccount: 'New around here?',
        haveAccount: 'Already a member?',
        create: 'Create an account',
        signIn: 'Sign in',
        foot: 'SECURE SIGN IN',
        network: 'Unable to connect. Check your connection and try again.',
        expired: 'Your session expired. Please try again.',
        generic: 'Something went wrong. Please try again.',
        access: 'YOUR ACCOUNT. YOUR RULES.',
        street: 'EST. FOR THE STREETS',
        footer: 'MADE FOR YOUR NEXT MOVE ✳',
    },
    pt_BR: {
        eyebrow: 'A COMUNIDADE SNEAKERS',
        hero: 'BONS TÊNIS.\nBONS CAMINHOS.',
        sub: 'Seu próximo par favorito está esperando. Entre e dê o próximo passo.',
        loginTitle: 'BOAS-VINDAS.',
        loginSub: 'Entre para continuar de onde parou.',
        registerTitle: 'ENTRE PARA O CLUBE.',
        registerSub: 'Crie sua conta e dê o próximo passo.',
        name: 'Nome completo',
        email: 'E-mail',
        password: 'Senha',
        confirm: 'Confirme a senha',
        phone: 'Telefone',
        second: 'Telefone alternativo (opcional)',
        birthday: 'Data de nascimento',
        gender: 'Gênero',
        male: 'Masculino',
        female: 'Feminino',
        other: 'Prefiro não informar',
        login: 'ENTRAR',
        register: 'CRIAR CONTA',
        wait: 'AGUARDE...',
        noAccount: 'Ainda não tem conta?',
        haveAccount: 'Já tem uma conta?',
        create: 'Criar conta',
        signIn: 'Entrar',
        foot: 'ACESSO SEGURO',
        network: 'Não foi possível conectar. Verifique sua conexão e tente novamente.',
        expired: 'Sua sessão expirou. Tente novamente.',
        generic: 'Algo deu errado. Tente novamente.',
        access: 'SUA CONTA. SUAS REGRAS.',
        street: 'FEITO PARA AS RUAS',
        footer: 'FEITO PARA O SEU PRÓXIMO PASSO ✳',
    },
} as const;

const initial: Registration = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    second_contact: '',
    birthday: '',
    gender: 'not_informed',
};

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
    const { locale } = useLocale();
    const t = copy[locale];
    const { login, register } = useAuth();
    const [form, setForm] = useState<Registration>(initial);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const requested: unknown = (location.state as { from?: unknown } | null)?.from;
    const destination =
        typeof requested === 'string' && requested.startsWith('/') && !requested.startsWith('//')
            ? requested
            : '/account';

    function update(field: keyof Registration, value: string) {
        setForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: [] }));
    }
    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBusy(true);
        setErrors({});
        setMessage('');
        try {
            if (mode === 'login') await login(form.email, form.password);
            else await register({ ...form, second_contact: form.second_contact || undefined });
            navigate(destination, { replace: true });
        } catch (error) {
            if (error instanceof ApiError) {
                if (error.status === 422) {
                    setErrors(error.errors);
                    setMessage(error.message);
                } else if (error.status === 419 || error.status === 401) setMessage(t.expired);
                else setMessage(t.generic);
            } else setMessage(t.network);
        } finally {
            setBusy(false);
        }
    }
    function field(id: keyof Registration, label: string, type = 'text', required = true) {
        const error = errors[id]?.[0];
        return (
            <div className="field">
                <label htmlFor={id}>{label}</label>
                <Input
                    id={id}
                    name={id}
                    type={type}
                    value={form[id] ?? ''}
                    required={required}
                    onChange={(event) => update(id, event.target.value)}
                    aria-invalid={!!error}
                    aria-describedby={error ? id + '-error' : undefined}
                    autoComplete={
                        {
                            name: 'name',
                            email: 'email',
                            password: mode === 'login' ? 'current-password' : 'new-password',
                            password_confirmation: 'new-password',
                            phone: 'tel',
                            birthday: 'bday',
                            second_contact: 'tel',
                            gender: undefined,
                        }[id]
                    }
                />
                {error && (
                    <span className="field-error" id={id + '-error'}>
                        {error}
                    </span>
                )}
            </div>
        );
    }
    return (
        <>
            <Header />
            <main className="auth-layout">
                <section className="hero-panel" aria-label={t.eyebrow}>
                    <div className="hero-top">
                        <Badge>{t.eyebrow}</Badge>
                        <Asterisk size={30} strokeWidth={3} aria-hidden="true" />
                    </div>
                    <div className="hero-content">
                        <span className="hero-index">01 / 03</span>
                        <h1>{t.hero}</h1>
                        <p>{t.sub}</p>
                        <span className="hero-arrow" aria-hidden="true">
                            ↗
                        </span>
                    </div>
                    <div className="hero-bottom">
                        <span>{t.street}</span>
                        <span>✳ &nbsp; SNEAKERS</span>
                    </div>
                </section>
                <section className="form-panel">
                    <div className="form-inner">
                        <div className="form-heading">
                            <span className="section-label">{t.access}</span>
                            <h2>{mode === 'login' ? t.loginTitle : t.registerTitle}</h2>
                            <p>{mode === 'login' ? t.loginSub : t.registerSub}</p>
                        </div>
                        <Card className="form-card">
                            <form onSubmit={(event) => void submit(event)} noValidate={false}>
                                {message && (
                                    <div className="form-alert" role="alert">
                                        {message}
                                    </div>
                                )}
                                {mode === 'register' && field('name', t.name)}
                                {field('email', t.email, 'email')}
                                {mode === 'register' && (
                                    <div className="field-grid">
                                        {field('phone', t.phone, 'tel')}
                                        {field('birthday', t.birthday, 'date')}
                                    </div>
                                )}
                                {mode === 'register' && (
                                    <>
                                        {field('second_contact', t.second, 'tel', false)}
                                        <div className="field">
                                            <label htmlFor="gender">{t.gender}</label>
                                            <Select
                                                id="gender"
                                                value={form.gender}
                                                onChange={(event) =>
                                                    update('gender', event.target.value)
                                                }
                                                aria-invalid={!!errors.gender}
                                                aria-describedby={
                                                    errors.gender?.length
                                                        ? 'gender-error'
                                                        : undefined
                                                }
                                            >
                                                <option value="not_informed">{t.other}</option>
                                                <option value="female">{t.female}</option>
                                                <option value="male">{t.male}</option>
                                            </Select>
                                            {errors.gender?.[0] && (
                                                <span className="field-error" id="gender-error">
                                                    {errors.gender[0]}
                                                </span>
                                            )}
                                        </div>
                                    </>
                                )}
                                {field('password', t.password, 'password')}
                                {mode === 'register' &&
                                    field('password_confirmation', t.confirm, 'password')}
                                <Button type="submit" className="submit-button" disabled={busy}>
                                    {busy ? t.wait : mode === 'login' ? t.login : t.register}
                                    <ArrowRight size={20} aria-hidden="true" />
                                </Button>
                            </form>
                        </Card>
                        <p className="switch-auth">
                            {mode === 'login' ? t.noAccount : t.haveAccount}{' '}
                            <Link
                                to={mode === 'login' ? '/register' : '/login'}
                                state={{ from: destination }}
                            >
                                {mode === 'login' ? t.create : t.signIn} ↗
                            </Link>
                        </p>
                        <div className="secure-note">
                            <ShieldCheck size={17} aria-hidden="true" /> {t.foot}
                        </div>
                    </div>
                </section>
            </main>
            <footer className="footer">
                <span>© SNEAKERS</span>
                <span>{t.footer}</span>
            </footer>
        </>
    );
}
