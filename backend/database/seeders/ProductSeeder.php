<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        /** @var array{products: list<array{id: string, shoeName: string, description: string, brand: string, type: string, price: string, thumbnail: string, image_url: string|list<string>, color: list<string>, size?: list<string>, rank: int}>} $catalog */
        $catalog = json_decode(File::get(database_path('seeders/data/products.json')), true, flags: JSON_THROW_ON_ERROR);

        /** @var array<int, string> $translations */
        $translations = json_decode(File::get(database_path('seeders/data/descriptions.pt_BR.json')), true, flags: JSON_THROW_ON_ERROR);

        foreach ($catalog['products'] as $product) {
            $priceUsd = (int) $product['price'] * 100;

            Product::firstOrCreate(['legacy_id' => (int) $product['id']], [
                'name' => $product['shoeName'],
                'slug' => Str::slug($product['shoeName']).'-'.$product['id'],
                'description' => $product['description'],
                'description_pt_br' => $translations[(int) $product['id']],
                'brand' => $product['brand'],
                'type' => $product['type'],
                'price_usd' => $priceUsd,
                'price_brl' => $priceUsd * 5,
                'thumbnail' => $product['thumbnail'],
                'images' => Arr::wrap($product['image_url']),
                'colors' => array_values(array_unique($product['color'])),
                'sizes' => array_values(array_unique($product['size'] ?? [])),
                'rating' => $product['rank'],
            ]);

            Product::query()->where('legacy_id', (int) $product['id'])->whereNull('description_pt_br')
                ->update(['description_pt_br' => $translations[(int) $product['id']]]);
        }
    }
}
