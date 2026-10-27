<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Http\Requests\UpdateLocaleRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class ProfileController extends Controller
{
    public function edit(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    public function update(ProfileUpdateRequest $request): UserResource
    {
        $user = $request->user();
        $user->fill($request->validated());

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        if ($user->wasChanged('email')) {
            $user->sendEmailVerificationNotification();
        }

        return new UserResource($user);
    }

    public function locale(UpdateLocaleRequest $request): UserResource
    {
        $request->user()->update($request->validated());

        return new UserResource($request->user());
    }

    public function destroy(ProfileDeleteRequest $request): Response
    {
        $user = $request->user();
        Auth::guard('web')->logout();
        $user->delete();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->noContent();
    }
}
