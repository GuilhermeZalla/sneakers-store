import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { NotificationBell, NotificationList } from '../components/NotificationBell';
import { NotificationProvider, useNotifications } from '../context/NotificationContext';
import { AuthProvider, useAuth, type User } from '../context/AuthContext';
import { LocaleProvider } from '../context/LocaleContext';
import { PasswordRecoveryPage } from '../pages/AccessPages';
import { POLL_INTERVAL, type StoreNotification } from './notifications';
import '../styles.css';

const makeUser = (id: number): User => ({
    id,
    name: 'Account ' + id,
    email: 'account' + id + '@example.test',
    locale: 'en',
    email_verified_at: '2026-01-01T00:00:00Z',
});
const harness = {
    user: makeUser(1) as User | null,
    items: [] as StoreNotification[],
    count: 2,
    fail: false,
    hold: false,
    hidden: false,
    listCalls: 0,
    pending: [] as (() => void)[],
    ticks: new Map<number, () => void>(),
    release() {
        this.pending.splice(0).forEach((resolve) => resolve());
    },
    tick() {
        this.ticks.forEach((callback) => callback());
    },
    account(id: number | null) {
        this.user = id === null ? null : makeUser(id);
        this.items =
            id === null
                ? []
                : [
                      {
                          id: 'notification-' + id,
                          event: 'welcome',
                          title: 'Private account ' + id,
                          body: 'Account-specific content',
                          url: '/account',
                          read_at: null,
                          created_at: '2026-01-01T00:00:00Z',
                      },
                  ];
    },
};
harness.account(1);
Object.assign(window, { notificationHarness: harness });
Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => (harness.hidden ? 'hidden' : 'visible'),
});
const originalInterval = window.setInterval.bind(window);
const originalClear = window.clearInterval.bind(window);
let timerId = 100000;
window.setInterval = ((callback: TimerHandler, milliseconds?: number) => {
    if (milliseconds === POLL_INTERVAL && typeof callback === 'function') {
        const id = ++timerId;
        harness.ticks.set(id, callback as () => void);
        return id;
    }
    return originalInterval(callback, milliseconds);
}) as typeof window.setInterval;
window.clearInterval = ((id?: number) => {
    if (id !== undefined && harness.ticks.delete(id)) return;
    originalClear(id);
}) as typeof window.clearInterval;
window.fetch = async (input, init) => {
    const path = String(input);
    const json = (data: unknown, status = 200) =>
        new Response(JSON.stringify(data), {
            status,
            headers: { 'Content-Type': 'application/json' },
        });
    if (path === '/api/v1/user') return harness.user ? json({ data: harness.user }) : json({}, 401);
    if (path.includes('/notifications')) {
        const fail = harness.fail;
        const items = structuredClone(harness.items);
        const count = harness.count;
        if (path.includes('?page=')) harness.listCalls++;
        if (harness.hold) await new Promise<void>((resolve) => harness.pending.push(resolve));
        if (fail) return json({}, 503);
        if (init?.method === 'PATCH') {
            harness.count = 0;
            return new Response(null, { status: 204 });
        }
        return path.includes('unread-count')
            ? json({ data: { unread_count: count } })
            : json({ data: items, meta: { current_page: 1, last_page: 1 } });
    }
    if (path === '/api/v1/auth/forgot-password')
        return json({
            message: 'If an account exists for this email, you will receive a reset link.',
        });
    if (path === '/sanctum/csrf-cookie') return new Response(null, { status: 204 });
    throw new Error('Unexpected test request: ' + path);
};
function Controls() {
    const auth = useAuth();
    const notifications = useNotifications();
    return (
        <>
            <button id="auth-refresh" onClick={() => void auth.refresh()}>
                Refresh account
            </button>
            <button id="notifications-refresh" onClick={() => void notifications.refresh()}>
                Refresh notifications
            </button>
            <output id="notification-state">
                {JSON.stringify({
                    count: notifications.count,
                    loading: notifications.loading,
                    error: notifications.error,
                    items: notifications.items,
                    user: auth.user?.id,
                })}
            </output>
            <NotificationBell />
            <NotificationList history />
        </>
    );
}
createRoot(document.getElementById('root')!).render(
    <LocaleProvider>
        <AuthProvider>
            <NotificationProvider>
                <BrowserRouter>
                    <Controls />
                    <PasswordRecoveryPage />
                </BrowserRouter>
            </NotificationProvider>
        </AuthProvider>
    </LocaleProvider>,
);
