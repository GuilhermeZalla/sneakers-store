<?php

use App\Models\Address;
use App\Models\User;

function addressPayload(): array
{
    return [
        'type' => 'home', 'postal_code' => '01234-567', 'street' => 'Main Street',
        'number' => '12A', 'district' => 'Centro', 'city' => 'Sao Paulo', 'state' => 'SP',
        'complement' => null, 'reference' => null,
    ];
}

test('address endpoints require authentication', function () {
    $this->getJson('/api/v1/addresses')->assertUnauthorized();
    $this->postJson('/api/v1/addresses', addressPayload())->assertUnauthorized();
});

test('addresses support creation, viewing, editing and removal', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();

    $created = $this->actingAs($user)->postJson('/api/v1/addresses', [
        ...addressPayload(), 'user_id' => $other->id,
    ])->assertCreated()->assertJsonPath('data.postal_code', '01234-567')
        ->assertJsonPath('data.number', '12A');

    $id = $created->json('data.id');
    $this->getJson('/api/v1/addresses/'.$id)->assertOk()->assertJsonPath('data.type', 'home');
    $this->patchJson('/api/v1/addresses/'.$id, ['number' => '10B', 'type' => 'work'])
        ->assertOk()->assertJsonPath('data.number', '10B');
    $this->getJson('/api/v1/addresses')->assertJsonCount(1, 'data');
    $this->assertDatabaseHas('addresses', ['id' => $id, 'user_id' => $user->id]);
    $this->deleteJson('/api/v1/addresses/'.$id)->assertNoContent();
    $this->assertDatabaseMissing('addresses', ['id' => $id]);
});

test('only one default address is allowed per user through all mutation paths', function () {
    $user = User::factory()->create();
    $otherDefault = Address::factory()->create(['is_default' => true]);

    $this->actingAs($user);
    $first = $this->postJson('/api/v1/addresses', [...addressPayload(), 'is_default' => true])
        ->assertCreated()->json('data.id');
    $second = $this->postJson('/api/v1/addresses', [...addressPayload(), 'is_default' => true])
        ->assertCreated()->json('data.id');

    expect(Address::findOrFail($first)->is_default)->toBeFalse();
    $this->patchJson('/api/v1/addresses/'.$first, ['is_default' => true])->assertOk()
        ->assertJsonPath('data.is_default', true);
    expect(Address::findOrFail($second)->is_default)->toBeFalse();
    $this->putJson('/api/v1/addresses/'.$second.'/default')->assertOk()
        ->assertJsonPath('data.is_default', true);

    expect($user->addresses()->where('is_default', true)->count())->toBe(1)
        ->and($otherDefault->fresh()->is_default)->toBeTrue();
});

test('users cannot view, update, set default or remove another user address', function () {
    $user = User::factory()->create();
    $address = Address::factory()->create();

    $this->actingAs($user)->getJson('/api/v1/addresses/'.$address->id)->assertForbidden();
    $this->patchJson('/api/v1/addresses/'.$address->id, ['city' => 'Other'])->assertForbidden();
    $this->putJson('/api/v1/addresses/'.$address->id.'/default')->assertForbidden();
    $this->deleteJson('/api/v1/addresses/'.$address->id)->assertForbidden();
    $this->assertDatabaseHas('addresses', ['id' => $address->id]);
});

test('address validation preserves strings and rejects invalid data', function (array $change, string $field) {
    $this->actingAs(User::factory()->create())->postJson('/api/v1/addresses', [
        ...addressPayload(), ...$change,
    ])->assertUnprocessable()->assertJsonValidationErrors($field);

    $this->assertDatabaseCount('addresses', 0);
})->with([
    [['postal_code' => 1234567], 'postal_code'],
    [['postal_code' => '123'], 'postal_code'],
    [['number' => 12], 'number'],
    [['state' => 'XX'], 'state'],
    [['type' => ['home']], 'type'],
    [['is_default' => 'yes'], 'is_default'],
]);

test('the four address limit is enforced and localized', function () {
    $user = User::factory()->create();
    Address::factory()->count(4)->create(['user_id' => $user->id]);

    $this->actingAs($user)->withHeader('Accept-Language', 'pt-BR')
        ->postJson('/api/v1/addresses', addressPayload())->assertUnprocessable()
        ->assertJsonPath('errors.address.0', "Voc\u{00EA} pode cadastrar at\u{00E9} quatro endere\u{00E7}os.");

    expect($user->addresses()->count())->toBe(4);
});
