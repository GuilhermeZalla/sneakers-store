<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Http\Middleware\ThrottleVerificationDelivery;
use App\Http\Responses\PasswordResetLinkResponse;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Contracts\Auth\CanResetPassword;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts\FailedPasswordResetLinkRequestResponse;
use Laravel\Fortify\Contracts\SuccessfulPasswordResetLinkRequestResponse;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->app->bind(SuccessfulPasswordResetLinkRequestResponse::class, PasswordResetLinkResponse::class);
        $this->app->bind(FailedPasswordResetLinkRequestResponse::class, PasswordResetLinkResponse::class);
        Fortify::createUsersUsing(CreateNewUser::class);
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        RateLimiter::for('password-reset', fn (Request $request): array => [
            Limit::perMinute(5)->by($request->route()?->getName().'|reset-ip|'.$request->ip()),
            Limit::perMinute(1)->by($request->route()?->getName().'|reset-email|'.Str::lower((string) $request->input('email'))),
        ]);
        $this->app->booted(function (): void {
            Route::getRoutes()->refreshNameLookups();
            Route::getRoutes()->getByName('register.store')?->middleware(ThrottleVerificationDelivery::class);
            foreach (['password.email', 'password.update'] as $name) {
                Route::getRoutes()->getByName($name)?->middleware('throttle:password-reset');
            }
        });

        ResetPassword::createUrlUsing(fn (CanResetPassword $user, string $token): string => rtrim(config('app.frontend_url'), '/').'/reset-password?'.http_build_query([
            'token' => $token,
            'email' => $user->getEmailForPasswordReset(),
        ])
        );

        RateLimiter::for('login', function (Request $request): Limit {
            return Limit::perMinute(5)->by(
                Str::transliterate(Str::lower((string) $request->input('email'))).'|'.$request->ip()
            );
        });
    }
}
