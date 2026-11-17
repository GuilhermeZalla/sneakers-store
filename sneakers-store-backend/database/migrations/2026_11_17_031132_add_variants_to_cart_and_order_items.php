<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cart_items', function (Blueprint $table): void {
            $table->string('size', 32)->default('');
            $table->string('color', 64)->default('');
            $table->unique(['user_id', 'product_id', 'size', 'color'], 'cart_items_variant_unique');
            $table->dropUnique(['user_id', 'product_id']);
        });
        Schema::table('order_items', function (Blueprint $table): void {
            $table->string('size', 32)->default('');
            $table->string('color', 64)->default('');
        });
    }

    public function down(): void
    {
        if (DB::table('cart_items')->select('user_id', 'product_id')->groupBy('user_id', 'product_id')->havingRaw('COUNT(*) > 1')->exists()) {
            throw new RuntimeException('Cannot roll back variants while multiple variants of a product are in a cart.');
        }
        Schema::table('cart_items', function (Blueprint $table): void {
            $table->unique(['user_id', 'product_id']);
            $table->dropUnique('cart_items_variant_unique');
            $table->dropColumn(['size', 'color']);
        });
        Schema::table('order_items', function (Blueprint $table): void {
            $table->dropColumn(['size', 'color']);
        });
    }
};
