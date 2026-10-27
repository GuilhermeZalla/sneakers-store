<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Bus\Queueable;

trait QueuesStoreNotifications
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 30;

    public function initializeDelivery(): void
    {
        $this->onConnection('database');
        $this->afterCommit();
    }

    /** @return list<string> */
    public function via(mixed $notifiable): array
    {
        return ['mail', 'database'];
    }

    /** @return list<int> */
    public function backoff(): array
    {
        return [10, 60, 300];
    }

    /** @return array{event: string, title: string, body: string, url: string} */
    protected function databaseContent(User $notifiable, string $event, string $path): array
    {
        return [
            'event' => $event,
            'title' => __('notifications.'.$event.'.title', [], $notifiable->locale),
            'body' => __('notifications.'.$event.'.body', [], $notifiable->locale),
            'url' => $path,
        ];
    }
}
