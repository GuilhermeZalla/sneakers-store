<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

#[Signature('catalog:refresh-apparel')]
#[Description('Update local demo apparel photos and descriptions without changing prices or product links')]
class RefreshApparelCatalog extends Command
{
    public function handle(): int
    {
        $connection = DB::connection();
        $host = $connection->getConfig('host');

        if (! app()->environment(['local', 'testing']) || ($connection->getDriverName() !== 'sqlite' && ! in_array($host, ['localhost', '127.0.0.1', '::1'], true))) {
            $this->error('This command only runs against a local development database.');

            return self::FAILURE;
        }

        /** @var array{products: list<array{id: string, shoeName: string, description: string, brand: string, thumbnail: string, image_url: string, color: list<string>}>} $catalog */
        $catalog = json_decode(File::get(database_path('seeders/data/products.json')), true, flags: JSON_THROW_ON_ERROR);
        /** @var array<int, string> $translations */
        $translations = json_decode(File::get(database_path('seeders/data/descriptions.pt_BR.json')), true, flags: JSON_THROW_ON_ERROR);

        $updated = DB::transaction(function () use ($catalog, $translations): int {
            $updated = 0;

            foreach ($catalog['products'] as $item) {
                $legacyId = (int) $item['id'];

                if ($legacyId < 51 || $legacyId > 63) {
                    continue;
                }

                foreach ([$item['thumbnail'], $item['image_url']] as $image) {
                    if (! str_starts_with($image, '/products/') || ! File::isFile(base_path('../sneakers-store-frontend/public'.$image))) {
                        throw new \RuntimeException('Missing local catalog image: '.$image);
                    }
                }

                $product = Product::query()->where('legacy_id', $legacyId)->lockForUpdate()->first();

                if ($product === null) {
                    continue;
                }

                $product->fill([
                    'name' => $item['shoeName'],
                    'description' => $item['description'],
                    'description_pt_br' => $translations[$legacyId],
                    'brand' => $item['brand'],
                    'thumbnail' => $item['thumbnail'],
                    'images' => [$item['image_url']],
                    'colors' => $item['color'],
                ])->save();

                $updated++;
            }

            return $updated;
        });

        $this->info("Updated {$updated} apparel products. IDs, URLs, prices, sizes and order snapshots preserved.");

        return self::SUCCESS;
    }
}
