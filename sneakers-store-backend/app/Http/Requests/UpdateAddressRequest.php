<?php

namespace App\Http\Requests;

class UpdateAddressRequest extends StoreAddressRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return $this->addressRules(true);
    }
}
