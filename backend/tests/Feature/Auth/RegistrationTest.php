<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

function registrationPayload(): array
{
    return [
        'name' => 'Test User', 'email' => 'new@example.com',
        'password' => 'password', 'password_confirmation' => 'password',
        'phone' => '+5511999999999', 'birthday' => '1995-05-20',
        'gender' => 'not_informed',
    ];
}

test('new users can register through the JSON API', function () {
    $this->postJson(route('register.store'), registrationPayload())->assertCreated();

    $user = User::where('email', 'new@example.com')->firstOrFail();
    $this->assertAuthenticatedAs($user);
    expect(Hash::check('password', $user->password))->toBeTrue()
        ->and($user->phone)->toBe('+5511999999999')
        ->and($user->birthday->format('Y-m-d'))->toBe('1995-05-20');
});

test('registration rejects invalid or missing profile fields', function (string $field, mixed $value) {
    $this->postJson(route('register.store'), [
        ...registrationPayload(), $field => $value,
    ])->assertUnprocessable()->assertJsonValidationErrors($field);

    $this->assertDatabaseCount('users', 0);
})->with([
    ['email', 'invalid'], ['phone', 5511999999999], ['phone', 'abc'],
    ['birthday', '2099-01-01'], ['gender', 'invalid'],
    ['password', 'short'],
]);

test('registration rejects duplicate emails regardless of casing', function () {
    User::factory()->create(['email' => 'new@example.com']);

    $this->postJson(route('register.store'), [
        ...registrationPayload(), 'email' => 'NEW@EXAMPLE.COM',
    ])->assertUnprocessable()->assertJsonValidationErrors('email');

    $this->assertDatabaseCount('users', 1);
});

test('registration never accepts security attributes from the client', function () {
    $this->postJson(route('register.store'), [
        ...registrationPayload(), 'id' => 9999, 'logged' => true,
        'email_verified_at' => now()->toDateTimeString(),
    ])->assertCreated();

    $user = User::where('email', 'new@example.com')->firstOrFail();
    expect($user->id)->not->toBe(9999)->and($user->email_verified_at)->toBeNull();
});
