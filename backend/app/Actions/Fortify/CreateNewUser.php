<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /** @param array<string, string> $input */
    public function create(array $input): User
    {
        $input['email'] = Str::lower($input['email'] ?? '');

        $validated = Validator::make($input, [
            ...$this->profileRules(),
            'phone' => ['required', 'string', 'max:24', 'regex:/^\+?[0-9 ()-]{8,24}$/'],
            'birthday' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'gender' => ['required', 'in:male,female,not_informed'],
            'password' => $this->passwordRules(),
        ])->validate();

        return User::create(Arr::only($validated, [
            'name', 'email', 'password', 'phone', 'birthday', 'second_contact', 'gender',
        ]));
    }
}
