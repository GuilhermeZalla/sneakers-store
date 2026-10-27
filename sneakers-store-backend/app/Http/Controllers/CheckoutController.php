<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckoutRequest;
use App\Http\Resources\OrderResource;
use App\Services\CheckoutService;
use App\StoreLocale;
use Illuminate\Http\JsonResponse;

class CheckoutController extends Controller
{
    public function __construct(private CheckoutService $checkout) {}

    public function shipping(): JsonResponse
    {
        $locale = StoreLocale::from(app()->getLocale());

        return response()->json(['data' => $this->checkout->shippingMethods($locale), 'currency' => $locale->currency()]);
    }

    public function store(CheckoutRequest $request): OrderResource
    {
        return new OrderResource($this->checkout->checkout($request->user(), [
            'idempotency_key' => $request->string('idempotency_key')->toString(),
            'address_id' => $request->integer('address_id'),
            'shipping_method' => $request->string('shipping_method')->toString(),
            'payment_method' => $request->string('payment_method')->toString(),
        ], StoreLocale::from(app()->getLocale())));
    }
}
