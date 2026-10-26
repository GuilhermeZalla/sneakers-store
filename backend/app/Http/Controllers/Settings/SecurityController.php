<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PasswordUpdateRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class SecurityController extends Controller
{
    public function edit(): JsonResponse
    {
        return response()->json(['data' => ['can_change_password' => true]]);
    }

    public function update(PasswordUpdateRequest $request): Response
    {
        $request->user()->update(['password' => $request->validated('password')]);

        return response()->noContent();
    }
}
