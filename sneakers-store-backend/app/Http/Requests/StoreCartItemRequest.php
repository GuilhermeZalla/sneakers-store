<?php

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCartItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $product = Product::query()->find($this->integer('product_id'));

        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:999'],
            'size' => ['sometimes', 'string', 'max:32', Rule::in($product?->sizes ?: [''])],
            'color' => ['sometimes', 'string', 'max:64', Rule::in($product?->colors ?: [''])],
        ];
    }
}
