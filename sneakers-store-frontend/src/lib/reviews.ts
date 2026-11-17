import { apiRequest } from './api.ts';
import type { StoreLocale } from './locale.ts';

export type ReviewSummary = { rating: number; review_count: number };
export type ProductReview = {
    id: number;
    rating: number;
    comment: string;
    author_name: string;
    is_mine: boolean;
    created_at: string;
    updated_at: string;
};
export type ReviewPage = {
    data: ProductReview[];
    summary: ReviewSummary;
    own_review: ProductReview | null;
    meta: { current_page: number; last_page: number; total: number };
};
const path = (slug: string) => '/api/v1/products/' + encodeURIComponent(slug);
export const reviewApi = {
    list: (slug: string, page: number, locale: StoreLocale) =>
        apiRequest<ReviewPage>(path(slug) + '/reviews?page=' + page, {}, locale),
    save: (slug: string, rating: number, comment: string, locale: StoreLocale) =>
        apiRequest<{ data: ProductReview }>(
            path(slug) + '/review',
            { method: 'PUT', body: JSON.stringify({ rating, comment }) },
            locale,
        ),
    remove: (slug: string, locale: StoreLocale) =>
        apiRequest(path(slug) + '/review', { method: 'DELETE' }, locale),
};
