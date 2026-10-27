<?php

use App\Models\User;

test('authenticated users can read their own profile', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->getJson(route('profile.edit'))->assertOk()
        ->assertJsonPath('data.id', $user->id)->assertJsonMissingPath('data.password');
});

test('profile information can be updated through the API', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->patchJson(route('profile.update'), [
        'name' => 'Test User', 'email' => 'test@example.com',
        'phone' => '+5511988888888', 'second_contact' => null,
    ])->assertOk()->assertJsonPath('data.phone', '+5511988888888');

    expect($user->refresh()->name)->toBe('Test User')
        ->and($user->email)->toBe('test@example.com')
        ->and($user->email_verified_at)->toBeNull();
});

test('email verification remains when email is unchanged', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->patchJson(route('profile.update'), [
        'name' => 'Test User', 'email' => $user->email,
    ])->assertOk();

    expect($user->refresh()->email_verified_at)->not->toBeNull();
});

test('a user cannot change another user by injecting an id', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();

    $this->actingAs($user)->patchJson(route('profile.update'), [
        'id' => $other->id, 'name' => 'Own name', 'email' => $user->email,
    ])->assertOk()->assertJsonPath('data.id', $user->id);

    expect($other->fresh()->name)->toBe($other->name);
});

test('duplicate profile email is rejected', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();

    $this->actingAs($user)->patchJson(route('profile.update'), [
        'name' => $user->name, 'email' => $other->email,
    ])->assertUnprocessable()->assertJsonValidationErrors('email');
});

test('user can delete their account with their password', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->deleteJson(route('profile.destroy'), [
        'password' => 'password',
    ])->assertNoContent();

    $this->assertGuest('web');
    expect($user->fresh())->toBeNull();
});

test('correct password is required to delete an account', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->deleteJson(route('profile.destroy'), [
        'password' => 'wrong-password',
    ])->assertUnprocessable()->assertJsonValidationErrors('password');

    expect($user->fresh())->not->toBeNull();
});
