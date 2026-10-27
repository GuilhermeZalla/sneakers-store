<?php

namespace App\Notifications;

use App\Concerns\QueuesStoreNotifications;
use App\Mail\StoreMessage;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Password;

class ResetStorePassword extends ResetPassword implements ShouldBeEncrypted, ShouldQueue
{
    use QueuesStoreNotifications;

    public function __construct(#[\SensitiveParameter] string $token)
    {
        parent::__construct($token);
        $this->initializeDelivery();
    }

    public function shouldSend(User $notifiable, string $channel): bool
    {
        return Password::broker()->tokenExists($notifiable, $this->token);
    }

    public function toMail(mixed $notifiable): StoreMessage
    {
        if (! $notifiable instanceof User) {
            throw new \InvalidArgumentException('A store notification requires a user.');
        }

        return (new StoreMessage('reset', $notifiable->name, $notifiable->email, $notifiable->locale,
            $this->resetUrl($notifiable)))->to($notifiable->email);
    }

    /** @return array{event: string, title: string, body: string, url: string} */
    public function toArray(User $notifiable): array
    {
        return $this->databaseContent($notifiable, 'reset', '/forgot-password');
    }
}
