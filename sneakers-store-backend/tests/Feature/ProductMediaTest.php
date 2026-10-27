<?php

use App\Models\CartItem;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\WishlistItem;
use Database\Seeders\ProductSeeder;
use Illuminate\Support\Facades\File;

test('every seeded catalog photo exists locally as a WebP file', function () {
    $this->seed(ProductSeeder::class);

    expect(Product::count())->toBe(30);

    foreach (Product::all() as $product) {
        foreach ([$product->thumbnail, ...$product->images] as $image) {
            expect($image)->toStartWith('/products/')->toEndWith('.webp');
            $path = base_path('../sneakers-store-frontend/public'.$image);
            expect(is_file($path))->toBeTrue();
            expect(substr(file_get_contents($path), 8, 4))->toBe('WEBP');
        }
    }
});

test('refreshing apparel preserves product identity prices commerce links and order snapshots', function () {
    $product = Product::factory()->create([
        'legacy_id' => 51,
        'slug' => 'existing-product-link',
        'price_usd' => 7654,
        'price_brl' => 43210,
        'sizes' => ['S', 'XL'],
        'thumbnail' => 'https://cdn.shopify.com/old.jpg',
    ]);
    $other = Product::factory()->create(['legacy_id' => 101]);
    $unchanged = $other->fresh()->getAttributes();
    $cart = CartItem::factory()->create(['product_id' => $product->id]);
    $favorite = WishlistItem::factory()->create(['product_id' => $product->id]);
    $orderItem = OrderItem::factory()->create(['product_id' => $product->id, 'product_name' => 'Historic product', 'unit_price' => 9999]);
    $snapshot = $orderItem->fresh()->getAttributes();

    $this->artisan('catalog:refresh-apparel')->assertSuccessful();
    $firstUpdate = $product->fresh()->getAttributes();
    $this->artisan('catalog:refresh-apparel')->assertSuccessful();

    expect($product->fresh()->getAttributes())->toBe($firstUpdate)
        ->and($product->fresh()->name)->toBe('Lume Beanie Orange')
        ->and($product->fresh()->thumbnail)->toBe('/products/lume-beanie-orange-400.webp')
        ->and($product->fresh()->slug)->toBe('existing-product-link')
        ->and($product->fresh()->price_usd)->toBe(7654)
        ->and($product->fresh()->price_brl)->toBe(43210)
        ->and($product->fresh()->sizes)->toBe(['S', 'XL'])
        ->and($cart->fresh()->product_id)->toBe($product->id)
        ->and($favorite->fresh()->product_id)->toBe($product->id)
        ->and($orderItem->fresh()->getAttributes())->toBe($snapshot)
        ->and($other->fresh()->getAttributes())->toBe($unchanged)
        ->and(Product::count())->toBe(2);

    $this->getJson('/api/v1/products/existing-product-link')->assertOk()->assertJsonPath('data.thumbnail', '/products/lume-beanie-orange-400.webp');
});

test('refreshing apparel is blocked in production', function () {
    $product = Product::factory()->create(['legacy_id' => 51]);
    $before = $product->fresh()->getAttributes();
    app()->detectEnvironment(fn () => 'production');

    $this->artisan('catalog:refresh-apparel')->assertFailed();

    expect($product->fresh()->getAttributes())->toBe($before);
});

test('refreshing apparel rolls back earlier updates if a required image is missing', function () {
    $product = Product::factory()->create(['legacy_id' => 51]);
    $before = $product->fresh()->getAttributes();
    File::partialMock()
        ->shouldReceive('isFile')->andReturn(true, true, false);

    expect(fn () => $this->artisan('catalog:refresh-apparel')->run())
        ->toThrow(RuntimeException::class, 'Missing local catalog image');

    expect($product->fresh()->getAttributes())->toBe($before);
});
