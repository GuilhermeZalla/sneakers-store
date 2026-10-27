<?php

namespace App\Notifications;

use App\Concerns\QueuesStoreNotifications;
use App\Mail\StoreMessage;
use App\Models\Order;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class StoreNotification extends Notification implements ShouldBeEncrypted, ShouldQueue
{
    use QueuesStoreNotifications;

    public function __construct(public string $event, public ?Order $order = null, public ?string $status = null)
    {
        $this->initializeDelivery();
    }

    public function toMail(User $notifiable): StoreMessage
    {
        $path = $this->order ? '/account/orders/'.$this->order->id : '/account';

        return (new StoreMessage($this->event, $notifiable->name, $notifiable->email, $notifiable->locale,
            rtrim(config('app.frontend_url'), '/').$path, $this->order?->loadMissing('items'), $this->status))->to($notifiable->email);
    }

    /** @return array{event: string, title: string, body: string, url: string} */
    public function toArray(User $notifiable): array
    {
        $data = $this->databaseContent($notifiable, $this->event, $this->order ? '/account/orders/'.$this->order->id : '/account');
        if ($this->status !== null) {
            $data['body'] .= ' '.__('notifications.status', [], $notifiable->locale).': '.__('notifications.status_labels.'.$this->status, [], $notifiable->locale);
        }

        return $data;
    }
}
