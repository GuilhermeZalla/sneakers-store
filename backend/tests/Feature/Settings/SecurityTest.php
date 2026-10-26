<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('security settings are available as JSON', function () {
    $this->actingAs(User::factory()->create())->getJson(route('security.edit'))
        ->assertOk()->assertJsonPath('data.can_change_password', true);
});

test('guests cannot access security settings', function () {
    $this->getJson(route('security.edit'))->assertUnauthorized();
});

test('password can be updated with the current password', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->putJson(route('user-password.update'), [
        'current_password' => 'password',
        'password' => 'new-password', 'password_confirmation' => 'new-password',
    ])->assertNoContent();

    expect(Hash::check('new-password', $user->refresh()->password))->toBeTrue();
});

test('incorrect current password prevents password update', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->putJson(route('user-password.update'), [
        'current_password' => 'wrong-password',
        'password' => 'new-password', 'password_confirmation' => 'new-password',
    ])->assertUnprocessable()->assertJsonValidationErrors('current_password');

    expect(Hash::check('password', $user->fresh()->password))->toBeTrue();
});

test('password confirmation must match', function () {
    $this->actingAs(User::factory()->create())->putJson(route('user-password.update'), [
        'current_password' => 'password', 'password' => 'new-password',
        'password_confirmation' => 'different-password',
    ])->assertUnprocessable()->assertJsonValidationErrors('password');
});
