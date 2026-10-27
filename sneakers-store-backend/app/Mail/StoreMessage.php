<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StoreMessage extends Mailable
{
    use SerializesModels;

    public function __construct(
        public string $event,
        public string $recipientName,
        public string $recipientEmail,
        public string $notificationLocale,
        public string $actionUrl,
        public ?Order $order = null,
        public ?string $status = null,
    ) {
        $this->locale($notificationLocale);
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: __('notifications.'.$this->event.'.title', [], $this->notificationLocale));
    }

    public function content(): Content
    {
        return new Content(view: 'mail.notification', text: 'mail.notification-text');
    }
}
