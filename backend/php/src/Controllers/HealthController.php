<?php

declare(strict_types=1);

namespace App\Controllers;

final class HealthController
{
    public function show(): array
    {
        return [
            'service' => 'tem-na-area-api',
            'status' => 'ok',
            'timestamp' => date(DATE_ATOM),
        ];
    }
}
