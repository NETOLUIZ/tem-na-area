<?php

declare(strict_types=1);

use App\Http\Request;
use App\Http\Response;
use App\Support\ApiException;

header('Content-Type: application/json; charset=utf-8');

try {
    $app = require dirname(__DIR__) . '/bootstrap.php';
    $result = $app['controllers']['auth']->merchantLogin(Request::capture());

    Response::json([
        'ok' => true,
        'user' => $result['user'],
        'store' => $result['store'],
        'token' => $result['token'],
    ]);
} catch (ApiException $e) {
    Response::json([
        'ok' => false,
        'message' => $e->getMessage(),
        'details' => $e->details(),
    ], $e->statusCode());
}
