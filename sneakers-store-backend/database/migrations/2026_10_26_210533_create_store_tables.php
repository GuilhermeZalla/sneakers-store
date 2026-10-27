<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('phone', 24)->nullable();
            $table->date('birthday')->nullable();
            $table->string('second_contact', 24)->nullable();
            $table->string('gender', 24)->nullable();
        });

        Schema::create('products', function (Blueprint $table): void {
            $table->id();
            $table->unsignedInteger('legacy_id')->nullable()->unique();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description');
            $table->string('brand', 80);
            $table->string('type', 32)->index();
            $table->unsignedInteger('price_usd');
            $table->unsignedInteger('price_brl');
            $table->string('thumbnail', 2048);
            $table->json('images');
            $table->json('colors');
            $table->json('sizes');
            $table->unsignedTinyInteger('rating');
            $table->timestamps();
            $table->index(['brand', 'type']);
        });

        Schema::create('cart_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('quantity');
            $table->unsignedInteger('unit_price');
            $table->string('currency', 3);
            $table->timestamps();
            $table->unique(['user_id', 'product_id']);
        });

        Schema::create('wishlist_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'product_id']);
        });

        Schema::create('addresses', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 16);
            $table->string('postal_code', 16);
            $table->string('street');
            $table->string('number', 32);
            $table->string('complement')->nullable();
            $table->string('reference')->nullable();
            $table->string('district');
            $table->string('city');
            $table->string('state', 2);
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            $table->index(['user_id', 'is_default']);
        });

        Schema::create('orders', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('order_number')->unique();
            $table->string('status', 32);
            $table->string('payment_method', 32);
            $table->string('shipping_method', 32);
            $table->string('currency', 3);
            $table->string('locale', 5);
            $table->unsignedInteger('shipping_price');
            $table->unsignedInteger('subtotal');
            $table->unsignedInteger('total');
            $table->timestamp('ordered_at');
            $table->string('shipping_name');
            $table->string('shipping_postal_code', 16);
            $table->string('shipping_street');
            $table->string('shipping_number', 32);
            $table->string('shipping_complement')->nullable();
            $table->string('shipping_reference')->nullable();
            $table->string('shipping_district');
            $table->string('shipping_city');
            $table->string('shipping_state', 2);
            $table->timestamps();
            $table->index(['user_id', 'ordered_at']);
        });

        Schema::create('order_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name');
            $table->unsignedInteger('unit_price');
            $table->unsignedInteger('quantity');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['order_items', 'orders', 'addresses', 'wishlist_items', 'cart_items', 'products'] as $table) {
            Schema::dropIfExists($table);
        }

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['phone', 'birthday', 'second_contact', 'gender']);
        });
    }
};
