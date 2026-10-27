<?php

namespace App\Http\Controllers;

use App\Http\Resources\NotificationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Gate;

class NotificationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return NotificationResource::collection($request->user()->notifications()->orderByDesc('created_at')->orderByDesc('id')->paginate(15));
    }

    public function count(Request $request): JsonResponse
    {
        return response()->json(['data' => ['unread_count' => $request->user()->unreadNotifications()->count()]]);
    }

    public function show(DatabaseNotification $notification): NotificationResource
    {
        Gate::authorize('view', $notification);

        return new NotificationResource($notification);
    }

    public function update(DatabaseNotification $notification): Response
    {
        Gate::authorize('update', $notification);
        $notification->markAsRead();

        return response()->noContent();
    }

    public function readAll(Request $request): Response
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->noContent();
    }
}
