<?php

use App\Models\Product;

test('catalog is public and filters products by brand, category and search', function () {
    Product::factory()->create(['name' => 'Red Sneaker', 'brand' => 'nike', 'type' => 'sneaker']);
    Product::factory()->create(['name' => 'Blue Sneaker', 'brand' => 'puma', 'type' => 'sneaker']);
    Product::factory()->create(['name' => 'Red Shirt', 'brand' => 'nike', 'type' => 'shirt']);

    $this->getJson('/api/v1/products?brand=nike&type=sneaker&search=Red')
        ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Red Sneaker')
        ->assertJsonPath('data.0.currency', 'USD');
});

test('prices, price filters and sorting follow the selected currency', function () {
    $first = Product::factory()->create(['price_usd' => 3000, 'price_brl' => 9000]);
    $second = Product::factory()->create(['price_usd' => 2000, 'price_brl' => 10000]);

    $this->withHeader('Accept-Language', 'en-US')->getJson('/api/v1/products?sort=price')
        ->assertOk()->assertJsonPath('data.0.id', $second->id)->assertJsonPath('data.0.price', 2000);

    $this->withHeader('Accept-Language', 'pt-BR')->getJson('/api/v1/products?sort=price&max_price=9500')
        ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $first->id)
        ->assertJsonPath('data.0.price', 9000)->assertJsonPath('data.0.currency', 'BRL');
});

test('catalog paginates and shows a product by slug', function () {
    $product = Product::factory()->create(['rating' => 5, 'sizes' => ['38', '40']]);
    Product::factory()->count(2)->create();

    $this->getJson('/api/v1/products?per_page=2')->assertOk()
        ->assertJsonCount(2, 'data')->assertJsonPath('meta.total', 3);
    $this->getJson('/api/v1/products/'.$product->slug)->assertOk()
        ->assertJsonPath('data.id', $product->id)->assertJsonPath('data.rating', 5)
        ->assertJsonPath('data.sizes.0', '38');
    $this->getJson('/api/v1/products/missing')->assertNotFound();
});

test('catalog rejects invalid filters and sort values', function (array $query, string $field) {
    $this->getJson('/api/v1/products?'.http_build_query($query))
        ->assertUnprocessable()->assertJsonValidationErrors($field);
})->with([
    [['sort' => 'price;drop'], 'sort'],
    [['sort' => ['price']], 'sort'],
    [['type' => ['shirt']], 'type'],
    [['per_page' => 101], 'per_page'],
    [['min_price' => 500, 'max_price' => 100], 'max_price'],
]);

test('price range validation is translated in Brazilian Portuguese', function () {
    $this->withHeader('Accept-Language', 'pt-BR')
        ->getJson('/api/v1/products?min_price=500&max_price=100')
        ->assertUnprocessable()
        ->assertJsonPath('errors.max_price.0', "O campo pre\u{00E7}o m\u{00E1}ximo deve ser maior ou igual a 500.");
});
