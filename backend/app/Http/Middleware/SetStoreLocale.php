<?php

namespace App\Http\Middleware;

use App\StoreLocale;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetStoreLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = StoreLocale::from($request->getPreferredLanguage(['en', 'pt_BR']) ?? 'en');
        App::setLocale($locale->value);
        $response = $next($request);
        $response->headers->set('Content-Language', $locale->languageTag());
        $response->headers->set('X-Store-Currency', $locale->currency());
        $response->setVary('Accept-Language', false);

        return $response;
    }
}
