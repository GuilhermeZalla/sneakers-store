<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Order> */
class OrderFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return ['user_id' => User::factory(), 'order_number' => (string) Str::ulid(), 'status' => 'pending', 'payment_method' => 'wallet', 'shipping_method' => 'blue', 'currency' => 'USD', 'locale' => 'en', 'shipping_price' => 1507, 'subtotal' => 10000, 'total' => 11507, 'ordered_at' => now(), 'shipping_name' => fake()->name(), 'shipping_postal_code' => '01234-567', 'shipping_street' => fake()->streetName(), 'shipping_number' => '12A', 'shipping_district' => 'Centro', 'shipping_city' => 'São Paulo', 'shipping_state' => 'SP'];
    }
}
