<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\CatalogRepository;
use App\Repositories\OrderRepository;
use App\Repositories\StoreRepository;
use App\Support\ApiException;
use App\Support\Str;
use PDO;
use Throwable;

final class OrderService
{
    private const ALLOWED_STATUS_FLOW = [
        'NOVO' => ['ACEITO', 'CANCELADO', 'RECUSADO'],
        'ACEITO' => ['EM_PREPARO', 'CANCELADO'],
        'EM_PREPARO' => ['SAIU_PARA_ENTREGA', 'CONCLUIDO', 'CANCELADO'],
        'SAIU_PARA_ENTREGA' => ['CONCLUIDO', 'CANCELADO'],
    ];

    public function __construct(
        private readonly PDO $pdo,
        private readonly StoreRepository $storeRepository,
        private readonly CatalogRepository $catalogRepository,
        private readonly OrderRepository $orderRepository
    ) {
    }

    public function create(array $payload): array
    {
        foreach (['store_slug', 'cliente_id', 'nome_cliente', 'telefone_cliente', 'itens'] as $field) {
            if (!isset($payload[$field]) || $payload[$field] === '' || $payload[$field] === []) {
                throw new ApiException('Campos obrigatorios ausentes.', 422, ['missing' => [$field]]);
            }
        }

        if (!is_array($payload['itens']) || count($payload['itens']) === 0) {
            throw new ApiException('Envie ao menos um item no pedido.', 422);
        }

        $store = $this->storeRepository->findStoreBySlug((string) $payload['store_slug']);
        if (!$store || $store['status_loja'] !== 'ATIVA') {
            throw new ApiException('Loja indisponivel para pedidos.', 404);
        }

        $customer = $this->orderRepository->findCustomer((int) $payload['cliente_id']);
        if (!$customer) {
            throw new ApiException('Cliente nao encontrado.', 404);
        }

        $catalog = [];
        foreach ($this->catalogRepository->productsByStore((int) $store['id'], true) as $product) {
            $catalog[(int) $product['id']] = $product;
        }

        $subtotal = 0.0;
        $items = [];
        foreach ($payload['itens'] as $item) {
            $productId = (int) ($item['produto_id'] ?? 0);
            $quantity = max(1, (int) ($item['quantidade'] ?? 1));
            $product = $catalog[$productId] ?? null;

            if (!$product) {
                throw new ApiException('Produto invalido ou indisponivel.', 422, ['produto_id' => $productId]);
            }

            $unitPrice = $product['preco_promocional'] !== null
                ? (float) $product['preco_promocional']
                : (float) $product['preco'];
            $lineSubtotal = round($unitPrice * $quantity, 2);
            $subtotal += $lineSubtotal;

            $items[] = [
                'produto_id' => $productId,
                'produto_nome' => $product['nome'],
                'sku_produto' => $product['sku'],
                'quantidade' => $quantity,
                'preco_unitario' => $unitPrice,
                'desconto_unitario' => 0,
                'subtotal' => $lineSubtotal,
                'observacoes' => $item['observacoes'] ?? null,
            ];
        }

        $discount = (float) ($payload['desconto'] ?? 0);
        $deliveryFee = (float) ($payload['taxa_entrega'] ?? $store['taxa_entrega_padrao'] ?? 0);
        $sequence = $this->orderRepository->nextStoreSequence((int) $store['id']);
        $status = 'NOVO';
        $type = (string) ($payload['tipo_entrega'] ?? 'ENTREGA');
        $total = round($subtotal - $discount + $deliveryFee, 2);

        try {
            $this->pdo->beginTransaction();

            $orderId = $this->orderRepository->createOrder([
                'codigo' => Str::orderCode($sequence),
                'loja_id' => (int) $store['id'],
                'cliente_id' => (int) $payload['cliente_id'],
                'numero_pedido_loja' => $sequence,
                'status_pedido' => $status,
                'status_pagamento' => (string) ($payload['status_pagamento'] ?? 'PENDENTE'),
                'tipo_entrega' => $type,
                'canal_venda' => (string) ($payload['canal_venda'] ?? 'SITE'),
                'nome_cliente' => (string) $payload['nome_cliente'],
                'telefone_cliente' => (string) $payload['telefone_cliente'],
                'email_cliente' => $payload['email_cliente'] ?? null,
                'cep' => $payload['cep'] ?? null,
                'logradouro' => $payload['logradouro'] ?? null,
                'numero' => $payload['numero'] ?? null,
                'complemento' => $payload['complemento'] ?? null,
                'bairro' => $payload['bairro'] ?? null,
                'cidade' => $payload['cidade'] ?? null,
                'estado' => $payload['estado'] ?? null,
                'referencia' => $payload['referencia'] ?? null,
                'observacoes_cliente' => $payload['observacoes_cliente'] ?? null,
                'subtotal' => round($subtotal, 2),
                'desconto' => round($discount, 2),
                'taxa_entrega' => round($deliveryFee, 2),
                'total' => $total,
            ], $items);

            $this->pdo->commit();
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }

            throw new ApiException('Falha ao criar pedido.', 500, ['exception' => $e->getMessage()]);
        }

        return $this->orderRepository->findOrder((int) $store['id'], $orderId) ?? [];
    }

    public function updateStatus(int $storeId, int $orderId, string $nextStatus, ?int $userId): array
    {
        $order = $this->orderRepository->findOrder($storeId, $orderId);
        if (!$order) {
            throw new ApiException('Pedido nao encontrado.', 404);
        }

        $current = (string) $order['status_pedido'];
        $allowed = self::ALLOWED_STATUS_FLOW[$current] ?? [];
        if (!in_array($nextStatus, $allowed, true) && $nextStatus !== $current) {
            throw new ApiException('Transicao de status invalida.', 422, [
                'current' => $current,
                'allowed' => $allowed,
            ]);
        }

        $this->orderRepository->updateStatus($storeId, $orderId, $nextStatus, $userId);

        return $this->orderRepository->findOrder($storeId, $orderId) ?? [];
    }
}
