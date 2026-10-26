<?php

namespace App\Models;

use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'order_number', 'status', 'payment_method', 'shipping_method', 'currency', 'locale', 'shipping_price', 'subtotal', 'total', 'ordered_at', 'shipping_name', 'shipping_postal_code', 'shipping_street', 'shipping_number', 'shipping_complement', 'shipping_reference', 'shipping_district', 'shipping_city', 'shipping_state'])]
class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['shipping_price' => 'integer', 'subtotal' => 'integer', 'total' => 'integer', 'ordered_at' => 'immutable_datetime'];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<OrderItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
