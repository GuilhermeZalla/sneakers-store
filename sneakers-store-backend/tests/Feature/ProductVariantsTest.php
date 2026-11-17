<?php

use App\Models\Address;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Notifications\StoreNotification;

test('cart merges the same variant but keeps other sizes and colors separate through checkout', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create(['sizes' => ['40', '42'], 'colors' => ['black', 'white'], 'price_usd' => 1200]);
    $address = Address::factory()->create(['user_id' => $user->id]);
    $this->actingAs($user);
    foreach ([['40', 'black'], ['40', 'black'], ['42', 'black'], ['42', 'white']] as [$size, $color]) {
        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 1, 'size' => $size, 'color' => $color])->assertSuccessful()->assertJsonPath('data.size', $size)->assertJsonPath('data.color', $color);
    }
    $this->getJson('/api/v1/cart')->assertJsonCount(3, 'data')->assertJsonPath('data.0.quantity', 2)->assertJsonPath('meta.subtotal', 4800);
    $response = $this->withHeader('Idempotency-Key', 'variant-checkout-unique-123')->postJson('/api/v1/checkout', ['address_id' => $address->id, 'shipping_method' => 'blue', 'payment_method' => 'wallet'])->assertCreated()->assertJsonCount(3, 'data.items')->assertJsonPath('data.items.0.size', '40')->assertJsonPath('data.items.2.color', 'white');
    $order = Order::query()->findOrFail($response->json('data.id'));
    (new StoreNotification('order_confirmed', $order))->toMail($user)->assertSeeInHtml('Size: 40')->assertSeeInText('Color: white');
    $user->update(['locale' => 'pt_BR']);
    (new StoreNotification('order_confirmed', $order))->toMail($user)->assertSeeInHtml('Tamanho: 40')->assertSeeInText('Cor: branco');
    $product->update(['sizes' => ['44'], 'colors' => ['red']]);
    $this->getJson('/api/v1/orders/'.$response->json('data.id'))->assertJsonPath('data.items.0.size', '40')->assertJsonPath('data.items.2.color', 'white');
});

test('cart rejects options outside the selected product', function (array $options, string $field) {
    $product = Product::factory()->create();
    $this->actingAs(User::factory()->create())->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 1] + $options)->assertUnprocessable()->assertJsonValidationErrors($field);
    $this->assertDatabaseCount('cart_items', 0);
})->with([[['size' => '99'], 'size'], [['color' => 'pink'], 'color'], [['size' => ['40']], 'size']]);
