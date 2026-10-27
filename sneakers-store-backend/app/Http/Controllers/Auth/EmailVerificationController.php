<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class EmailVerificationController extends Controller
{
    public function verify(string $id, string $hash): Response
    {
        DB::transaction(function () use ($id, $hash): void {
            $user = User::query()->lockForUpdate()->findOrFail($id);
            abort_unless(hash_equals(sha1($user->getEmailForVerification()), $hash), 403);
            abort_if($user->hasVerifiedEmail(), 410, 'This verification link has already been used.');
            if ($user->markEmailAsVerified()) {
                event(new Verified($user));
            }
        });

        return response()->noContent();
    }

    public function resend(Request $request): Response
    {
        if (! $request->user()->hasVerifiedEmail()) {
            $request->user()->sendEmailVerificationNotification();
        }

        return response()->noContent();
    }
}
