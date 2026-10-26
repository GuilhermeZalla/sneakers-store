import { storeLocales, type StoreLocale } from './locale.ts';

export class ApiError extends Error {
    status: number;
    errors: Record<string, string[]>;

    constructor(status: number, message: string, errors: Record<string, string[]> = {}) {
        super(message);
        this.status = status;
        this.errors = errors;
    }
}

function csrfToken(): string | undefined {
    const value = document.cookie
        .split('; ')
        .find((cookie) => cookie.startsWith('XSRF-TOKEN='))
        ?.slice(11);
    return value ? decodeURIComponent(value) : undefined;
}

export async function apiRequest<T>(
    path: string,
    options: RequestInit = {},
    locale: StoreLocale = 'en',
): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');
    headers.set('Accept-Language', storeLocales[locale].language);
    if (options.body) headers.set('Content-Type', 'application/json');
    const token = csrfToken();
    if (token && !['GET', 'HEAD'].includes(options.method ?? 'GET'))
        headers.set('X-XSRF-TOKEN', token);

    const response = await fetch(path, { ...options, headers, credentials: 'include' });
    const body: unknown = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
        const data =
            body && typeof body === 'object'
                ? (body as { message?: string; errors?: Record<string, string[]> })
                : {};
        throw new ApiError(response.status, data.message ?? response.statusText, data.errors ?? {});
    }
    return body as T;
}

export async function initializeCsrf(locale: StoreLocale): Promise<void> {
    await apiRequest('/sanctum/csrf-cookie', {}, locale);
}
