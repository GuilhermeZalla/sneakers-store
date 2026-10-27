<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'brand' => ['sometimes', 'string', 'max:80'],
            'type' => ['sometimes', 'string', 'in:sneaker,shirt,cap,gift'],
            'search' => ['sometimes', 'string', 'max:100'],
            'min_price' => ['sometimes', 'integer', 'min:0'],
            'max_price' => ['sometimes', 'integer', 'min:0', ...($this->has('min_price') ? ['gte:min_price'] : [])],
            'sort' => ['sometimes', 'string', 'in:name,-name,price,-price,rating,-rating'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}
