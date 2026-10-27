<?php

namespace App\Http\Resources;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Order */
class OrderResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status,
            'payment_method' => $this->payment_method,
            'shipping_method' => $this->shipping_method,
            'currency' => $this->currency,
            'locale' => $this->locale,
            'shipping_price' => $this->shipping_price,
            'subtotal' => $this->subtotal,
            'total' => $this->total,
            'ordered_at' => $this->ordered_at,
            'shipping_address' => [
                'name' => $this->shipping_name,
                'postal_code' => $this->shipping_postal_code,
                'street' => $this->shipping_street,
                'number' => $this->shipping_number,
                'complement' => $this->shipping_complement,
                'reference' => $this->shipping_reference,
                'district' => $this->shipping_district,
                'city' => $this->shipping_city,
                'state' => $this->shipping_state,
            ],
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'product_id' => $item->product_id,
                'product_name' => $item->product_name,
                'unit_price' => $item->unit_price,
                'quantity' => $item->quantity,
            ])),
        ];
    }
}
