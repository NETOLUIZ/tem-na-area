<?php

declare(strict_types=1);

use App\Http\Request;
use App\Http\Response;
use App\Support\ApiException;

header('Content-Type: application/json; charset=utf-8');

try {
    $app = require dirname(__DIR__) . '/bootstrap.php';
    $result = $app['controllers']['public']->createOrder(Request::capture());
    $order = $result['order'];

    Response::json([
        'ok' => true,
        'order' => [
            'id' => $order['id'],
            'codigo' => $order['codigo'],
            'numero_pedido_loja' => $order['numero_pedido_loja'],
            'subtotal' => (float) $order['subtotal'],
            'desconto' => (float) $order['desconto'],
            'taxa_entrega' => (float) $order['taxa_entrega'],
            'total' => (float) $order['total'],
            'status_pedido' => $order['status_pedido'],
        ],
    ], 201);
} catch (ApiException $e) {
    Response::json([
        'ok' => false,
        'message' => $e->getMessage(),
        'details' => $e->details(),
    ], $e->statusCode());
}
