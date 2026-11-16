<?php

$json = file_get_contents(database_path('seeders/data/shipping.json'));

if ($json === false) {
    throw new RuntimeException('The shipping configuration could not be loaded.');
}

return json_decode($json, true, flags: JSON_THROW_ON_ERROR);
