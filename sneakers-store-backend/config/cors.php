<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Accept', 'Accept-Language', 'Content-Type', 'Origin', 'X-Requested-With', 'X-XSRF-TOKEN', 'Idempotency-Key'],
    'exposed_headers' => ['Content-Language', 'X-Store-Currency'],
    'max_age' => 0,
    'supports_credentials' => true,
];
