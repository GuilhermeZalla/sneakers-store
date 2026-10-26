<?php

test('API root returns a successful JSON response', function () {
    $this->getJson(route('home'))->assertOk()->assertJsonPath('api', '/api/v1');
});
