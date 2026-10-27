import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AddressForm } from '../components/AddressForm';
import { Button, Stepper } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { useStore } from '../context/StoreContext';
import { apiRequest, ApiError } from '../lib/api';
import {
    createAttempt,
    formatOrderMoney,
    submitCheckout,
    type Address,
    type CheckoutAttempt,
    type Order,
    type ShippingOptions,
} from '../lib/checkout';

export function CheckoutPage() {
    const { user } = useAuth();
    const { locale, money } = useLocale();
    const pt = locale === 'pt_BR';
    const { cart, cartLoading, cartError, refreshCart } = useStore();
    const storageKey = 'checkout-attempt-' + user?.id;
    const [step, setStep] = useState(0);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [shipping, setShipping] = useState<ShippingOptions | null>(null);
    const [addressId, setAddressId] = useState<number | null>(null);
    const [shippingMethod, setShippingMethod] = useState('blue');
    const [adding, setAdding] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [retryLoad, setRetryLoad] = useState(0);
    const [busy, setBusy] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [message, setMessage] = useState('');
    const [order, setOrder] = useState<Order | null>(null);
    const [attempt, setAttempt] = useState<CheckoutAttempt | null>(() => {
        try {
            const raw = sessionStorage.getItem(storageKey);
            return raw ? (JSON.parse(raw) as CheckoutAttempt) : null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        let active = true;
        setLoading(true);
        setLoadError(false);
        Promise.all([
            apiRequest<{ data: Address[] }>('/api/v1/addresses', {}, locale),
            apiRequest<ShippingOptions>('/api/v1/shipping-methods', {}, locale),
        ])
            .then(([a, s]) => {
                if (active) {
                    setAddresses(a.data);
                    setShipping(s);
                    setAddressId(
                        (old) =>
                            old ?? a.data.find((x) => x.is_default)?.id ?? a.data[0]?.id ?? null,
                    );
                }
            })
            .catch(() => {
                if (active) setLoadError(true);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [locale, retryLoad]);

    async function finish() {
        if (busy) return;
        if (!attempt && (!addressId || !shippingMethod)) {
            setMessage(pt ? 'Escolha endereço e entrega.' : 'Choose an address and shipping.');
            return;
        }
        const current = attempt ?? createAttempt(addressId!, shippingMethod, locale);
        if (!attempt) {
            sessionStorage.setItem(storageKey, JSON.stringify(current));
            setAttempt(current);
        }
        setBusy(true);
        setMessage('');
        setErrors({});
        try {
            const result = await submitCheckout(current);
            setOrder(result);
            sessionStorage.removeItem(storageKey);
            setAttempt(null);
            setStep(3);
            void refreshCart();
        } catch (error) {
            if (error instanceof ApiError && error.status === 422) {
                setErrors(error.errors);
                setMessage(error.message);
                sessionStorage.removeItem(storageKey);
                setAttempt(null);
                setStep(error.errors.address_id ? 1 : error.errors.cart ? 0 : 2);
            } else if (error instanceof ApiError && error.status === 409)
                setMessage(
                    pt
                        ? 'Esta tentativa não corresponde ao pedido salvo.'
                        : 'This attempt does not match the saved order.',
                );
            else
                setMessage(
                    pt
                        ? 'Não foi possível confirmar. Tente novamente com a mesma chave.'
                        : 'Could not confirm. Retry with the same key.',
                );
        } finally {
            setBusy(false);
        }
    }
    const steps = pt
        ? ['Carrinho', 'Entrega', 'Pagamento', 'Confirmação']
        : ['Cart', 'Delivery', 'Payment', 'Confirmation'];
    return (
        <main className="store-section checkout">
            <span className="store-eyebrow">✳ CHECKOUT</span>
            <h1>{pt ? 'FINALIZAR PEDIDO.' : 'CHECKOUT.'}</h1>
            <Stepper steps={steps} current={step} />
            {attempt && !order && (
                <div className="form-alert" role="status">
                    {pt
                        ? 'Uma tentativa está aguardando confirmação. A repetição usa os mesmos dados e a mesma chave.'
                        : 'An attempt awaits confirmation. Retrying uses the same details and key.'}
                    <Button disabled={busy} onClick={() => void finish()}>
                        {busy ? '...' : pt ? 'Repetir confirmação' : 'Retry confirmation'}
                    </Button>
                </div>
            )}
            {message && !attempt && step !== 2 && (
                <p role="alert" className="form-alert">
                    {message}
                </p>
            )}
            {step === 0 && !attempt && (
                <section className="checkout-panel">
                    <h2>{steps[0]}</h2>
                    {cartLoading ? (
                        <p role="status">{pt ? 'Carregando...' : 'Loading...'}</p>
                    ) : cartError ? (
                        <div role="alert">
                            {pt ? 'Não foi possível carregar o carrinho.' : 'Could not load cart.'}
                            <Button onClick={() => void refreshCart()}>
                                {pt ? 'Tentar novamente' : 'Try again'}
                            </Button>
                        </div>
                    ) : !cart?.data.length ? (
                        <p>
                            {pt ? 'Seu carrinho está vazio.' : 'Your cart is empty.'}{' '}
                            <Link to="/catalog">{pt ? 'Ver catálogo' : 'Browse catalog'}</Link>
                        </p>
                    ) : (
                        <>
                            <ul>
                                {cart.data.map((item) => (
                                    <li key={item.id}>
                                        {item.product.name} × {item.quantity} —{' '}
                                        {money(item.subtotal)}
                                    </li>
                                ))}
                            </ul>
                            <p>
                                Subtotal: <strong>{money(cart.meta.subtotal)}</strong>
                            </p>
                            <Button onClick={() => setStep(1)}>
                                {pt ? 'Continuar' : 'Continue'} →
                            </Button>
                        </>
                    )}
                </section>
            )}
            {step === 1 && !attempt && (
                <section className="checkout-panel">
                    <h2>{steps[1]}</h2>
                    {loading ? (
                        <p role="status">{pt ? 'Carregando...' : 'Loading...'}</p>
                    ) : loadError ? (
                        <div role="alert">
                            {pt
                                ? 'Não foi possível carregar a entrega.'
                                : 'Could not load delivery.'}
                            <Button onClick={() => setRetryLoad((x) => x + 1)}>
                                {pt ? 'Tentar novamente' : 'Try again'}
                            </Button>
                        </div>
                    ) : (
                        <>
                            <fieldset>
                                <legend>{pt ? 'Escolha um endereço' : 'Choose an address'}</legend>
                                {addresses.length === 0 && (
                                    <p>
                                        {pt ? 'Nenhum endereço cadastrado.' : 'No saved addresses.'}
                                    </p>
                                )}
                                {addresses.map((a) => (
                                    <label className="radio-card" key={a.id}>
                                        <input
                                            type="radio"
                                            name="address"
                                            checked={addressId === a.id}
                                            onChange={() => setAddressId(a.id)}
                                        />{' '}
                                        {a.street}, {a.number} — {a.city}/{a.state} ({a.postal_code}
                                        )
                                    </label>
                                ))}
                                {errors.address_id?.[0] && (
                                    <p role="alert" className="field-error">
                                        {errors.address_id[0]}
                                    </p>
                                )}
                            </fieldset>
                            {adding ? (
                                <AddressForm
                                    onSaved={(a) => {
                                        setAddresses((old) => [...old, a]);
                                        setAddressId(a.id);
                                        setAdding(false);
                                    }}
                                    onCancel={() => setAdding(false)}
                                />
                            ) : addresses.length < 4 ? (
                                <Button variant="quiet" onClick={() => setAdding(true)}>
                                    {pt ? 'Adicionar endereço' : 'Add address'}
                                </Button>
                            ) : (
                                <p>
                                    {pt
                                        ? 'Limite de quatro endereços atingido.'
                                        : 'Four-address limit reached.'}
                                </p>
                            )}
                            <fieldset>
                                <legend>{pt ? 'Entrega' : 'Shipping'}</legend>
                                {shipping &&
                                    Object.entries(shipping.data).map(([key, option]) => (
                                        <label className="radio-card" key={key}>
                                            <input
                                                type="radio"
                                                name="shipping"
                                                value={key}
                                                checked={shippingMethod === key}
                                                onChange={() => setShippingMethod(key)}
                                            />{' '}
                                            {key.toUpperCase()} · {option.days}{' '}
                                            {pt ? 'dias' : 'days'} · {money(option.price)}
                                        </label>
                                    ))}
                                {errors.shipping_method?.[0] && (
                                    <p role="alert" className="field-error">
                                        {errors.shipping_method[0]}
                                    </p>
                                )}
                            </fieldset>
                            <div className="button-row">
                                <Button variant="quiet" onClick={() => setStep(0)}>
                                    {pt ? 'Voltar' : 'Back'}
                                </Button>
                                <Button disabled={!addressId || adding} onClick={() => setStep(2)}>
                                    {pt ? 'Continuar' : 'Continue'} →
                                </Button>
                            </div>
                        </>
                    )}
                </section>
            )}
            {step === 2 && !attempt && (
                <section className="checkout-panel">
                    <h2>{steps[2]}</h2>
                    <p>
                        <strong>Wallet</strong> —{' '}
                        {pt
                            ? 'pagamento simulado pelo valor integral do pedido.'
                            : 'simulated payment for the full order total.'}
                    </p>
                    <p>
                        {pt ? 'Subtotal' : 'Subtotal'}: {cart && money(cart.meta.subtotal)}
                    </p>
                    <p>
                        {pt ? 'Entrega' : 'Shipping'}:{' '}
                        {shipping && money(shipping.data[shippingMethod]?.price ?? 0)}
                    </p>
                    <p>
                        {pt
                            ? 'O total final será calculado pelo servidor.'
                            : 'The final total is calculated by the server.'}
                    </p>
                    {message && (
                        <p role="alert" className="form-alert">
                            {message}
                        </p>
                    )}
                    <div className="button-row">
                        <Button variant="quiet" onClick={() => setStep(1)}>
                            {pt ? 'Voltar' : 'Back'}
                        </Button>
                        <Button disabled={busy} onClick={() => void finish()}>
                            {busy
                                ? pt
                                    ? 'Enviando...'
                                    : 'Submitting...'
                                : pt
                                  ? 'Finalizar pedido'
                                  : 'Place order'}
                        </Button>
                    </div>
                </section>
            )}
            {attempt && message && (
                <p role="alert" className="form-alert">
                    {message}
                </p>
            )}
            {step === 3 && order && (
                <section className="checkout-panel">
                    <h2>{pt ? 'PEDIDO CONFIRMADO.' : 'ORDER CONFIRMED.'}</h2>
                    <p>
                        {pt ? 'Pedido' : 'Order'}: {order.order_number}
                    </p>
                    <p>
                        {pt ? 'Total' : 'Total'}:{' '}
                        <strong>{formatOrderMoney(order.total, order.currency)}</strong> (
                        {order.currency})
                    </p>
                    <Link to={'/account/orders/' + order.id}>
                        {pt ? 'Ver pedido' : 'View order'} →
                    </Link>
                </section>
            )}
        </main>
    );
}
