<?php

use App\Models\User;

test('users can authenticate through the JSON API', function () {
    $user = User::factory()->create();

    $this->postJson(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ])->assertOk();

    $this->assertAuthenticatedAs($user);
    $this->getJson('/api/v1/user')->assertOk()->assertJsonPath('data.id', $user->id)
        ->assertJsonMissingPath('data.password')->assertJsonMissingPath('data.remember_token');
});

test('users cannot authenticate with invalid credentials', function () {
    $user = User::factory()->create();

    $this->postJson(route('login.store'), [
        'email' => $user->email, 'password' => 'wrong-password',
    ])->assertUnprocessable()->assertJsonValidationErrors('email');

    $this->assertGuest();
});

test('login requires valid input', function () {
    $this->postJson(route('login.store'), [])->assertUnprocessable()
        ->assertJsonValidationErrors(['email', 'password']);
});

test('users can logout and lose access to their account', function () {
    $this->actingAs(User::factory()->create())
        ->postJson(route('logout'))->assertNoContent();

    $this->assertGuest();
    $this->getJson('/api/v1/user')->assertUnauthorized();
});

test('login attempts are rate limited', function () {
    $user = User::factory()->create();

    for ($attempt = 0; $attempt < 5; $attempt++) {
        $this->postJson(route('login.store'), [
            'email' => $user->email, 'password' => 'wrong-password',
        ])->assertUnprocessable();
    }

    $this->postJson(route('login.store'), [
        'email' => $user->email, 'password' => 'password',
    ])->assertTooManyRequests();

    $this->assertGuest();
});

test('a frontend origin can initialize the csrf cookie', function () {
    $this->withHeader('Origin', 'http://localhost:5173')
        ->getJson('/sanctum/csrf-cookie')->assertNoContent()
        ->assertCookie('XSRF-TOKEN');
});

test('state changing authentication requests require csrf protection outside tests', function () {
    $this->app['env'] = 'local';

    $this->withHeader('Origin', 'http://localhost:5173')
        ->postJson(route('login.store'), ['email' => 'user@example.com', 'password' => 'password'])
        ->assertStatus(419);

    $this->assertGuest();
});
