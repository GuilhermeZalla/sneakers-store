import { createElement } from 'react';
import { Bell } from 'lucide-react';
import { apiRequest } from './api.ts';
import type { StoreLocale } from './locale.ts';

export type StoreNotification = {
    id: string;
    event: string;
    title: string;
    body: string;
    url: string;
    read_at: string | null;
    created_at: string;
};
export type NotificationPage = {
    data: StoreNotification[];
    meta: { current_page: number; last_page: number };
};
export const POLL_INTERVAL = 30_000;
export const notificationApi = {
    list: (page: number, locale: StoreLocale) =>
        apiRequest<NotificationPage>('/api/v1/notifications?page=' + page, {}, locale),
    count: (locale: StoreLocale) =>
        apiRequest<{ data: { unread_count: number } }>(
            '/api/v1/notifications/unread-count',
            {},
            locale,
        ),
    read: (id: string, locale: StoreLocale) =>
        apiRequest(
            '/api/v1/notifications/' + encodeURIComponent(id) + '/read',
            { method: 'PATCH' },
            locale,
        ),
    readAll: (locale: StoreLocale) =>
        apiRequest('/api/v1/notifications/read-all', { method: 'PATCH' }, locale),
};
export function notificationLabel(count: number, locale: StoreLocale): string {
    return locale === 'pt_BR'
        ? 'Notificações: ' + count + ' não lidas'
        : 'Notifications: ' + count + ' unread';
}
export function NotificationIndicator({ count, locale }: { count: number; locale: StoreLocale }) {
    return createElement(
        'span',
        { className: 'notification-indicator' },
        createElement(Bell, { size: 20, 'aria-hidden': true }),
        createElement('span', { className: 'sr-only' }, notificationLabel(count, locale)),
        count > 0
            ? createElement(
                  'span',
                  { className: 'notification-count', 'aria-hidden': true },
                  count > 99 ? '99+' : count,
              )
            : null,
    );
}
