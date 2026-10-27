import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { Select } from './ui';

export function Header() {
    const { locale, setLocale } = useLocale();
    return (
        <header className="header">
            <Link className="wordmark" to="/">
                SNEAKERS<span>✳</span>
            </Link>
            <div className="header-right">
                <span className="header-note">
                    {locale === 'pt_BR' ? 'SEU PRÓXIMO PASSO' : 'YOUR NEXT MOVE'}
                </span>
                <label className="locale-label">
                    <span className="sr-only">
                        {locale === 'pt_BR' ? 'Idioma e moeda' : 'Language and currency'}
                    </span>
                    <Select
                        value={locale}
                        onChange={(event) =>
                            setLocale(event.target.value === 'pt_BR' ? 'pt_BR' : 'en')
                        }
                    >
                        <option value="en">EN / USD</option>
                        <option value="pt_BR">PT / BRL</option>
                    </Select>
                </label>
            </div>
        </header>
    );
}
