<?php

test('mysql fixture refuses non isolated database configurations before accessing data', function (string $environment, string $driver, string $host, string $database) {
    $originalConnection = config('database.default');
    app()->detectEnvironment(fn () => $environment);
    config(['database.default' => 'fixture', 'database.connections.fixture' => [
        'driver' => $driver, 'host' => $host, 'database' => $database,
        'username' => 'unused', 'password' => '', 'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci', 'prefix' => '',
    ]]);

    try {
        $this->artisan('integration:mysql-fixture', ['action' => 'inspect'])->assertFailed();
    } finally {
        config(['database.default' => $originalConnection]);
    }
})->with([
    ['production', 'mysql', '127.0.0.1', 'sneakers_test_abcdef123456'],
    ['local', 'mysql', '127.0.0.1', 'sneakers_test_abcdef123456'],
    ['testing', 'mysql', 'db.remote.example', 'sneakers_test_abcdef123456'],
    ['testing', 'mysql', '127.0.0.1', 'sneakers_store'],
    ['testing', 'mysql', '127.0.0.1', 'sneakers_test_production'],
    ['testing', 'sqlite', '127.0.0.1', ':memory:'],
]);
