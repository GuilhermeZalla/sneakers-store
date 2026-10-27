<?php

use App\Models\Address;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;

function checkoutPayload(Address $address): array
{
    return ['address_id' => $address->id, 'shipping_method' => 'blue', 'payment_method' => 'wallet'];
}

function checkoutCart(User $user): CartItem
{
    $product = Product::factory()->create(['price_usd' => 12000, 'price_brl' => 60000]);

    return CartItem::factory()->create(['user_id' => $user->id, 'product_id' => $product->id, 'unit_price' => 10000, 'quantity' => 2, 'currency' => 'USD']);
}

test('checkout rejects an empty cart and another user address', function () {
    $user = User::factory()->create();
    $address = Address::factory()->create(['user_id' => $user->id]);
    $other = Address::factory()->create();
    $this->actingAs($user)->withHeader('Idempotency-Key', 'first-key-12345678')
        ->postJson('/api/v1/checkout', checkoutPayload($address))->assertUnprocessable()->assertJsonValidationErrors('cart');
    checkoutCart($user);
    $this->postJson('/api/v1/checkout', checkoutPayload($other))->assertUnprocessable()->assertJsonValidationErrors('address_id');
    $this->assertDatabaseCount('orders', 0);
});

test('checkout uses server snapshots and wallet charges the complete total', function () {
    $user = User::factory()->create();
    $address = Address::factory()->create(['user_id' => $user->id]);
    $item = checkoutCart($user);
    $originalStreet = $address->street;
    $response = $this->actingAs($user)->withHeader('Idempotency-Key', 'checkout-key-123456')
        ->postJson('/api/v1/checkout', [...checkoutPayload($address), 'total' => 1, 'subtotal' => 1, 'shipping_price' => 1, 'unit_price' => 1])
        ->assertCreated()->assertJsonPath('data.subtotal', 20000)->assertJsonPath('data.shipping_price', 1507)
        ->assertJsonPath('data.total', 21507)->assertJsonPath('data.payment_method', 'wallet')
        ->assertJsonPath('data.items.0.unit_price', 10000)->assertJsonPath('data.shipping_address.street', $address->street);
    $address->update(['street' => 'Changed']);
    $item->product->update(['name' => 'Changed', 'price_usd' => 1]);
    $this->getJson('/api/v1/orders/'.$response->json('data.id'))->assertOk()
        ->assertJsonPath('data.shipping_address.street', $originalStreet)
        ->assertJsonPath('data.items.0.unit_price', 10000);
    $this->assertDatabaseCount('cart_items', 0);
});

test('checkout reprices all items when currency changes and snapshots BRL', function () {
    $user = User::factory()->create();
    $address = Address::factory()->create(['user_id' => $user->id]);
    checkoutCart($user);
    $this->actingAs($user)->withHeaders(['Idempotency-Key' => 'currency-key-123456', 'Accept-Language' => 'pt-BR'])
        ->postJson('/api/v1/checkout', checkoutPayload($address))->assertCreated()
        ->assertJsonPath('data.currency', 'BRL')->assertJsonPath('data.items.0.unit_price', 60000)
        ->assertJsonPath('data.subtotal', 120000)->assertJsonPath('data.shipping_price', 7535)->assertJsonPath('data.total', 127535);
});

test('retries return the same order and a reused key with different parameters conflicts', function () {
    $user = User::factory()->create();
    $address = Address::factory()->create(['user_id' => $user->id]);
    checkoutCart($user);
    $this->actingAs($user)->withHeader('Idempotency-Key', 'repeat-key-12345678');
    $first = $this->postJson('/api/v1/checkout', checkoutPayload($address))->assertCreated();
    $second = $this->postJson('/api/v1/checkout', checkoutPayload($address))->assertOk();
    expect($second->json('data.id'))->toBe($first->json('data.id'));
    $this->postJson('/api/v1/checkout', [...checkoutPayload($address), 'shipping_method' => 'red'])->assertStatus(409);
    $this->assertDatabaseCount('orders', 1);
    $this->assertDatabaseCount('order_items', 1);
});

test('failure while creating order items rolls back the entire checkout', function () {
    $user = User::factory()->create();
    $address = Address::factory()->create(['user_id' => $user->id]);
    checkoutCart($user);
    OrderItem::creating(fn () => throw new RuntimeException('Simulated failure'));
    try {
        $this->actingAs($user)->withHeaders(['Idempotency-Key' => 'rollback-key-123456', 'Accept-Language' => 'pt-BR'])
            ->postJson('/api/v1/checkout', checkoutPayload($address))->assertStatus(500);
        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('order_items', 0);
        $this->assertDatabaseHas('cart_items', ['user_id' => $user->id, 'currency' => 'USD', 'unit_price' => 10000]);
    } finally {
        OrderItem::flushEventListeners();
    }
});

test('order history and details are isolated by account', function () {
    $user = User::factory()->create();
    $own = Order::factory()->create(['user_id' => $user->id]);
    $other = Order::factory()->create();
    $this->getJson('/api/v1/orders')->assertUnauthorized();
    $this->actingAs($user)->getJson('/api/v1/orders')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $own->id);
    $this->getJson('/api/v1/orders/'.$other->id)->assertForbidden();
});
