<?php

namespace App\Console\Commands;

use App\Models\Product;
use Database\Seeders\ProductSeeder;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

#[Signature('catalog:replace-footwear')]
#[Description('Replace the original footwear catalog in a local database')]
class ReplaceFootwearCatalog extends Command
{
    public function handle(): int
    {
        $connection = DB::connection();
        $host = $connection->getConfig('host');

        if (! app()->environment(['local', 'testing']) || ($connection->getDriverName() !== 'sqlite' && ! in_array($host, ['localhost', '127.0.0.1', '::1'], true))) {
            $this->error('This command only runs against a local development database.');

            return self::FAILURE;
        }

        DB::transaction(function (): void {
            Product::query()->where('type', 'sneaker')->whereBetween('legacy_id', [1, 50])->delete();
            app(ProductSeeder::class)->run();
        });

        $this->info('Footwear catalog replaced. Cart and wishlist entries for removed products were deleted.');

        return self::SUCCESS;
    }
}
