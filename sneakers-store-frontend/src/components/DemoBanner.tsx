import { useLocale } from '../context/LocaleContext';

export function DemoBanner() {
    const { locale } = useLocale();
    const pt = locale === 'pt_BR';
    return (
        <aside className="demo-banner" aria-label={pt ? 'Demonstração' : 'Demonstration'}>
            <p>
                <strong>{pt ? 'Modo demonstração' : 'Demo mode'}</strong>
                {' · '}
                {pt
                    ? 'Dados fictícios. Sem cobranças ou envio de e-mails. Use apenas dados de exemplo.'
                    : 'Sample data. No charges or emails. Use sample information only.'}
            </p>
            <button
                type="button"
                onClick={() => void import('../lib/demo').then((module) => module.resetDemo())}
            >
                {pt ? 'Reiniciar demo' : 'Reset demo'}
            </button>
        </aside>
    );
}
