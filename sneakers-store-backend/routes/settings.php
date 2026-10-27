<?php

use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('user', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('user/locale', [ProfileController::class, 'locale'])->name('profile.locale');
    Route::patch('user', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('user', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('user/security', [SecurityController::class, 'edit'])->name('security.edit');
    Route::put('user/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')->name('user-password.update');
});
