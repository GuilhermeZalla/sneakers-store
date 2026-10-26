<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCartItemRequest;
use App\Http\Requests\UpdateCartItemRequest;
use App\Http\Resources\CartItemResource;
use App\Models\CartItem;
use App\Models\Product;
use App\Services\CartService;
use App\StoreLocale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class CartController extends Controller
{
    public function __construct(private CartService $cart) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', CartItem::class);
        $locale = StoreLocale::from(app()->getLocale());
        $items = $this->cart->items($request->user(), $locale);

        return response()->json([
            'data' => CartItemResource::collection($items)->resolve($request),
            'meta' => [
                'currency' => $locale->currency(),
                'subtotal' => $items->sum(fn (CartItem $item): int => $item->quantity * $item->unit_price),
            ],
        ]);
    }

    public function store(StoreCartItemRequest $request): CartItemResource
    {
        Gate::authorize('create', CartItem::class);
        $validated = $request->validated();
        $item = $this->cart->add(
            $request->user(),
            Product::query()->whereKey((int) $validated['product_id'])->firstOrFail(),
            (int) $validated['quantity'],
            StoreLocale::from(app()->getLocale()),
        );

        return new CartItemResource($item);
    }

    public function update(UpdateCartItemRequest $request, CartItem $cartItem): CartItemResource
    {
        Gate::authorize('update', $cartItem);

        return new CartItemResource($this->cart->update(
            $request->user(), $cartItem, (int) $request->validated('quantity'), StoreLocale::from(app()->getLocale()),
        ));
    }

    public function destroy(Request $request, CartItem $cartItem): Response
    {
        Gate::authorize('delete', $cartItem);
        $this->cart->delete($request->user(), $cartItem);

        return response()->noContent();
    }

    public function clear(Request $request): Response
    {
        Gate::authorize('viewAny', CartItem::class);
        $this->cart->clear($request->user());

        return response()->noContent();
    }
}
