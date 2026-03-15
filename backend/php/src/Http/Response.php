<?php

declare(strict_types=1);

namespace App\Http;

use App\Support\Json;

final class Response
{
    public static function json(array $payload, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo Json::encode($payload);
    }

    public static function ok(array $data = [], int $status = 200): void
    {
        self::json(['ok' => true, 'data' => $data], $status);
    }

    public static function error(string $message, int $status = 400, array $details = []): void
    {
        self::json(
            [
                'ok' => false,
                'error' => [
                    'message' => $message,
                    'details' => $details,
                ],
            ],
            $status
        );
    }
}
