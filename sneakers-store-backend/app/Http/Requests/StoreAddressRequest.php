<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return $this->addressRules(false);
    }

    /** @return array<string, mixed> */
    protected function addressRules(bool $partial): array
    {
        $required = $partial ? ['sometimes', 'required'] : ['required'];

        return [
            'type' => [...$required, 'string', Rule::in(['home', 'work', 'other'])],
            'postal_code' => [...$required, 'string', 'regex:/^\\d{5}-?\\d{3}$/'],
            'street' => [...$required, 'string', 'max:255'],
            'number' => [...$required, 'string', 'max:32'],
            'complement' => ['sometimes', 'nullable', 'string', 'max:255'],
            'reference' => ['sometimes', 'nullable', 'string', 'max:255'],
            'district' => [...$required, 'string', 'max:255'],
            'city' => [...$required, 'string', 'max:255'],
            'state' => [...$required, 'string', Rule::in(['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'])],
            'is_default' => ['sometimes', 'boolean'],
        ];
    }
}
