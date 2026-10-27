<?php

namespace App\Observers;

use App\Models\Order;
use App\Notifications\StoreNotification;

class OrderObserver
{
    public function updated(Order $order): void
    {
        if ($order->wasChanged('status')) {
            $order->user->notify(new StoreNotification('order_status', $order, $order->status));
        }
    }
}
