<?php

namespace App\Notifications;

use App\Concerns\QueuesStoreNotifications;
use App\Mail\StoreMessage;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class VerifyStoreEmail extends Notification implements ShouldBeEncrypted, ShouldQueue
{
    use QueuesStoreNotifications;

    public function __construct()
    {
        $this->initializeDelivery();
    }

    public function toMail(User $notifiable): StoreMessage
    {
        $signedPath = URL::temporarySignedRoute('verification.verify', now()->addMinutes(30), [
            'id' => $notifiable->id, 'hash' => sha1($notifiable->getEmailForVerification()),
        ], absolute: false);
        $frontPath = str_replace('/api/v1/auth/email/verify/', '/verify-email/', $signedPath);

        return (new StoreMessage('verification', $notifiable->name, $notifiable->email, $notifiable->locale,
            rtrim(config('app.frontend_url'), '/').$frontPath))->to($notifiable->email);
    }

    /** @return array{event: string, title: string, body: string, url: string} */
    public function toArray(User $notifiable): array
    {
        return $this->databaseContent($notifiable, 'verification', '/verify-email');
    }
}
