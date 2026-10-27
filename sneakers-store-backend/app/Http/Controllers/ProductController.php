<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductIndexRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\StoreLocale;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function index(ProductIndexRequest $request): AnonymousResourceCollection
    {
        $filters = $request->validated();
        $locale = StoreLocale::from(app()->getLocale());
        $priceColumn = $locale === StoreLocale::Portuguese ? 'price_brl' : 'price_usd';
        $query = Product::query();

        foreach (['brand', 'type'] as $field) {
            if (isset($filters[$field])) {
                $query->where($field, $filters[$field]);
            }
        }

        if (isset($filters['search'])) {
            $query->where('name', 'like', '%'.$filters['search'].'%');
        }

        if (isset($filters['min_price'])) {
            $query->where($priceColumn, '>=', $filters['min_price']);
        }

        if (isset($filters['max_price'])) {
            $query->where($priceColumn, '<=', $filters['max_price']);
        }

        $sort = $filters['sort'] ?? 'name';
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $field = ltrim($sort, '-');
        $query->orderBy($field === 'price' ? $priceColumn : $field, $direction)->orderBy('id');

        return ProductResource::collection($query->paginate($filters['per_page'] ?? 30)->withQueryString());
    }

    public function show(Product $product): ProductResource
    {
        return new ProductResource($product);
    }
}
