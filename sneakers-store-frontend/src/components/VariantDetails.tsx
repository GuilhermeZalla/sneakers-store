import { useLocale } from '../context/LocaleContext';
import { formatProductColor } from '../lib/locale';
import type { ProductOptions } from '../lib/store';

export function VariantDetails({ size, color }: ProductOptions) {
    const { locale } = useLocale();
    const pt = locale === 'pt_BR';
    if (!size && !color) return null;
    return (
        <span className="variant-details">
            {[
                size ? `${pt ? 'Tamanho' : 'Size'}: ${size}` : '',
                color ? `${pt ? 'Cor' : 'Color'}: ${formatProductColor(color, locale)}` : '',
            ]
                .filter(Boolean)
                .join(' · ')}
        </span>
    );
}
