<?php

use App\Models\User;
use App\Notifications\ResetStorePassword;
use App\Notifications\VerifyStoreEmail;
use Illuminate\Support\Facades\Notification;

test('reset requests return identical status and body for known and unknown emails', function (string $locale) {
    Notification::fake();
    $user = User::factory()->create();
    $this->withHeader('Accept-Language', $locale);
    $known = $this->postJson(route('password.email'), ['email' => $user->email])->assertOk();
    $unknown = $this->postJson(route('password.email'), ['email' => 'unknown@example.test'])->assertOk();

    expect($unknown->getStatusCode())->toBe($known->getStatusCode())
        ->and($unknown->json())->toBe($known->json());
    Notification::assertSentToTimes($user, ResetStorePassword::class, 1);
    Notification::assertCount(1);
})->with(['en', 'pt-BR']);

test('registration limits by IP and shares the initial verification cooldown with resend and email changes', function () {
    Notification::fake();
    $payload = ['name' => 'Alex', 'email' => 'alex@example.test', 'password' => 'PrivatePassword-123!',
        'password_confirmation' => 'PrivatePassword-123!', 'phone' => '11999990000',
        'birthday' => '1995-05-15', 'gender' => 'not_informed'];

    $this->postJson(route('register.store'), $payload)->assertCreated();
    $user = User::where('email', $payload['email'])->firstOrFail();
    $this->postJson(route('verification.send'))->assertTooManyRequests();
    $this->patchJson(route('profile.update'), ['name' => 'Alex', 'email' => 'changed@example.test'])->assertTooManyRequests();
    expect($user->fresh()->email)->toBe($payload['email']);
    Notification::assertSentToTimes($user, VerifyStoreEmail::class, 1);

    $this->travel(61)->seconds();
    $this->patchJson(route('profile.update'), ['name' => 'Alex', 'email' => 'changed@example.test'])->assertSuccessful();
    $this->postJson(route('verification.send'))->assertTooManyRequests();
    Notification::assertSentToTimes($user, VerifyStoreEmail::class, 2);
});

test('registration cannot evade the IP limit by using different email addresses', function () {
    Notification::fake();
    for ($attempt = 0; $attempt < 6; $attempt++) {
        $response = $this->postJson(route('register.store'), ['email' => 'attempt'.$attempt.'@example.test']);
        if ($attempt < 5) {
            $response->assertUnprocessable();
        } else {
            $response->assertTooManyRequests();
        }
    }
    $this->assertDatabaseCount('users', 0);
    Notification::assertNothingSent();
});

test('resend and profile changes share a per user limit even when the client IP changes', function () {
    Notification::fake();
    $user = User::factory()->unverified()->create();
    $this->actingAs($user)->postJson(route('verification.send'))->assertNoContent();
    $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.2'])
        ->patchJson(route('profile.update'), ['name' => $user->name, 'email' => 'other@example.test'])->assertTooManyRequests();
    $this->patchJson(route('profile.update'), ['name' => 'Updated name', 'email' => $user->email])->assertOk();
    Notification::assertSentToTimes($user, VerifyStoreEmail::class, 1);
});

test('email changes have an IP limit across different authenticated accounts', function () {
    Notification::fake();
    for ($attempt = 0; $attempt < 6; $attempt++) {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->patchJson(route('profile.update'), [
            'name' => $user->name, 'email' => 'changed'.$attempt.'@example.test',
        ]);
        if ($attempt < 5) {
            $response->assertOk();
        } else {
            $response->assertTooManyRequests();
            expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
        }
    }
    Notification::assertCount(5);
});

test('checkout preflight allows the idempotency header only for the configured frontend origin', function () {
    $headers = ['Origin' => 'http://localhost:5173', 'Access-Control-Request-Method' => 'POST',
        'Access-Control-Request-Headers' => 'content-type,idempotency-key,x-xsrf-token'];
    $response = $this->options('/api/v1/checkout', [], $headers)->assertNoContent()
        ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
        ->assertHeader('Access-Control-Allow-Credentials', 'true');
    expect(strtolower($response->headers->get('Access-Control-Allow-Headers')))->toContain('idempotency-key');
    $this->options('/api/v1/checkout', [], [...$headers, 'Origin' => 'https://untrusted.example'])
        ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
});
