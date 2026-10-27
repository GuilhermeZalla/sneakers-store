<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class ThrottleVerificationDelivery
{
    /** @param Closure(Request): Response $next */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($request->routeIs('profile.update') && $request->input('email') === $user?->email) {
            return $next($request);
        }

        $limits = ['verification-ip:'.$request->ip() => 5];
        $limits[$user ? 'verification-user:'.$user->id : 'verification-email:'.hash('sha256', strtolower((string) $request->input('email')))] = 1;

        foreach ($limits as $key => $maximum) {
            if (RateLimiter::tooManyAttempts($key, $maximum)) {
                return response()->json(['message' => __('Too Many Attempts.')], 429, [
                    'Retry-After' => (string) RateLimiter::availableIn($key),
                ]);
            }
        }

        foreach ($limits as $key => $maximum) {
            RateLimiter::hit($key, 60);
        }

        $response = $next($request);

        if ($user === null && $response->isSuccessful() && $request->user() !== null) {
            RateLimiter::hit('verification-user:'.$request->user()->id, 60);
        }

        return $response;
    }
}
