<?php

use App\Models\Address;
use App\Models\CartItem;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Models\WishlistItem;
use App\StoreLocale;
use App\Support\Money;
use Database\Seeders\ProductSeeder;
use Illuminate\Database\QueryException;

test('the catalog preserves all products and seeds independent fixed prices', function () {
    $this->seed(ProductSeeder::class);

    $this->assertDatabaseCount('products', 63);
    expect(Product::where('type', 'sneaker')->count())->toBe(50)
        ->and(Product::where('type', 'shirt')->count())->toBe(7)
        ->and(Product::where('type', 'cap')->count())->toBe(4)
        ->and(Product::where('type', 'gift')->count())->toBe(2);

    $product = Product::where('legacy_id', 1)->firstOrFail();
    expect($product->price_brl)->toBe($product->price_usd * 5)
        ->and($product->images)->toBeArray()->and($product->sizes)->toBeArray();

    $originalUsd = $product->price_usd;
    $product->update(['price_brl' => 12345]);
    $this->seed(ProductSeeder::class);

    $this->assertDatabaseCount('products', 63);
    expect($product->fresh()->priceFor(StoreLocale::Portuguese))->toBe(12345)
        ->and($product->fresh()->priceFor(StoreLocale::English))->toBe($originalUsd);
});

test('address and profile identifiers preserve leading zeros and non numeric characters', function () {
    $address = Address::factory()->create(['postal_code' => '01234-567', 'number' => '12A']);

    expect($address->fresh()->postal_code)->toBe('01234-567')
        ->and($address->fresh()->number)->toBe('12A')
        ->and($address->user->phone)->toBe('+5511999999999');
});

test('wishlist and cart only allow one row per user and product', function (string $model) {
    $item = $model::factory()->create();

    $model::factory()->create(['user_id' => $item->user_id, 'product_id' => $item->product_id]);
})->with([CartItem::class, WishlistItem::class])->throws(QueryException::class);

test('order factories preserve structured snapshots and cents', function () {
    $item = OrderItem::factory()->create();

    expect($item->order->total)->toBe(11507)
        ->and($item->order->currency)->toBe('USD')
        ->and($item->order->shipping_postal_code)->toBe('01234-567')
        ->and($item->order->items)->toHaveCount(1);
});

test('language selects the matching currency and profile metadata', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->withHeader('Accept-Language', 'pt-BR')->getJson('/api/v1/user')
        ->assertOk()->assertHeader('Content-Language', 'pt-BR')
        ->assertHeader('X-Store-Currency', 'BRL')
        ->assertJsonPath('meta.locale', 'pt_BR')->assertJsonPath('meta.currency', 'BRL');

    $this->withHeader('Accept-Language', 'en-US')->getJson('/api/v1/user')
        ->assertOk()->assertJsonPath('meta.currency', 'USD');
});

test('money formatting preserves cents in both languages', function () {
    expect(Money::format(123456, 'USD', StoreLocale::English))->toContain('1,234.56')
        ->and(Money::format(123456, 'BRL', StoreLocale::Portuguese))->toContain('1.234,56')
        ->and(Money::format(123456, 'BRL', StoreLocale::Portuguese))->toContain('R$');
});

test('registration validation messages follow the selected language', function () {
    $this->withHeader('Accept-Language', 'pt-BR')->postJson(route('register.store'), [])
        ->assertUnprocessable()->assertJsonPath('errors.name.0', "O campo nome \u{00E9} obrigat\u{00F3}rio.");
});

test('credentialed cors allows only the configured frontend', function () {
    $this->withHeader('Origin', 'http://localhost:5173')->getJson('/sanctum/csrf-cookie')
        ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
        ->assertHeader('Access-Control-Allow-Credentials', 'true');

    $response = $this->withHeader('Origin', 'https://untrusted.example')->getJson('/sanctum/csrf-cookie');

    expect($response->headers->get('Access-Control-Allow-Origin'))->not->toBe('https://untrusted.example');
});
