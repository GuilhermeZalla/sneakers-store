<?php

namespace App\Http\Resources;

use App\Models\User;
use App\StoreLocale;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UserResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'birthday' => $this->birthday?->format('Y-m-d'),
            'second_contact' => $this->second_contact,
            'gender' => $this->gender,
        ];
    }

    /** @return array{meta: array{locale: string, currency: string}} */
    public function with(Request $request): array
    {
        $locale = StoreLocale::from(app()->getLocale());

        return ['meta' => ['locale' => $locale->value, 'currency' => $locale->currency()]];
    }
}
