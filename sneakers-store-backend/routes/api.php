<?php

use App\Http\Controllers\AddressController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\WishlistController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    require __DIR__.'/settings.php';
    Route::get('auth/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware(['signed:relative', 'throttle:6,1'])->name('verification.verify');
    Route::post('auth/email/verification-notification', [EmailVerificationController::class, 'resend'])
        ->middleware(['auth:sanctum', 'throttle:1,1'])->name('verification.send');
    Route::middleware('auth:sanctum')->prefix('notifications')->name('notifications.')->group(function (): void {
        Route::get('/', [NotificationController::class, 'index'])->name('index');
        Route::get('/unread-count', [NotificationController::class, 'count'])->name('count');
        Route::patch('/read-all', [NotificationController::class, 'readAll'])->name('read-all');
        Route::get('/{notification}', [NotificationController::class, 'show'])->name('show');
        Route::patch('/{notification}/read', [NotificationController::class, 'update'])->name('read');
    });

    Route::get('products', [ProductController::class, 'index'])->name('products.index');
    Route::get('products/{product:slug}', [ProductController::class, 'show'])->name('products.show');

    Route::middleware(['auth:sanctum', 'verified'])->group(function (): void {
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
