<?php

namespace Database\Factories;

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Address> */
class AddressFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return ['user_id' => User::factory(), 'type' => 'home', 'postal_code' => '01234-567', 'street' => fake()->streetName(), 'number' => '12A', 'complement' => null, 'reference' => null, 'district' => 'Centro', 'city' => 'São Paulo', 'state' => 'SP', 'is_default' => false];
    }
}
