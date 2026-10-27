<?php

namespace App;

enum StoreLocale: string
{
    case English = 'en';
    case Portuguese = 'pt_BR';

    public function currency(): string
    {
        return $this === self::Portuguese ? 'BRL' : 'USD';
    }

    public function languageTag(): string
    {
        return $this === self::Portuguese ? 'pt-BR' : 'en-US';
    }
}
