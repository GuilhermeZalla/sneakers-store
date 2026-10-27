<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['idempotency_key' => $this->header('Idempotency-Key')]);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'idempotency_key' => ['required', 'string', 'min:16', 'max:64', 'regex:/^[A-Za-z0-9_-]+$/'],
            'address_id' => ['required', 'integer'],
            'shipping_method' => ['required', Rule::in(['blue', 'sedex', 'fedex', 'red'])],
            'payment_method' => ['required', Rule::in(['debit', 'credit', 'paypal', 'wallet'])],
        ];
    }
}
