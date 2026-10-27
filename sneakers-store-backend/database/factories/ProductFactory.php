<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Product> */
class ProductFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return ['name' => fake()->unique()->words(3, true), 'slug' => (string) Str::uuid(), 'description' => fake()->paragraph(), 'brand' => 'nike', 'type' => 'sneaker', 'price_usd' => 10000, 'price_brl' => 50000, 'thumbnail' => 'https://example.com/shoe.jpg', 'images' => ['https://example.com/shoe.jpg'], 'colors' => ['black'], 'sizes' => ['40', '42'], 'rating' => 4];
    }
}
