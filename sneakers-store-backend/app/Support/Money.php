<?php

namespace App\Support;

use App\StoreLocale;
use Illuminate\Support\Number;
use InvalidArgumentException;
use RuntimeException;

class Money
{
    public static function format(int $cents, string $currency, StoreLocale $locale): string
    {
        if (! in_array($currency, ['USD', 'BRL'], true)) {
            throw new InvalidArgumentException('Unsupported currency.');
        }

        $formatted = Number::currency($cents / 100, in: $currency, locale: $locale->languageTag());

        if ($formatted === false) {
            throw new RuntimeException('Money could not be formatted.');
        }

        return $formatted;
    }
}
