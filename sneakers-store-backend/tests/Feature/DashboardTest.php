<?php

use App\Models\User;

test('guests receive an unauthorized response for dashboard account data', function () {
    $this->getJson('/api/v1/user')->assertUnauthorized();
});

test('authenticated users can access dashboard account data', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->getJson('/api/v1/user')->assertOk()
        ->assertJsonPath('data.id', $user->id);
});
