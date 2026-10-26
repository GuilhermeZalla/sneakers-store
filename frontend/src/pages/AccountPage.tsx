import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AddressForm } from '../components/AddressForm';
import { Button, Input, Select } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { useStore } from '../context/StoreContext';
import { apiRequest, ApiError } from '../lib/api';
import { formatOrderMoney, formatPhone, type Address, type Order } from '../lib/checkout';

function Failure({ retry }: { retry: () => void }) {
    const { locale } = useLocale();
    const pt = locale === 'pt_BR';
    return (
        <div role="alert" className="form-alert">
            {pt ? 'Não foi possível carregar os dados.' : 'Could not load the data.'}{' '}
            <Button onClick={retry}>{pt ? 'Tentar novamente' : 'Try again'}</Button>
        </div>
    );
}

export function AccountPage() {
    const { user, refresh, logout } = useAuth();
    const { locale } = useLocale();
    const pt = locale === 'pt_BR';
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const tab = params.get('tab') ?? 'profile';
    const [name, setName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [birthday, setBirthday] = useState(user?.birthday ?? '');
    const [secondContact, setSecondContact] = useState(user?.second_contact ?? '');
    const [gender, setGender] = useState(user?.gender ?? 'not_informed');
    const [currentPassword, setCurrentPassword] = useState('');
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [orderPage, setOrderPage] = useState(1);
    const [lastOrderPage, setLastOrderPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);
    const [reload, setReload] = useState(0);
    const [editing, setEditing] = useState<Address | 'new' | null>(null);
    const [busy, setBusy] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [message, setMessage] = useState('');
    const { wishlist, wishlistLoading, wishlistError, refreshWishlist } = useStore();
    useEffect(() => {
        setName(user?.name ?? '');
        setEmail(user?.email ?? '');
        setPhone(user?.phone ?? '');
        setBirthday(user?.birthday ?? '');
        setSecondContact(user?.second_contact ?? '');
        setGender(user?.gender ?? 'not_informed');
    }, [user]);
    useEffect(() => {
        if (tab !== 'addresses' && tab !== 'orders') return;
        let active = true;
        setLoading(true);
        setFailed(false);
        const url = tab === 'addresses' ? '/api/v1/addresses' : '/api/v1/orders?page=' + orderPage;
        apiRequest<{ data: Address[] | Order[]; meta?: { last_page: number } }>(url, {}, locale)
            .then((result) => {
                if (active) {
                    if (tab === 'addresses') setAddresses(result.data as Address[]);
                    else {
                        setOrders(result.data as Order[]);
                        setLastOrderPage(result.meta?.last_page ?? 1);
                    }
                }
            })
            .catch(() => {
                if (active) setFailed(true);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [tab, locale, reload, orderPage]);
    function changeTab(value: string) {
        setParams(value === 'profile' ? {} : { tab: value });
        setMessage('');
        setErrors({});
        setEditing(null);
    }
    async function submit(event: FormEvent, kind: 'profile' | 'password') {
        event.preventDefault();
        setBusy(true);
        setErrors({});
        setMessage('');
        try {
            await apiRequest(
                kind === 'profile' ? '/api/v1/user' : '/api/v1/user/password',
                {
                    method: kind === 'profile' ? 'PATCH' : 'PUT',
                    body: JSON.stringify(
                        kind === 'profile'
                            ? {
                                  name,
                                  email,
                                  phone,
                                  birthday,
                                  second_contact: secondContact || null,
                                  gender,
                              }
                            : {
                                  current_password: currentPassword,
                                  password,
                                  password_confirmation: confirmation,
                              },
                    ),
                },
                locale,
            );
            if (kind === 'profile') await refresh();
            else {
                setCurrentPassword('');
                setPassword('');
                setConfirmation('');
            }
            setMessage(pt ? 'Alterações salvas.' : 'Changes saved.');
        } catch (error) {
            if (error instanceof ApiError && error.status === 422) {
                setErrors(error.errors);
                setMessage(error.message);
            } else setMessage(pt ? 'Não foi possível salvar.' : 'Could not save.');
        } finally {
            setBusy(false);
        }
    }
    async function addressAction(id: number, method: 'DELETE' | 'PUT') {
        setBusy(true);
        setMessage('');
        try {
            await apiRequest(
                '/api/v1/addresses/' + id + (method === 'PUT' ? '/default' : ''),
                { method },
                locale,
            );
            setReload((x) => x + 1);
        } catch {
            setMessage(
                pt ? 'Não foi possível alterar o endereço.' : 'Could not update the address.',
            );
        } finally {
            setBusy(false);
        }
    }
    const tabs = [
        ['profile', pt ? 'Dados da conta' : 'Account'],
        ['password', pt ? 'Senha' : 'Password'],
        ['orders', pt ? 'Pedidos' : 'Orders'],
        ['addresses', pt ? 'Endereços' : 'Addresses'],
        ['wishlist', pt ? 'Favoritos' : 'Wishlist'],
    ];
    function field(
        id: string,
        label: string,
        value: string,
        setter: (v: string) => void,
        type = 'text',
        required = true,
    ) {
        return (
            <div className="field">
                <label htmlFor={id}>{label}</label>
                <Input
                    id={id}
                    type={type}
                    value={value}
                    required={required}
                    onChange={(e) =>
                        setter(
                            id === 'phone' || id === 'second_contact'
                                ? formatPhone(e.target.value)
                                : e.target.value,
                        )
                    }
                    aria-invalid={!!errors[id]?.length}
                    aria-describedby={errors[id]?.length ? id + '-error' : undefined}
                />
                {errors[id]?.[0] && (
                    <span id={id + '-error'} className="field-error">
                        {errors[id][0]}
                    </span>
                )}
            </div>
        );
    }
    return (
        <main className="store-section account-dashboard">
            <span className="store-eyebrow">✳ {pt ? 'MINHA CONTA' : 'MY ACCOUNT'}</span>
            <h1>
                {pt ? 'OLÁ' : 'HELLO'}, {user?.name}.
            </h1>
            <nav className="dashboard-nav" aria-label={pt ? 'Seções da conta' : 'Account sections'}>
                {tabs.map(([key, label]) => (
                    <button
                        key={key}
                        aria-current={tab === key ? 'page' : undefined}
                        onClick={() => changeTab(key)}
                    >
                        {label}
                    </button>
                ))}
            </nav>
            {message && (
                <p className="form-alert" role={Object.keys(errors).length ? 'alert' : 'status'}>
                    {message}
                </p>
            )}
            {tab === 'profile' && (
                <section className="dashboard-panel">
                    <h2>{pt ? 'DADOS DA CONTA' : 'ACCOUNT DETAILS'}</h2>
                    <form onSubmit={(e) => void submit(e, 'profile')}>
                        {field('name', pt ? 'Nome' : 'Name', name, setName)}
                        {field('email', 'E-mail', email, setEmail, 'email')}
                        {field('phone', pt ? 'Telefone' : 'Phone', phone, setPhone, 'tel')}
                        {field(
                            'second_contact',
                            pt ? 'Telefone alternativo (opcional)' : 'Alternative phone (optional)',
                            secondContact,
                            setSecondContact,
                            'tel',
                            false,
                        )}
                        {field(
                            'birthday',
                            pt ? 'Data de nascimento' : 'Date of birth',
                            birthday,
                            setBirthday,
                            'date',
                        )}
                        <div className="field">
                            <label htmlFor="gender">{pt ? 'Gênero' : 'Gender'}</label>
                            <Select
                                id="gender"
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                aria-invalid={!!errors.gender?.length}
                                aria-describedby={
                                    errors.gender?.length ? 'gender-error' : undefined
                                }
                            >
                                <option value="not_informed">
                                    {pt ? 'Prefiro não informar' : 'Prefer not to say'}
                                </option>
                                <option value="female">{pt ? 'Feminino' : 'Female'}</option>
                                <option value="male">{pt ? 'Masculino' : 'Male'}</option>
                            </Select>
                            {errors.gender?.[0] && (
                                <span className="field-error" id="gender-error">
                                    {errors.gender[0]}
                                </span>
                            )}
                        </div>
                        <Button disabled={busy} type="submit">
                            {pt ? 'Salvar' : 'Save'}
                        </Button>
                    </form>
                    <Button
                        variant="quiet"
                        disabled={busy}
                        onClick={() => {
                            setBusy(true);
                            void logout()
                                .then(() => navigate('/login'))
                                .catch(() =>
                                    setMessage(
                                        pt ? 'Não foi possível sair.' : 'Could not sign out.',
                                    ),
                                )
                                .finally(() => setBusy(false));
                        }}
                    >
                        {pt ? 'Sair' : 'Sign out'}
                    </Button>
                </section>
            )}
            {tab === 'password' && (
                <section className="dashboard-panel">
                    <h2>{pt ? 'TROCAR SENHA' : 'CHANGE PASSWORD'}</h2>
                    <form onSubmit={(e) => void submit(e, 'password')}>
                        {field(
                            'current_password',
                            pt ? 'Senha atual' : 'Current password',
                            currentPassword,
                            setCurrentPassword,
                            'password',
                        )}
                        {field(
                            'password',
                            pt ? 'Nova senha' : 'New password',
                            password,
                            setPassword,
                            'password',
                        )}
                        {field(
                            'password_confirmation',
                            pt ? 'Confirmar senha' : 'Confirm password',
                            confirmation,
                            setConfirmation,
                            'password',
                        )}
                        <Button disabled={busy} type="submit">
                            {pt ? 'Alterar senha' : 'Change password'}
                        </Button>
                    </form>
                </section>
            )}
            {(tab === 'addresses' || tab === 'orders') && loading && (
                <p role="status">{pt ? 'Carregando...' : 'Loading...'}</p>
            )}
            {(tab === 'addresses' || tab === 'orders') && failed && (
                <Failure retry={() => setReload((x) => x + 1)} />
            )}
            {tab === 'addresses' && !loading && !failed && (
                <section className="dashboard-panel">
                    <h2>{pt ? 'ENDEREÇOS' : 'ADDRESSES'}</h2>
                    {addresses.length === 0 && (
                        <p>{pt ? 'Nenhum endereço cadastrado.' : 'No addresses yet.'}</p>
                    )}
                    {addresses.map((a) => (
                        <article className="dashboard-row" key={a.id}>
                            <div>
                                <strong>
                                    {a.street}, {a.number}
                                </strong>
                                <p>
                                    {a.district}, {a.city}/{a.state} · {a.postal_code}
                                </p>
                                {a.is_default && <strong>{pt ? 'Padrão' : 'Default'}</strong>}
                            </div>
                            <div className="button-row">
                                <Button variant="quiet" onClick={() => setEditing(a)}>
                                    {pt ? 'Editar' : 'Edit'}
                                </Button>
                                <Button
                                    variant="quiet"
                                    disabled={busy || a.is_default}
                                    onClick={() => void addressAction(a.id, 'PUT')}
                                >
                                    {pt ? 'Definir padrão' : 'Set default'}
                                </Button>
                                <Button
                                    variant="quiet"
                                    disabled={busy}
                                    onClick={() => void addressAction(a.id, 'DELETE')}
                                >
                                    {pt ? 'Remover' : 'Remove'}
                                </Button>
                            </div>
                        </article>
                    ))}
                    {editing ? (
                        <AddressForm
                            address={editing === 'new' ? undefined : editing}
                            onCancel={() => setEditing(null)}
                            onSaved={() => {
                                setEditing(null);
                                setReload((x) => x + 1);
                            }}
                        />
                    ) : addresses.length < 4 ? (
                        <Button onClick={() => setEditing('new')}>
                            {pt ? 'Novo endereço' : 'New address'}
                        </Button>
                    ) : (
                        <p>
                            {pt
                                ? 'Limite de quatro endereços atingido.'
                                : 'Four-address limit reached.'}
                        </p>
                    )}
                </section>
            )}
            {tab === 'orders' && !loading && !failed && (
                <section className="dashboard-panel">
                    <h2>{pt ? 'SEUS PEDIDOS' : 'YOUR ORDERS'}</h2>
                    {orders.length === 0 ? (
                        <p>{pt ? 'Nenhum pedido ainda.' : 'No orders yet.'}</p>
                    ) : (
                        orders.map((o) => (
                            <article className="dashboard-row" key={o.id}>
                                <div>
                                    <strong>{o.order_number}</strong>
                                    <p>
                                        {formatOrderMoney(o.total, o.currency)} · {o.currency} ·{' '}
                                        {o.status}
                                    </p>
                                </div>
                                <Link to={'/account/orders/' + o.id}>
                                    {pt ? 'Ver detalhes' : 'View details'} →
                                </Link>
                            </article>
                        ))
                    )}
                    {lastOrderPage > 1 && (
                        <div className="pagination">
                            <Button
                                variant="quiet"
                                disabled={orderPage <= 1}
                                onClick={() => setOrderPage((p) => p - 1)}
                            >
                                {pt ? 'Anterior' : 'Previous'}
                            </Button>
                            <span>
                                {orderPage} / {lastOrderPage}
                            </span>
                            <Button
                                variant="quiet"
                                disabled={orderPage >= lastOrderPage}
                                onClick={() => setOrderPage((p) => p + 1)}
                            >
                                {pt ? 'Próxima' : 'Next'}
                            </Button>
                        </div>
                    )}
                </section>
            )}
            {tab === 'wishlist' && (
                <section className="dashboard-panel">
                    <h2>{pt ? 'FAVORITOS' : 'WISHLIST'}</h2>
                    {wishlistLoading ? (
                        <p role="status">{pt ? 'Carregando...' : 'Loading...'}</p>
                    ) : wishlistError ? (
                        <Failure retry={() => void refreshWishlist()} />
                    ) : wishlist.length === 0 ? (
                        <p>{pt ? 'Nenhum favorito ainda.' : 'No saved items yet.'}</p>
                    ) : (
                        <>
                            <ul>
                                {wishlist.map((item) => (
                                    <li key={item.id}>
                                        <Link to={'/products/' + item.product.slug}>
                                            {item.product.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            <Link to="/wishlist">
                                {pt ? 'Gerenciar favoritos' : 'Manage wishlist'} →
                            </Link>
                        </>
                    )}
                </section>
            )}
        </main>
    );
}

export function OrderDetailPage() {
    const { id } = useParams();
    const { locale } = useLocale();
    const pt = locale === 'pt_BR';
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        let active = true;
        setLoading(true);
        setFailed(false);
        apiRequest<{ data: Order }>('/api/v1/orders/' + encodeURIComponent(id ?? ''), {}, locale)
            .then((r) => {
                if (active) setOrder(r.data);
            })
            .catch(() => {
                if (active) setFailed(true);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [id, locale, retry]);
    return (
        <main className="store-section">
            <Link to="/account?tab=orders">← {pt ? 'Voltar aos pedidos' : 'Back to orders'}</Link>
            <h1>{pt ? 'DETALHES DO PEDIDO' : 'ORDER DETAILS'}</h1>
            {loading ? (
                <p role="status">{pt ? 'Carregando...' : 'Loading...'}</p>
            ) : failed ? (
                <Failure retry={() => setRetry((x) => x + 1)} />
            ) : (
                order && (
                    <section className="dashboard-panel order-detail">
                        <h2>{order.order_number}</h2>
                        <p>
                            {order.status} · {order.currency}
                        </p>
                        <ul>
                            {order.items.map((item, index) => (
                                <li key={index}>
                                    {item.product_name} × {item.quantity} —{' '}
                                    {formatOrderMoney(item.unit_price, order.currency)}{' '}
                                    {pt ? 'cada' : 'each'}
                                </li>
                            ))}
                        </ul>
                        <p>Subtotal: {formatOrderMoney(order.subtotal, order.currency)}</p>
                        <p>
                            {pt ? 'Frete' : 'Shipping'}:{' '}
                            {formatOrderMoney(order.shipping_price, order.currency)}
                        </p>
                        <p>
                            <strong>
                                Total: {formatOrderMoney(order.total, order.currency)} (
                                {order.currency})
                            </strong>
                        </p>
                        <p>
                            {order.shipping_address.street}, {order.shipping_address.number} —{' '}
                            {order.shipping_address.city}/{order.shipping_address.state} ·{' '}
                            {order.shipping_address.postal_code}
                        </p>
                    </section>
                )
            )}
        </main>
    );
}
