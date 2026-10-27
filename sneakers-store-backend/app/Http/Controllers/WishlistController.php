<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWishlistItemRequest;
use App\Http\Resources\WishlistItemResource;
use App\Models\User;
use App\Models\WishlistItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class WishlistController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', WishlistItem::class);

        return WishlistItemResource::collection($request->user()->wishlistItems()->with('product')->orderBy('id')->get());
    }

    public function store(StoreWishlistItemRequest $request): WishlistItemResource
    {
        Gate::authorize('create', WishlistItem::class);
        $user = $request->user();
        $item = DB::transaction(function () use ($user, $request): WishlistItem {
            User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();

            return $user->wishlistItems()->firstOrCreate(['product_id' => $request->validated('product_id')]);
        });

        return new WishlistItemResource($item->load('product'));
    }

    public function destroy(Request $request, WishlistItem $wishlistItem): Response
    {
        Gate::authorize('delete', $wishlistItem);
        $request->user()->wishlistItems()->whereKey($wishlistItem->id)->firstOrFail()->delete();

        return response()->noContent();
    }
}
