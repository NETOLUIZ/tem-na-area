<?php

declare(strict_types=1);

use App\Http\Response;
use App\Support\ApiException;

header('Content-Type: application/json; charset=utf-8');

try {
    $app = require dirname(__DIR__) . '/bootstrap.php';
    $slug = isset($_GET['slug']) ? trim((string) $_GET['slug']) : '';

    if ($slug === '') {
        throw new ApiException('Informe o slug da loja.', 422);
    }

    $result = $app['controllers']['public']->products(['slug' => $slug]);

    Response::json([
        'ok' => true,
        'store' => $result['store'],
        'products' => $result['products'],
    ]);
} catch (ApiException $e) {
    Response::json([
        'ok' => false,
        'message' => $e->getMessage(),
        'details' => $e->details(),
    ], $e->statusCode());
}
