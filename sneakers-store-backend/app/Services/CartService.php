<?php

namespace App\Services;

use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use App\StoreLocale;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CartService
{
    /** @return Collection<int, CartItem> */
    public function items(User $user, StoreLocale $locale): Collection
    {
        return DB::transaction(function () use ($user, $locale): Collection {
            $this->lockUser($user);
            $this->synchronizeCurrency($user, $locale);

            return $user->cartItems()->with('product')->orderBy('id')->get();
        });
    }

    public function add(User $user, Product $product, int $quantity, StoreLocale $locale): CartItem
    {
        return DB::transaction(function () use ($user, $product, $quantity, $locale): CartItem {
            $this->lockUser($user);
            $this->synchronizeCurrency($user, $locale);
            $item = $user->cartItems()->where('product_id', $product->id)->first();

            if ($item !== null) {
                if ($item->quantity + $quantity > 999) {
                    throw ValidationException::withMessages(['quantity' => __('Cart quantity cannot exceed 999.')]);
                }

                $item->update(['quantity' => $item->quantity + $quantity]);
            } else {
                $item = $user->cartItems()->create([
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'unit_price' => $product->priceFor($locale),
                    'currency' => $locale->currency(),
                ]);
            }

            return $item->load('product');
        });
    }

    public function update(User $user, CartItem $item, int $quantity, StoreLocale $locale): CartItem
    {
        return DB::transaction(function () use ($user, $item, $quantity, $locale): CartItem {
            $this->lockUser($user);
            $this->synchronizeCurrency($user, $locale);
            $ownedItem = $user->cartItems()->whereKey($item->id)->firstOrFail();
            $ownedItem->update(['quantity' => $quantity]);

            return $ownedItem->load('product');
        });
    }

    public function delete(User $user, CartItem $item): void
    {
        DB::transaction(function () use ($user, $item): void {
            $this->lockUser($user);
            $user->cartItems()->whereKey($item->id)->firstOrFail()->delete();
        });
    }

    public function clear(User $user): void
    {
        DB::transaction(function () use ($user): void {
            $this->lockUser($user);
            $user->cartItems()->delete();
        });
    }

    private function lockUser(User $user): void
    {
        User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
    }

    private function synchronizeCurrency(User $user, StoreLocale $locale): void
    {
        $user->cartItems()->with('product')->where('currency', '!=', $locale->currency())
            ->get()->each(function (CartItem $item) use ($locale): void {
                $item->update([
                    'currency' => $locale->currency(),
                    'unit_price' => $item->product->priceFor($locale),
                ]);
            });
    }
}
