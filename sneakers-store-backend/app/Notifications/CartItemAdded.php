<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Notifications\Notification;

class CartItemAdded extends Notification
{
    public function __construct(public string $productName, public string $messageLocale) {}

    /** @return list<string> */
    public function via(mixed $notifiable): array
    {
        return ['database'];
    }

    /** @return array{event: string, title: string, body: string, url: string} */
    public function toArray(User $notifiable): array
    {
        return [
            'event' => 'cart_added',
            'title' => __('notifications.cart_added.title', [], $this->messageLocale),
            'body' => __('notifications.cart_added.body', ['product' => $this->productName], $this->messageLocale),
            'url' => '/cart',
        ];
    }
}
