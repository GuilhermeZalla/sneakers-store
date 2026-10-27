@php
    $pt = $notificationLocale === 'pt_BR';
    $t = fn (string $key): string => __('notifications.'.$key, [], $notificationLocale);
    $money = fn (int $cents): string => ($order?->currency === 'BRL' ? 'R$ ' : 'US$ ').number_format($cents / 100, 2, $pt ? ',' : '.', $pt ? '.' : ',');
@endphp
<!doctype html>
<html lang="{{ $pt ? 'pt-BR' : 'en' }}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{{ $t($event.'.title') }}</title></head>
<body style="margin:0;padding:24px;background:#f8f5e9;color:#171714;font-family:Arial,sans-serif">
<table role="presentation" style="max-width:640px;width:100%;margin:auto;border:2px solid #171714;border-collapse:collapse;background:#fff">
<tr><td style="padding:24px;background:#ff9e43;border-bottom:2px solid #171714;font-weight:900;font-size:28px">SNEAKERS ✳</td></tr>
<tr><td style="padding:28px">
<h1 style="font-size:28px;line-height:1.15">{{ $t($event.'.title') }}</h1>
<p>{{ __('notifications.hello', ['name' => $recipientName], $notificationLocale) }}</p>
<p style="line-height:1.6">{{ $t($event.'.body') }}</p>
@if($event === 'welcome')<p>{{ $t('registered_email') }}: {{ $recipientEmail }}</p>@endif
@if($order)
<h2>{{ $t('order') }} {{ $order->order_number }}</h2>
@if($status)<p>{{ $t('status') }}: {{ __('notifications.status_labels.'.$status, [], $notificationLocale) }}</p>@endif
<table style="width:100%;border-collapse:collapse" aria-label="{{ $t('order') }}">
<thead><tr><th align="left">{{ $t('item') }}</th><th>{{ $t('quantity') }}</th><th align="right">{{ $t('subtotal') }}</th></tr></thead>
<tbody>
@foreach($order->items as $item)
<tr><td style="padding:12px 0;border-top:1px solid #171714">{{ $item->product_name }}</td><td align="center">{{ $item->quantity }}</td><td align="right">{{ $money($item->unit_price * $item->quantity) }}</td></tr>
@endforeach
</tbody></table>
<p>{{ $t('subtotal') }}: {{ $money($order->subtotal) }}</p>
<p>{{ $t('shipping') }}: {{ $money($order->shipping_price) }}</p>
<p><strong>{{ $t('total') }}: {{ $money($order->total) }} ({{ $order->currency }})</strong></p>
<h3>{{ $t('address') }}</h3>
<p>{{ $order->shipping_name }}<br>{{ $order->shipping_street }}, {{ $order->shipping_number }}
@if($order->shipping_complement) — {{ $order->shipping_complement }}@endif
<br>{{ $order->shipping_district }} — {{ $order->shipping_city }}/{{ $order->shipping_state }}<br>{{ $order->shipping_postal_code }}
@if($order->shipping_reference)<br>{{ $order->shipping_reference }}@endif
</p>
@endif
<p style="margin:32px 0"><a href="{{ $actionUrl }}" style="display:inline-block;padding:16px 24px;background:#171714;color:#fff;border:2px solid #171714;text-decoration:none;font-weight:bold">{{ $t($event.'.action') }} →</a></p>
<p style="font-size:13px;line-height:1.5;overflow-wrap:anywhere">{{ $actionUrl }}</p>
<p style="font-size:13px;line-height:1.5">{{ $t('security') }}</p>
</td></tr>
<tr><td style="padding:20px;border-top:2px solid #171714;font-size:12px;font-weight:bold">{{ $t('footer') }} ✳</td></tr>
</table></body></html>
