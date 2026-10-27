<?php

use App\Models\User;
use App\Notifications\VerifyStoreEmail;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;

function verificationPath(User $user, int $minutes = 30): string
{
    return URL::temporarySignedRoute('verification.verify', now()->addMinutes($minutes), ['id' => $user->id, 'hash' => sha1($user->email)], absolute: false);
}
test('verification mail links to the SPA and works while logged out only once', function () {
    Event::fake([Verified::class]);
    $user = User::factory()->unverified()->create();
    $mail = (new VerifyStoreEmail)->toMail($user);
    expect($mail->actionUrl)->toStartWith('http://localhost:5173/verify-email/'.$user->id.'/');
    $path = str_replace('http://localhost:5173/verify-email/', '/api/v1/auth/email/verify/', $mail->actionUrl);
    $this->getJson($path)->assertNoContent();
    $this->assertGuest();
    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
    Event::assertDispatchedTimes(Verified::class, 1);
    $this->getJson($path)->assertGone();
    Event::assertDispatchedTimes(Verified::class, 1);
});
test('expired tampered and stale email verification links are rejected', function () {
    $user = User::factory()->unverified()->create();
    $this->getJson(verificationPath($user, -1))->assertForbidden();
    $path = verificationPath($user);
    $this->getJson(str_replace('signature=', 'signature=x', $path))->assertForbidden();
    $user->update(['email' => 'changed@example.test']);
    $this->getJson($path)->assertForbidden();
    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});
test('resending verification requires authentication and is rate limited', function () {
    Notification::fake();
    $this->postJson(route('verification.send'))->assertUnauthorized();
    $user = User::factory()->unverified()->create();
    $this->actingAs($user)->postJson(route('verification.send'))->assertNoContent();
    $this->postJson(route('verification.send'))->assertTooManyRequests();
    Notification::assertSentToTimes($user, VerifyStoreEmail::class, 1);
});
test('already verified users do not receive a redundant verification mail', function () {
    Notification::fake();
    $user = User::factory()->create();
    $this->actingAs($user)->postJson(route('verification.send'))->assertNoContent();
    Notification::assertNothingSent();
});
test('unverified accounts cannot access commerce but may read their notifications', function () {
    $user = User::factory()->unverified()->create();
    $this->actingAs($user)->getJson('/api/v1/cart')->assertForbidden();
    $this->postJson('/api/v1/checkout')->assertForbidden();
    $this->getJson('/api/v1/notifications')->assertOk();
});
