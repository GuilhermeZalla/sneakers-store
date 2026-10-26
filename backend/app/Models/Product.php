<?php

namespace App\Models;

use App\StoreLocale;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['legacy_id', 'name', 'slug', 'description', 'brand', 'type', 'price_usd', 'price_brl', 'thumbnail', 'images', 'colors', 'sizes', 'rating'])]
class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['legacy_id' => 'integer', 'price_usd' => 'integer', 'price_brl' => 'integer', 'images' => 'array', 'colors' => 'array', 'sizes' => 'array', 'rating' => 'integer'];
    }

    /** @return HasMany<CartItem, $this> */
    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    /** @return HasMany<WishlistItem, $this> */
    public function wishlistItems(): HasMany
    {
        return $this->hasMany(WishlistItem::class);
    }

    /** @return HasMany<OrderItem, $this> */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function priceFor(StoreLocale $locale): int
    {
        return $locale === StoreLocale::Portuguese ? $this->price_brl : $this->price_usd;
    }
}
