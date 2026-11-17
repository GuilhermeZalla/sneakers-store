@php
$t = fn (string $key): string => __('notifications.'.$key, [], $notificationLocale);
$pt = $notificationLocale === 'pt_BR';
$colorLabel = fn (string $color): string => $pt && Lang::has('notifications.color_labels.'.$color, $notificationLocale) ? $t('color_labels.'.$color) : $color;
$money = fn (int $cents): string => ($order?->currency === 'BRL' ? 'R$ ' : 'US$ ').number_format($cents / 100, 2, $pt ? ',' : '.', $pt ? '.' : ',');
@endphp
sneakers.
{{ $t($event.'.title') }}

{{ __('notifications.hello', ['name' => $recipientName], $notificationLocale) }}
{{ $t($event.'.body') }}
@if($event === 'welcome')
{{ $t('registered_email') }}: {{ $recipientEmail }}
@endif
@if($order)
{{ $t('order') }}: {{ $order->order_number }}
@if($status)
{{ $t('status') }}: {{ __('notifications.status_labels.'.$status, [], $notificationLocale) }}
@endif
@foreach($order->items as $item)
{{ $item->product_name }} × {{ $item->quantity }} — {{ $money($item->quantity * $item->unit_price) }}
@if($item->size){{ $t('size') }}: {{ $item->size }}@endif
@if($item->color){{ $t('color') }}: {{ $colorLabel($item->color) }}@endif
@endforeach
{{ $t('subtotal') }}: {{ $money($order->subtotal) }}
{{ $t('shipping') }}: {{ $money($order->shipping_price) }}
{{ $t('total') }}: {{ $money($order->total) }} ({{ $order->currency }})
{{ $t('address') }}:
{{ $order->shipping_name }}
{{ $order->shipping_street }}, {{ $order->shipping_number }} {{ $order->shipping_complement }}
{{ $order->shipping_district }} — {{ $order->shipping_city }}/{{ $order->shipping_state }}
{{ $order->shipping_postal_code }} {{ $order->shipping_reference }}
@endif
{{ $t($event.'.action') }}: {!! $actionUrl !!}

{{ $t('security') }}
{{ $t('footer') }}
