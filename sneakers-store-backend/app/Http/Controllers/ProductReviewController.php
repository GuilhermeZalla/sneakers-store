<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductReviewRequest;
use App\Http\Resources\ProductReviewResource;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ProductReviewController extends Controller
{
    public function index(Request $request, Product $product): AnonymousResourceCollection
    {
        $own = $request->user('sanctum') === null ? null : $product->reviews()->with('user')->where('user_id', $request->user('sanctum')->id)->first();

        return ProductReviewResource::collection($product->reviews()->with('user')->latest()->orderByDesc('id')->paginate(10))->additional([
            'summary' => ['rating' => round((float) $product->getAttribute('reviews_avg_rating'), 1), 'review_count' => (int) $product->getAttribute('reviews_count')],
            'own_review' => $own === null ? null : (new ProductReviewResource($own))->resolve($request),
        ]);
    }

    public function store(StoreProductReviewRequest $request, Product $product): ProductReviewResource
    {
        Gate::authorize('create', ProductReview::class);
        $review = DB::transaction(function () use ($request, $product): ProductReview {
            User::query()->whereKey($request->user()->id)->lockForUpdate()->firstOrFail();

            return $product->reviews()->updateOrCreate(['user_id' => $request->user()->id], $request->safe()->only(['rating', 'comment']));
        });

        return new ProductReviewResource($review->load('user'));
    }

    public function destroy(Request $request, Product $product): Response
    {
        $review = $product->reviews()->where('user_id', $request->user()->id)->firstOrFail();
        Gate::authorize('delete', $review);
        $review->delete();

        return response()->noContent();
    }
}
