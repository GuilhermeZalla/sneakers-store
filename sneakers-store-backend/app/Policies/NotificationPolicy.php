<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Notifications\DatabaseNotification;

class NotificationPolicy
{
    public function view(User $user, DatabaseNotification $notification): bool
    {
        return $notification->notifiable_type === $user->getMorphClass() && (string) $notification->notifiable_id === (string) $user->id;
    }

    public function update(User $user, DatabaseNotification $notification): bool
    {
        return $this->view($user, $notification);
    }
}
