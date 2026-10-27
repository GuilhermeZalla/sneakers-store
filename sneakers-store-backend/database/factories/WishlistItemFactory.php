<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\User;
use App\Models\WishlistItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<WishlistItem> */
class WishlistItemFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return ['user_id' => User::factory(), 'product_id' => Product::factory()];
    }
}
