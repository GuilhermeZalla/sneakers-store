<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductReview;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ProductReview> */
class ProductReviewFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return ['product_id' => Product::factory(), 'user_id' => User::factory(), 'rating' => fake()->numberBetween(1, 5), 'comment' => fake()->sentence()];
    }
}
