import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { ApiError } from '../lib/api';
import { formatDate } from '../lib/locale';
import { reviewApi, type ReviewPage, type ReviewSummary } from '../lib/reviews';
import { Button } from './ui';

export function RatingSummary({ rating, review_count }: ReviewSummary) {
    const { locale } = useLocale();
    const pt = locale === 'pt_BR';
    const formatted = rating.toLocaleString(pt ? 'pt-BR' : 'en-US', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    });
    return (
        <span className="rating-summary">
            <span className="rating-stars" aria-hidden="true">
                ☆☆☆☆☆
                <span style={{ width: `${Math.max(0, Math.min(5, rating)) * 20}%` }}>★★★★★</span>
            </span>
            {review_count > 0 ? (
                <span>
                    {formatted} / 5 · {review_count}{' '}
                    {pt
                        ? review_count === 1
                            ? 'avaliação'
                            : 'avaliações'
                        : review_count === 1
                          ? 'review'
                          : 'reviews'}
                </span>
            ) : (
                <span>{pt ? 'Sem avaliações ainda' : 'No reviews yet'}</span>
            )}
        </span>
    );
}
export function ProductReviews({
    slug,
    onSummary,
}: {
    slug: string;
    onSummary: (summary: ReviewSummary) => void;
}) {
    const { locale } = useLocale();
    const { user } = useAuth();
    const pt = locale === 'pt_BR';
    const [result, setResult] = useState<ReviewPage | null>(null);
    const [page, setPage] = useState(1);
    const [retry, setRetry] = useState(0);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [confirmRemove, setConfirmRemove] = useState(false);
    useEffect(() => {
        setPage(1);
        setResult(null);
        setSuccess('');
        setError('');
    }, [slug, user?.id]);
    useEffect(() => {
        let active = true;
        setLoading(true);
        setFailed(false);
        reviewApi
            .list(slug, page, locale)
            .then((data) => {
                if (!active) return;
                setResult(data);
                onSummary(data.summary);
                setRating(data.own_review?.rating ?? 0);
                setComment(data.own_review?.comment ?? '');
            })
            .catch(() => {
                if (active) setFailed(true);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [slug, page, locale, retry, user?.id, onSummary]);
    async function mutate(remove: boolean) {
        setBusy(true);
        setError('');
        setSuccess('');
        try {
            if (remove) await reviewApi.remove(slug, locale);
            else await reviewApi.save(slug, rating, comment.trim(), locale);
            setConfirmRemove(false);
            setPage(1);
            setRetry((v) => v + 1);
            setSuccess(
                remove
                    ? pt
                        ? 'Avaliação removida.'
                        : 'Review removed.'
                    : pt
                      ? 'Avaliação salva. Obrigado por compartilhar!'
                      : 'Review saved. Thanks for sharing!',
            );
        } catch (reason) {
            setError(
                reason instanceof ApiError && reason.status === 422
                    ? Object.values(reason.errors).flat().join(' ') ||
                          (pt
                              ? 'Escolha uma nota de 1 a 5 e escreva de 5 a 2.000 caracteres.'
                              : 'Choose 1 to 5 stars and write 5 to 2,000 characters.')
                    : pt
                      ? 'Não foi possível salvar. Tente novamente.'
                      : 'Could not save. Please try again.',
            );
        } finally {
            setBusy(false);
        }
    }
    return (
        <section className="product-reviews" aria-labelledby="reviews-title">
            <header className="reviews-heading">
                <div>
                    <span className="store-eyebrow">
                        {pt ? 'QUEM USA, CONTA' : 'FROM THE COMMUNITY'}
                    </span>
                    <h2 id="reviews-title">{pt ? 'Avaliações do produto' : 'Product reviews'}</h2>
                </div>
                {result && <RatingSummary {...result.summary} />}
            </header>
            <div className="reviews-layout">
                <div className="review-feed" aria-busy={loading}>
                    {loading ? (
                        <p role="status">
                            {pt ? 'Carregando avaliações...' : 'Loading reviews...'}
                        </p>
                    ) : failed ? (
                        <div role="alert">
                            <p>
                                {pt
                                    ? 'Não foi possível carregar as avaliações.'
                                    : 'Could not load reviews.'}
                            </p>
                            <Button variant="quiet" onClick={() => setRetry((v) => v + 1)}>
                                {pt ? 'Tentar novamente' : 'Try again'}
                            </Button>
                        </div>
                    ) : (
                        <>
                            {!result?.data.length && (
                                <p>
                                    {pt
                                        ? 'Ainda não há avaliações. Conte como foi sua experiência com este produto.'
                                        : 'No reviews yet. Share your experience with this product.'}
                                </p>
                            )}
                            {result?.data.map((review) => (
                                <article className="review-entry" key={review.id}>
                                    <div className="review-byline">
                                        <strong>{review.author_name}</strong>
                                        <time dateTime={review.updated_at}>
                                            {formatDate(review.updated_at, locale)}
                                        </time>
                                    </div>
                                    <span
                                        className="review-score"
                                        aria-label={`${review.rating} ${pt ? 'de 5 estrelas' : 'out of 5 stars'}`}
                                    >
                                        <span aria-hidden="true">
                                            {'★'.repeat(review.rating)}
                                            {'☆'.repeat(5 - review.rating)}
                                        </span>
                                    </span>
                                    <p>{review.comment}</p>
                                    {review.is_mine && (
                                        <small>
                                            {pt
                                                ? 'Sua avaliação — use o formulário para editar.'
                                                : 'Your review — use the form to edit.'}
                                        </small>
                                    )}
                                </article>
                            ))}
                            {result && result.meta.last_page > 1 && (
                                <div className="pagination">
                                    <Button
                                        variant="quiet"
                                        disabled={page <= 1 || busy}
                                        onClick={() => setPage((p) => p - 1)}
                                    >
                                        {pt ? 'Anterior' : 'Previous'}
                                    </Button>
                                    <span>
                                        {page} / {result.meta.last_page}
                                    </span>
                                    <Button
                                        variant="quiet"
                                        disabled={page >= result.meta.last_page || busy}
                                        onClick={() => setPage((p) => p + 1)}
                                    >
                                        {pt ? 'Próxima' : 'Next'}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
                <div className="review-compose">
                    <h3>
                        {result?.own_review
                            ? pt
                                ? 'Sua avaliação'
                                : 'Your review'
                            : pt
                              ? 'Compartilhe sua opinião'
                              : 'Share your thoughts'}
                    </h3>
                    {!user ? (
                        <p>
                            {pt
                                ? 'Entre na sua conta para avaliar este produto.'
                                : 'Sign in to review this product.'}{' '}
                            <Link to="/login" state={{ from: '/products/' + slug }}>
                                {pt ? 'Entrar' : 'Sign in'} →
                            </Link>
                        </p>
                    ) : !user.email_verified_at ? (
                        <p>
                            <Link to="/verify-email">
                                {pt
                                    ? 'Confirme seu e-mail para publicar uma avaliação.'
                                    : 'Verify your email to publish a review.'}
                            </Link>
                        </p>
                    ) : (
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                void mutate(false);
                            }}
                        >
                            <fieldset
                                className="review-rating"
                                disabled={busy || loading || failed}
                            >
                                <legend>{pt ? 'Sua nota' : 'Your rating'}</legend>
                                <div>
                                    {[1, 2, 3, 4, 5].map((value) => (
                                        <label
                                            key={value}
                                            className={value <= rating ? 'is-selected' : ''}
                                        >
                                            <input
                                                type="radio"
                                                name="review-rating"
                                                value={value}
                                                checked={rating === value}
                                                required
                                                onChange={() => setRating(value)}
                                            />
                                            <span aria-hidden="true">★</span>
                                            <span className="sr-only">
                                                {value}{' '}
                                                {pt
                                                    ? value === 1
                                                        ? 'estrela'
                                                        : 'estrelas'
                                                    : value === 1
                                                      ? 'star'
                                                      : 'stars'}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                            <label className="review-comment">
                                {pt ? 'Seu comentário' : 'Your comment'}
                                <textarea
                                    className="input"
                                    value={comment}
                                    onChange={(event) => setComment(event.target.value)}
                                    required
                                    minLength={5}
                                    maxLength={2000}
                                    rows={5}
                                    disabled={busy || loading || failed}
                                    aria-describedby="review-guidance"
                                />
                            </label>
                            <small id="review-guidance">
                                {pt
                                    ? 'Uma avaliação por conta. Escreva de 5 a 2.000 caracteres sobre o produto.'
                                    : 'One review per account. Write 5 to 2,000 characters about the product.'}
                            </small>
                            {error && (
                                <p className="field-error" role="alert">
                                    {error}
                                </p>
                            )}
                            {success && <p role="status">{success}</p>}
                            <div className="button-row">
                                <Button
                                    type="submit"
                                    disabled={
                                        busy ||
                                        loading ||
                                        failed ||
                                        rating === 0 ||
                                        comment.trim().length < 5
                                    }
                                >
                                    {busy
                                        ? pt
                                            ? 'Salvando...'
                                            : 'Saving...'
                                        : result?.own_review
                                          ? pt
                                              ? 'Atualizar avaliação'
                                              : 'Update review'
                                          : pt
                                            ? 'Publicar avaliação'
                                            : 'Publish review'}
                                </Button>
                                {result?.own_review && (
                                    <button
                                        type="button"
                                        className="text-button"
                                        disabled={busy}
                                        onClick={() => setConfirmRemove((v) => !v)}
                                    >
                                        {pt ? 'Remover' : 'Remove'}
                                    </button>
                                )}
                            </div>
                            {confirmRemove && (
                                <div className="review-remove">
                                    <p>
                                        {pt
                                            ? 'Remover sua avaliação deste produto?'
                                            : 'Remove your review from this product?'}
                                    </p>
                                    <div className="button-row">
                                        <Button
                                            variant="quiet"
                                            disabled={busy}
                                            onClick={() => setConfirmRemove(false)}
                                        >
                                            {pt ? 'Cancelar' : 'Cancel'}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            disabled={busy}
                                            onClick={() => void mutate(true)}
                                        >
                                            {pt ? 'Confirmar remoção' : 'Confirm removal'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </section>
    );
}
