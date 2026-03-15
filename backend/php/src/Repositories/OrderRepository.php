<?php

declare(strict_types=1);

namespace App\Repositories;

use PDO;

final class OrderRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function findCustomer(int $customerId): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM clientes WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $customerId]);

        return $stmt->fetch() ?: null;
    }

    public function nextStoreSequence(int $storeId): int
    {
        $stmt = $this->pdo->prepare('SELECT COALESCE(MAX(numero_pedido_loja), 0) + 1 AS next_number FROM pedidos WHERE loja_id = :store_id');
        $stmt->execute(['store_id' => $storeId]);

        return (int) $stmt->fetchColumn();
    }

    public function createOrder(array $payload, array $items): int
    {
        $stmt = $this->pdo->prepare("
            INSERT INTO pedidos (
                codigo, carrinho_id, loja_id, cliente_id, numero_pedido_loja, status_pedido, status_pagamento,
                tipo_entrega, canal_venda, nome_cliente, telefone_cliente, email_cliente,
                endereco_entrega_cep, endereco_entrega_logradouro, endereco_entrega_numero, endereco_entrega_complemento,
                endereco_entrega_bairro, endereco_entrega_cidade, endereco_entrega_estado, referencia_entrega,
                observacoes_cliente, subtotal, desconto, taxa_entrega, total, data_confirmacao
            ) VALUES (
                :codigo, NULL, :loja_id, :cliente_id, :numero_pedido_loja, :status_pedido, :status_pagamento,
                :tipo_entrega, :canal_venda, :nome_cliente, :telefone_cliente, :email_cliente,
                :cep, :logradouro, :numero, :complemento,
                :bairro, :cidade, :estado, :referencia,
                :observacoes_cliente, :subtotal, :desconto, :taxa_entrega, :total, NOW()
            )
        ");
        $stmt->execute($payload);

        $orderId = (int) $this->pdo->lastInsertId();

        $itemStmt = $this->pdo->prepare("
            INSERT INTO itens_pedido (
                pedido_id, produto_id, produto_nome, sku_produto, quantidade, preco_unitario, desconto_unitario, subtotal, observacoes
            ) VALUES (
                :pedido_id, :produto_id, :produto_nome, :sku_produto, :quantidade, :preco_unitario, :desconto_unitario, :subtotal, :observacoes
            )
        ");

        foreach ($items as $item) {
            $itemStmt->execute($item + ['pedido_id' => $orderId]);
        }

        $this->appendHistory($orderId, null, (string) $payload['status_pedido'], null, 'Pedido criado pela API.');

        return $orderId;
    }

    public function ordersByStore(int $storeId, ?string $status = null): array
    {
        $sql = "
            SELECT *
            FROM pedidos
            WHERE loja_id = :store_id
        ";
        $params = ['store_id' => $storeId];
        if ($status) {
            $sql .= ' AND status_pedido = :status';
            $params['status'] = $status;
        }
        $sql .= ' ORDER BY created_at DESC, id DESC';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $orders = $stmt->fetchAll();

        $itemStmt = $this->pdo->prepare("
            SELECT *
            FROM itens_pedido
            WHERE pedido_id = :order_id
            ORDER BY id ASC
        ");

        foreach ($orders as &$order) {
            $itemStmt->execute(['order_id' => $order['id']]);
            $order['items'] = $itemStmt->fetchAll();
        }

        return $orders;
    }

    public function findOrder(int $storeId, int $orderId): ?array
    {
        $stmt = $this->pdo->prepare("
            SELECT *
            FROM pedidos
            WHERE loja_id = :store_id
              AND id = :order_id
            LIMIT 1
        ");
        $stmt->execute([
            'store_id' => $storeId,
            'order_id' => $orderId,
        ]);

        $order = $stmt->fetch();
        if (!$order) {
            return null;
        }

        $itemStmt = $this->pdo->prepare('SELECT * FROM itens_pedido WHERE pedido_id = :order_id ORDER BY id ASC');
        $itemStmt->execute(['order_id' => $orderId]);
        $order['items'] = $itemStmt->fetchAll();

        return $order;
    }

    public function updateStatus(int $storeId, int $orderId, string $nextStatus, ?int $userId): void
    {
        $current = $this->findOrder($storeId, $orderId);
        if (!$current) {
            return;
        }

        $stmt = $this->pdo->prepare("
            UPDATE pedidos
            SET status_pedido = :status,
                data_saida_entrega = CASE WHEN :status = 'SAIU_PARA_ENTREGA' THEN NOW() ELSE data_saida_entrega END,
                data_conclusao = CASE WHEN :status = 'CONCLUIDO' THEN NOW() ELSE data_conclusao END,
                cancelado_em = CASE WHEN :status IN ('CANCELADO', 'RECUSADO') THEN NOW() ELSE cancelado_em END
            WHERE id = :order_id
              AND loja_id = :store_id
        ");
        $stmt->execute([
            'status' => $nextStatus,
            'order_id' => $orderId,
            'store_id' => $storeId,
        ]);

        $this->appendHistory($orderId, (string) $current['status_pedido'], $nextStatus, $userId, 'Status alterado pelo painel.');
    }

    public function appendHistory(int $orderId, ?string $previous, string $next, ?int $userId, ?string $note): void
    {
        $stmt = $this->pdo->prepare("
            INSERT INTO historico_status_pedido (pedido_id, status_anterior, status_novo, alterado_por_usuario_id, observacao)
            VALUES (:pedido_id, :status_anterior, :status_novo, :alterado_por_usuario_id, :observacao)
        ");
        $stmt->execute([
            'pedido_id' => $orderId,
            'status_anterior' => $previous,
            'status_novo' => $next,
            'alterado_por_usuario_id' => $userId,
            'observacao' => $note,
        ]);
    }
}
