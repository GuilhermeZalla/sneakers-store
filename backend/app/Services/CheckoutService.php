<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use App\StoreLocale;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    /** @return array<string, array{price: int, days: int}> */
    public function shippingMethods(StoreLocale $locale): array
    {
        $prices = $locale === StoreLocale::Portuguese
            ? ['blue' => 7535, 'sedex' => 4450, 'fedex' => 11010, 'red' => 2350]
            : ['blue' => 1507, 'sedex' => 890, 'fedex' => 2202, 'red' => 470];

        return [
            'blue' => ['price' => $prices['blue'], 'days' => 4],
            'sedex' => ['price' => $prices['sedex'], 'days' => 8],
            'fedex' => ['price' => $prices['fedex'], 'days' => 5],
            'red' => ['price' => $prices['red'], 'days' => 3],
        ];
    }

    /** @param array{idempotency_key: string, address_id: int|string, shipping_method: string, payment_method: string} $data */
    public function checkout(User $user, array $data, StoreLocale $locale): Order
    {
        return DB::transaction(function () use ($user, $data, $locale): Order {
            User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();

            $hash = hash('sha256', implode('|', [(string) $data['address_id'], $data['shipping_method'], $data['payment_method'], $locale->value]));
            $previous = $user->orders()->where('idempotency_key', $data['idempotency_key'])->first();

            if ($previous !== null) {
                if (! hash_equals((string) $previous->request_hash, $hash)) {
                    abort(409, __('This idempotency key was already used for a different checkout.'));
                }

                return $previous->load('items');
            }

            $address = $user->addresses()->whereKey($data['address_id'])->first();

            if ($address === null) {
                throw ValidationException::withMessages(['address_id' => __('The selected address is invalid.')]);
            }

            $items = $user->cartItems()->with('product')->orderBy('id')->get();

            if ($items->isEmpty()) {
                throw ValidationException::withMessages(['cart' => __('Your cart is empty.')]);
            }

            $subtotal = 0;
            foreach ($items as $item) {
                if ($item->currency !== $locale->currency()) {
                    $item->update(['currency' => $locale->currency(), 'unit_price' => $item->product->priceFor($locale)]);
                }
                $subtotal += $item->unit_price * $item->quantity;
            }

            $shipping = $this->shippingMethods($locale)[$data['shipping_method']]['price'];
            $order = $user->orders()->create([
                'order_number' => (string) Str::ulid(),
                'idempotency_key' => $data['idempotency_key'],
                'request_hash' => $hash,
                'status' => 'pending',
                'payment_method' => $data['payment_method'],
                'shipping_method' => $data['shipping_method'],
                'currency' => $locale->currency(),
                'locale' => $locale->value,
                'shipping_price' => $shipping,
                'subtotal' => $subtotal,
                'total' => $subtotal + $shipping,
                'ordered_at' => now(),
                'shipping_name' => $user->name,
                'shipping_postal_code' => $address->postal_code,
                'shipping_street' => $address->street,
                'shipping_number' => $address->number,
                'shipping_complement' => $address->complement,
                'shipping_reference' => $address->reference,
                'shipping_district' => $address->district,
                'shipping_city' => $address->city,
                'shipping_state' => $address->state,
            ]);

            foreach ($items as $item) {
                $order->items()->create([
                    'product_id' => $item->product_id,
                    'product_name' => $item->product->name,
                    'unit_price' => $item->unit_price,
                    'quantity' => $item->quantity,
                ]);
            }

            $user->cartItems()->delete();

            return $order->load('items');
        }, 3);
    }
}
