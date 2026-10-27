import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { useNotifications } from '../context/NotificationContext';
import { NotificationIndicator } from '../lib/notifications';
import { formatDate } from '../lib/locale';
import { Button } from './ui';

export function NotificationList({ history = false }: { history?: boolean }) {
    const { items, count, loading, error, busy, page, lastPage, refresh, read, readAll } =
        useNotifications();
    const { locale } = useLocale();
    const pt = locale === 'pt_BR';
    const navigate = useNavigate();
    return (
        <div className="notification-list">
            {error && (
                <div role="alert">
                    <p>
                        {pt
                            ? 'Não foi possível atualizar as notificações.'
                            : 'Could not update notifications.'}
                    </p>
                    <Button onClick={() => void refresh()}>
                        {pt ? 'Tentar novamente' : 'Try again'}
                    </Button>
                </div>
            )}
            {loading && (
                <div className="notification-skeleton" role="status">
                    <span className="sr-only">
                        {pt ? 'Carregando notificações...' : 'Loading notifications...'}
                    </span>
                    <span />
                    <span />
                    <span />
                </div>
            )}
            {!loading && !error && items.length === 0 && (
                <p>{pt ? 'Nenhuma notificação ainda.' : 'No notifications yet.'}</p>
            )}
            {items.length > 0 && (
                <ul>
                    {items.map((item) => (
                        <li key={item.id} className={item.read_at ? '' : 'notification-unread'}>
                            <Link
                                to={item.url}
                                onClick={async (event) => {
                                    event.preventDefault();
                                    if (await read(item.id)) navigate(item.url);
                                }}
                            >
                                <strong>{item.title}</strong>
                                <p>{item.body}</p>
                                <time dateTime={item.created_at}>
                                    {formatDate(item.created_at, locale)}
                                </time>
                            </Link>
                            {!item.read_at && (
                                <button
                                    className="text-button"
                                    disabled={busy}
                                    onClick={() => void read(item.id)}
                                >
                                    {pt ? 'Marcar como lida' : 'Mark as read'}
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            <div className="button-row">
                <Button
                    variant="quiet"
                    disabled={busy || count === 0}
                    onClick={() => void readAll()}
                >
                    {pt ? 'Marcar todas como lidas' : 'Mark all as read'}
                </Button>
                {!history && (
                    <Link to="/account?tab=notifications">
                        {pt ? 'Ver histórico' : 'View history'} →
                    </Link>
                )}
            </div>
            {history && lastPage > 1 && (
                <div className="pagination">
                    <Button disabled={loading || page <= 1} onClick={() => void refresh(page - 1)}>
                        {pt ? 'Anterior' : 'Previous'}
                    </Button>
                    <span>
                        {page} / {lastPage}
                    </span>
                    <Button
                        disabled={loading || page >= lastPage}
                        onClick={() => void refresh(page + 1)}
                    >
                        {pt ? 'Próxima' : 'Next'}
                    </Button>
                </div>
            )}
        </div>
    );
}
export function NotificationBell() {
    const { user } = useAuth();
    const { locale } = useLocale();
    const { count, refresh } = useNotifications();
    const [open, setOpen] = useState(false);
    const wrapper = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const panelId = useId();
    useEffect(() => {
        if (!open) return;
        const outside = (event: PointerEvent) => {
            if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
        };
        const escape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
                trigger.current?.focus();
            }
        };
        document.addEventListener('pointerdown', outside);
        document.addEventListener('keydown', escape);
        return () => {
            document.removeEventListener('pointerdown', outside);
            document.removeEventListener('keydown', escape);
        };
    }, [open]);
    if (!user) return null;
    return (
        <div className="notification-bell" ref={wrapper}>
            <button
                type="button"
                className="notification-trigger"
                ref={trigger}
                aria-expanded={open}
                aria-haspopup="dialog"
                aria-controls={panelId}
                onClick={() => {
                    setOpen(!open);
                    if (!open) void refresh(1);
                }}
                onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        setOpen(true);
                        void refresh(1);
                        window.setTimeout(
                            () => wrapper.current?.querySelector<HTMLAnchorElement>('a')?.focus(),
                            0,
                        );
                    }
                }}
            >
                <NotificationIndicator count={count} locale={locale} />
            </button>
            {open && (
                <section
                    id={panelId}
                    role="dialog"
                    aria-label={locale === 'pt_BR' ? 'Notificações' : 'Notifications'}
                    className="notification-popover"
                    onClick={(event) => {
                        if ((event.target as HTMLElement).closest('a')) setOpen(false);
                    }}
                >
                    <div className="notification-heading">
                        <h2>{locale === 'pt_BR' ? 'Notificações' : 'Notifications'}</h2>
                        <button
                            className="text-button"
                            onClick={() => {
                                setOpen(false);
                                trigger.current?.focus();
                            }}
                        >
                            {locale === 'pt_BR' ? 'Fechar' : 'Close'}
                        </button>
                    </div>
                    <NotificationList />
                </section>
            )}
        </div>
    );
}
