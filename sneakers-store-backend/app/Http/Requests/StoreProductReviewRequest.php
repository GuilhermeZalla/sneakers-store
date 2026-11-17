<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return ['rating' => ['required', 'integer', 'min:1', 'max:5'], 'comment' => ['required', 'string', 'min:5', 'max:2000']];
    }
}
