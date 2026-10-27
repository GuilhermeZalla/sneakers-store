<?php

use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;

test('cart endpoints require authentication', function () {
    $this->getJson('/api/v1/cart')->assertUnauthorized();
    $this->postJson('/api/v1/cart/items', [])->assertUnauthorized();
    $this->deleteJson('/api/v1/cart')->assertUnauthorized();
});

test('cart derives prices and ownership from the server and increments quantities', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $product = Product::factory()->create(['price_usd' => 1200, 'price_brl' => 6200]);

    $this->actingAs($user)->postJson('/api/v1/cart/items', [
        'product_id' => $product->id, 'quantity' => 2,
        'unit_price' => 1, 'currency' => 'BRL', 'user_id' => $other->id,
    ])->assertCreated()->assertJsonPath('data.unit_price', 1200)
        ->assertJsonPath('data.quantity', 2)->assertJsonPath('data.currency', 'USD');

    $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 3])
        ->assertOk()->assertJsonPath('data.quantity', 5)->assertJsonPath('data.unit_price', 1200);
    $this->getJson('/api/v1/cart')->assertOk()->assertJsonCount(1, 'data')
        ->assertJsonPath('meta.subtotal', 6000)->assertJsonPath('meta.currency', 'USD');

    $this->assertDatabaseHas('cart_items', ['user_id' => $user->id, 'product_id' => $product->id]);
    $this->assertDatabaseMissing('cart_items', ['user_id' => $other->id, 'product_id' => $product->id]);
});

test('cart preserves snapshot price until the language and currency change', function () {
    $user = User::factory()->create();
    $first = Product::factory()->create(['price_usd' => 1000, 'price_brl' => 5100]);
    $second = Product::factory()->create(['price_usd' => 2000, 'price_brl' => 9900]);

    $this->actingAs($user)->postJson('/api/v1/cart/items', ['product_id' => $first->id, 'quantity' => 2])->assertCreated();
    $this->postJson('/api/v1/cart/items', ['product_id' => $second->id, 'quantity' => 1])->assertCreated();
    $first->update(['price_usd' => 1500, 'price_brl' => 5500]);

    $this->getJson('/api/v1/cart')->assertJsonPath('meta.subtotal', 4000)
        ->assertJsonPath('data.0.unit_price', 1000);
    $this->withHeader('Accept-Language', 'pt-BR')->getJson('/api/v1/cart')
        ->assertJsonPath('meta.currency', 'BRL')->assertJsonPath('meta.subtotal', 20900)
        ->assertJsonPath('data.0.unit_price', 5500)->assertJsonPath('data.1.currency', 'BRL');

    expect($user->cartItems()->where('currency', 'USD')->count())->toBe(0);
});

test('cart quantities can be changed and items removed or cleared', function () {
    $user = User::factory()->create();
    $item = CartItem::factory()->create(['user_id' => $user->id, 'quantity' => 1]);
    $otherItem = CartItem::factory()->create();

    $this->actingAs($user)->patchJson('/api/v1/cart/items/'.$item->id, ['quantity' => 4])
        ->assertOk()->assertJsonPath('data.quantity', 4)->assertJsonPath('data.subtotal', 40000);
    $this->deleteJson('/api/v1/cart/items/'.$item->id)->assertNoContent();
    $this->assertDatabaseMissing('cart_items', ['id' => $item->id]);

    CartItem::factory()->create(['user_id' => $user->id]);
    $this->deleteJson('/api/v1/cart')->assertNoContent();
    $this->assertDatabaseCount('cart_items', 1);
    $this->assertDatabaseHas('cart_items', ['id' => $otherItem->id]);
});

test('users cannot change or remove another user cart item', function () {
    $user = User::factory()->create();
    $item = CartItem::factory()->create();

    $this->actingAs($user)->patchJson('/api/v1/cart/items/'.$item->id, ['quantity' => 8])->assertForbidden();
    $this->deleteJson('/api/v1/cart/items/'.$item->id)->assertForbidden();
    expect($item->fresh()->quantity)->toBe(1);
});

test('cart rejects missing products and invalid quantities', function () {
    $this->actingAs(User::factory()->create());
    $product = Product::factory()->create();

    $this->postJson('/api/v1/cart/items', ['product_id' => 999999, 'quantity' => 1])
        ->assertUnprocessable()->assertJsonValidationErrors('product_id');
    foreach ([0, -1, 1000, 1.5] as $quantity) {
        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => $quantity])
            ->assertUnprocessable()->assertJsonValidationErrors('quantity');
    }

    $this->assertDatabaseCount('cart_items', 0);
});

test('exceeding quantity limit rolls back currency synchronization', function () {
    $user = User::factory()->create();
    $item = CartItem::factory()->create(['user_id' => $user->id, 'quantity' => 999]);

    $this->actingAs($user)->withHeader('Accept-Language', 'pt-BR')->postJson('/api/v1/cart/items', [
        'product_id' => $item->product_id, 'quantity' => 1,
    ])->assertUnprocessable()->assertJsonValidationErrors('quantity');

    expect($item->fresh()->currency)->toBe('USD')->and($item->fresh()->quantity)->toBe(999);
});
