import { useState, type FormEvent } from 'react';
import { ApiError, apiRequest } from '../lib/api';
import { formatPostalCode, type Address, type AddressInput } from '../lib/checkout';
import { useLocale } from '../context/LocaleContext';
import { Button, Input, Select } from './ui';

const empty: AddressInput = {
    type: 'home',
    postal_code: '',
    street: '',
    number: '',
    complement: '',
    reference: '',
    district: '',
    city: '',
    state: 'SP',
    is_default: false,
};
const states = [
    'AC',
    'AL',
    'AP',
    'AM',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MT',
    'MS',
    'MG',
    'PA',
    'PB',
    'PR',
    'PE',
    'PI',
    'RJ',
    'RN',
    'RS',
    'RO',
    'RR',
    'SC',
    'SP',
    'SE',
    'TO',
];
export function AddressForm({
    address,
    onSaved,
    onCancel,
}: {
    address?: Address;
    onSaved: (address: Address) => void;
    onCancel: () => void;
}) {
    const { locale } = useLocale();
    const pt = locale === 'pt_BR';
    const [form, setForm] = useState<AddressInput>(() => (address ? { ...address } : empty));
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    function update(key: keyof AddressInput, value: string | boolean) {
        setForm((old) => ({ ...old, [key]: value }));
        setErrors((old) => ({ ...old, [key]: [] }));
    }
    function field(
        key: 'postal_code' | 'street' | 'number' | 'complement' | 'reference' | 'district' | 'city',
        label: string,
        required = true,
    ) {
        return (
            <div className="field">
                <label htmlFor={'address-' + key}>{label}</label>
                <Input
                    id={'address-' + key}
                    value={form[key] ?? ''}
                    required={required}
                    inputMode={key === 'postal_code' ? 'numeric' : undefined}
                    onChange={(e) =>
                        update(
                            key,
                            key === 'postal_code'
                                ? formatPostalCode(e.target.value)
                                : e.target.value,
                        )
                    }
                    pattern={key === 'postal_code' ? '[0-9]{5}-[0-9]{3}' : undefined}
                    aria-invalid={!!errors[key]?.length}
                    aria-describedby={errors[key]?.length ? 'address-' + key + '-error' : undefined}
                />
                {errors[key]?.[0] && (
                    <span className="field-error" id={'address-' + key + '-error'}>
                        {errors[key][0]}
                    </span>
                )}
            </div>
        );
    }
    async function submit(event: FormEvent) {
        event.preventDefault();
        setBusy(true);
        setErrors({});
        setMessage('');
        try {
            const result = await apiRequest<{ data: Address }>(
                address ? '/api/v1/addresses/' + address.id : '/api/v1/addresses',
                { method: address ? 'PATCH' : 'POST', body: JSON.stringify(form) },
                locale,
            );
            onSaved(result.data);
        } catch (error) {
            if (error instanceof ApiError && error.status === 422) {
                setErrors(error.errors);
                setMessage(error.errors.address?.[0] ?? error.message);
            } else
                setMessage(
                    pt ? 'Não foi possível salvar o endereço.' : 'Could not save the address.',
                );
        } finally {
            setBusy(false);
        }
    }
    return (
        <form onSubmit={(e) => void submit(e)} className="address-form">
            {message && (
                <p role="alert" className="form-alert">
                    {message}
                </p>
            )}
            <div className="field">
                <label htmlFor="address-type">{pt ? 'Tipo' : 'Type'}</label>
                <Select
                    id="address-type"
                    value={form.type}
                    onChange={(e) => update('type', e.target.value)}
                >
                    <option value="home">{pt ? 'Casa' : 'Home'}</option>
                    <option value="work">{pt ? 'Trabalho' : 'Work'}</option>
                    <option value="other">{pt ? 'Outro' : 'Other'}</option>
                </Select>
                {errors.type?.[0] && <span className="field-error">{errors.type[0]}</span>}
            </div>
            <div className="field-grid">
                {field('postal_code', pt ? 'CEP' : 'Postal code')}
                {field('number', pt ? 'Número' : 'Number')}
            </div>
            {field('street', pt ? 'Rua' : 'Street')}
            {field('complement', pt ? 'Complemento' : 'Apartment', false)}
            {field('reference', pt ? 'Referência' : 'Reference', false)}
            {field('district', pt ? 'Bairro' : 'District')}
            <div className="field-grid">
                {field('city', pt ? 'Cidade' : 'City')}
                <div className="field">
                    <label htmlFor="address-state">{pt ? 'Estado' : 'State'}</label>
                    <Select
                        id="address-state"
                        value={form.state}
                        onChange={(e) => update('state', e.target.value)}
                    >
                        {states.map((s) => (
                            <option key={s}>{s}</option>
                        ))}
                    </Select>
                    {errors.state?.[0] && <span className="field-error">{errors.state[0]}</span>}
                </div>
            </div>
            <label className="check-label">
                <input
                    type="checkbox"
                    checked={form.is_default}
                    onChange={(e) => update('is_default', e.target.checked)}
                />{' '}
                {pt ? 'Endereço padrão' : 'Default address'}
            </label>
            <div className="button-row">
                <Button type="submit" disabled={busy}>
                    {busy ? '...' : pt ? 'Salvar endereço' : 'Save address'}
                </Button>
                <Button variant="quiet" onClick={onCancel}>
                    {pt ? 'Cancelar' : 'Cancel'}
                </Button>
            </div>
        </form>
    );
}
