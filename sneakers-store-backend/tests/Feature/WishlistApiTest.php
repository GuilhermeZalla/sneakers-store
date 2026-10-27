<?php

use App\Models\Product;
use App\Models\User;
use App\Models\WishlistItem;

test('wishlist requires authentication', function () {
    $this->getJson('/api/v1/wishlist')->assertUnauthorized();
    $this->postJson('/api/v1/wishlist', [])->assertUnauthorized();
});

test('wishlist stores products once and responds with localized product data', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create(['price_usd' => 1234, 'price_brl' => 6789]);

    $this->actingAs($user)->postJson('/api/v1/wishlist', ['product_id' => $product->id])
        ->assertCreated()->assertJsonPath('data.product.rating', 4);
    $this->postJson('/api/v1/wishlist', ['product_id' => $product->id])->assertOk();

    $this->withHeader('Accept-Language', 'pt-BR')->getJson('/api/v1/wishlist')
        ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.product.price', 6789)
        ->assertJsonPath('data.0.product.currency', 'BRL');
    $this->assertDatabaseCount('wishlist_items', 1);
});

test('wishlist rejects nonexistent products', function () {
    $this->actingAs(User::factory()->create())->postJson('/api/v1/wishlist', ['product_id' => 999999])
        ->assertUnprocessable()->assertJsonValidationErrors('product_id');
});

test('wishlist is isolated and removal only affects the selected item', function () {
    $user = User::factory()->create();
    $one = WishlistItem::factory()->create(['user_id' => $user->id]);
    $two = WishlistItem::factory()->create(['user_id' => $user->id]);
    $other = WishlistItem::factory()->create();

    $this->actingAs($user)->getJson('/api/v1/wishlist')->assertJsonCount(2, 'data');
    $this->deleteJson('/api/v1/wishlist/'.$other->id)->assertForbidden();
    $this->deleteJson('/api/v1/wishlist/'.$two->id)->assertNoContent();
    $this->assertDatabaseHas('wishlist_items', ['id' => $one->id]);
    $this->assertDatabaseHas('wishlist_items', ['id' => $other->id]);
    $this->assertDatabaseMissing('wishlist_items', ['id' => $two->id]);
});
