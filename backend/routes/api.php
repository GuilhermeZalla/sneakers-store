<?php

use App\Http\Controllers\AddressController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\WishlistController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    require __DIR__.'/settings.php';

    Route::get('products', [ProductController::class, 'index'])->name('products.index');
    Route::get('products/{product:slug}', [ProductController::class, 'show'])->name('products.show');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('shipping-methods', [CheckoutController::class, 'shipping']);
        Route::post('checkout', [CheckoutController::class, 'store']);
        Route::get('orders', [OrderController::class, 'index']);
        Route::get('orders/{order}', [OrderController::class, 'show']);
        Route::get('cart', [CartController::class, 'index'])->name('cart.index');
        Route::post('cart/items', [CartController::class, 'store'])->name('cart.store');
        Route::patch('cart/items/{cartItem}', [CartController::class, 'update'])->name('cart.update');
        Route::delete('cart/items/{cartItem}', [CartController::class, 'destroy'])->name('cart.destroy');
        Route::delete('cart', [CartController::class, 'clear'])->name('cart.clear');

        Route::get('wishlist', [WishlistController::class, 'index'])->name('wishlist.index');
        Route::post('wishlist', [WishlistController::class, 'store'])->name('wishlist.store');
        Route::delete('wishlist/{wishlistItem}', [WishlistController::class, 'destroy'])->name('wishlist.destroy');

        Route::apiResource('addresses', AddressController::class);
        Route::put('addresses/{address}/default', [AddressController::class, 'setDefault'])->name('addresses.default');
    });
});
