<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAddressRequest;
use App\Http\Requests\UpdateAddressRequest;
use App\Http\Resources\AddressResource;
use App\Models\Address;
use App\Services\AddressService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class AddressController extends Controller
{
    public function __construct(private AddressService $addresses) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Address::class);

        return AddressResource::collection($request->user()->addresses()->orderBy('id')->get());
    }

    public function show(Address $address): AddressResource
    {
        Gate::authorize('view', $address);

        return new AddressResource($address);
    }

    public function store(StoreAddressRequest $request): AddressResource
    {
        Gate::authorize('create', Address::class);

        return new AddressResource($this->addresses->create($request->user(), $request->validated()));
    }

    public function update(UpdateAddressRequest $request, Address $address): AddressResource
    {
        Gate::authorize('update', $address);

        return new AddressResource($this->addresses->update($request->user(), $address, $request->validated()));
    }

    public function setDefault(Request $request, Address $address): AddressResource
    {
        Gate::authorize('update', $address);

        return new AddressResource($this->addresses->update($request->user(), $address, ['is_default' => true]));
    }

    public function destroy(Request $request, Address $address): Response
    {
        Gate::authorize('delete', $address);
        $this->addresses->delete($request->user(), $address);

        return response()->noContent();
    }
}
