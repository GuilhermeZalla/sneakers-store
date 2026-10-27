<?php

namespace App\Services;

use App\Models\Address;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AddressService
{
    /** @param array<string, mixed> $attributes */
    public function create(User $user, array $attributes): Address
    {
        return DB::transaction(function () use ($user, $attributes): Address {
            $this->lockUser($user);

            if ($user->addresses()->count() >= 4) {
                throw ValidationException::withMessages(['address' => __('You may store up to four addresses.')]);
            }

            if ($attributes['is_default'] ?? false) {
                $user->addresses()->where('is_default', true)->update(['is_default' => false]);
            }

            return $user->addresses()->create($attributes);
        });
    }

    /** @param array<string, mixed> $attributes */
    public function update(User $user, Address $address, array $attributes): Address
    {
        return DB::transaction(function () use ($user, $address, $attributes): Address {
            $this->lockUser($user);
            $ownedAddress = $user->addresses()->whereKey($address->id)->firstOrFail();

            if ($attributes['is_default'] ?? false) {
                $user->addresses()->where('id', '!=', $ownedAddress->id)
                    ->where('is_default', true)->update(['is_default' => false]);
            }

            $ownedAddress->update($attributes);

            return $ownedAddress->refresh();
        });
    }

    public function delete(User $user, Address $address): void
    {
        DB::transaction(function () use ($user, $address): void {
            $this->lockUser($user);
            $user->addresses()->whereKey($address->id)->firstOrFail()->delete();
        });
    }

    private function lockUser(User $user): void
    {
        User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
    }
}
