<?php

use App\Models\User;
use App\Notifications\ResetStorePassword as ResetPassword;
use App\Notifications\StoreNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

test('password reset requires a valid email', function () {
    $this->postJson(route('password.email'), ['email' => 'invalid'])
        ->assertUnprocessable()->assertJsonValidationErrors('email');
});

test('password reset link can be requested', function () {
    Notification::fake();
    $user = User::factory()->create();

    $this->postJson(route('password.email'), ['email' => $user->email])->assertOk();

    Notification::assertSentTo($user, ResetPassword::class);
});

test('password reset notifications link to the frontend', function () {
    Notification::fake();
    $user = User::factory()->create();

    $this->postJson(route('password.email'), ['email' => $user->email])->assertOk();

    Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user): bool {
        $url = $notification->toMail($user)->actionUrl;

        expect($url)->toStartWith('http://localhost:5173/reset-password?')
            ->toContain('token='.$notification->token);

        return true;
    });
});

test('password can be reset with a valid token', function () {
    Notification::fake();
    $user = User::factory()->create();
    $this->postJson(route('password.email'), ['email' => $user->email])->assertOk();

    Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user): bool {
        $this->postJson(route('password.update'), [
            'token' => $notification->token, 'email' => $user->email,
            'password' => 'new-password', 'password_confirmation' => 'new-password',
        ])->assertOk();

        expect(Hash::check('new-password', $user->fresh()->password))->toBeTrue();

        return true;
    });
});

test('password cannot be reset with an invalid token', function () {
    $user = User::factory()->create();

    $this->postJson(route('password.update'), [
        'token' => 'invalid-token', 'email' => $user->email,
        'password' => 'new-password', 'password_confirmation' => 'new-password',
    ])->assertUnprocessable()->assertJsonValidationErrors('email');

    expect(Hash::check('password', $user->fresh()->password))->toBeTrue();
});

test('reset links expire after fifteen minutes and cannot be used twice', function () {
    Notification::fake();
    $user = User::factory()->create();
    $token = null;
    $this->postJson(route('password.email'), ['email' => $user->email])->assertOk();
    Notification::assertSentTo($user, ResetPassword::class, function ($notification) use (&$token): bool {
        $token = $notification->token;

        return true;
    });
    $payload = ['email' => $user->email, 'token' => $token, 'password' => 'NewPrivatePassword-123!', 'password_confirmation' => 'NewPrivatePassword-123!'];
    $this->postJson(route('password.update'), $payload)->assertOk();
    Notification::assertSentTo($user, StoreNotification::class, fn ($n) => $n->event === 'password_changed');
    $this->travel(61)->seconds();
    $this->postJson(route('password.update'), $payload)->assertUnprocessable();
    $this->postJson(route('password.email'), ['email' => $user->email])->assertOk();
    Notification::assertSentTo($user, ResetPassword::class, function ($notification) use (&$token): bool {
        $token = $notification->token;

        return true;
    });
    $this->travel(16)->minutes();
    $this->postJson(route('password.update'), [...$payload, 'token' => $token])->assertUnprocessable();
});
test('password reset requests have an explicit per email rate limit', function () {
    Notification::fake();
    $user = User::factory()->create();
    $this->postJson(route('password.email'), ['email' => $user->email])->assertOk();
    $this->postJson(route('password.email'), ['email' => $user->email])->assertTooManyRequests();
    Notification::assertSentToTimes($user, ResetPassword::class, 1);
});
