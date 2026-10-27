<?php

use App\Models\Product;
use Database\Seeders\ProductSeeder;

test('catalog returns descriptions in the requested language', function () {
    $product = Product::factory()->create(['description' => 'English description', 'description_pt_br' => 'Descricao em portugues']);

    $this->withHeader('Accept-Language', 'en-US')->getJson('/api/v1/products/'.$product->slug)
        ->assertOk()->assertJsonPath('data.description', 'English description');
    $this->withHeader('Accept-Language', 'pt-BR')->getJson('/api/v1/products/'.$product->slug)
        ->assertOk()->assertJsonPath('data.description', 'Descricao em portugues');
});

test('seeder fills missing translations without overwriting existing catalog edits', function () {
    $this->seed(ProductSeeder::class);
    $product = Product::where('legacy_id', 101)->firstOrFail();
    expect($product->description_pt_br)->not->toBeNull();
    $product->update(['price_brl' => 123, 'description_pt_br' => 'Texto editado']);
    $this->seed(ProductSeeder::class);
    expect($product->fresh()->price_brl)->toBe(123)->and($product->fresh()->description_pt_br)->toBe('Texto editado');
});
