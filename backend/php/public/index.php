<?php

declare(strict_types=1);

use App\Http\Request;

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$app = require dirname(__DIR__) . '/bootstrap.php';
$router = $app['router'];
$router->dispatch(Request::capture());
