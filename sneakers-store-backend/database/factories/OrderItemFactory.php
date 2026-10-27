<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<OrderItem> */
class OrderItemFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return ['order_id' => Order::factory(), 'product_id' => Product::factory(), 'product_name' => 'Sneakers', 'unit_price' => 10000, 'quantity' => 1];
    }
}
