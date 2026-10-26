<?php

namespace App\Http\Resources;

use App\Models\Product;
use App\StoreLocale;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Product */
class ProductResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $locale = StoreLocale::from(app()->getLocale());

        return [
            'id' => $this->id,
            'legacy_id' => $this->legacy_id,
            'slug' => $this->slug,
            'name' => $this->name,
            'description' => $this->description,
            'brand' => $this->brand,
            'type' => $this->type,
            'price' => $this->priceFor($locale),
            'currency' => $locale->currency(),
            'thumbnail' => $this->thumbnail,
            'images' => $this->images,
            'colors' => $this->colors,
            'sizes' => $this->sizes,
            'rating' => $this->rating,
        ];
    }
}
