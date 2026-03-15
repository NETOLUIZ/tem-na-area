<?php

declare(strict_types=1);

namespace App\Repositories;

use PDO;

final class OptionGroupRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function byStore(int $storeId): array
    {
        $groupStmt = $this->pdo->prepare("
            SELECT *
            FROM product_option_groups
            WHERE loja_id = :store_id
            ORDER BY ordem_exibicao ASC, id DESC
        ");
        $groupStmt->execute(['store_id' => $storeId]);
        $groups = $groupStmt->fetchAll();

        $itemStmt = $this->pdo->prepare("
            SELECT *
            FROM product_option_items
            WHERE group_id = :group_id
            ORDER BY ordem_exibicao ASC, id ASC
        ");
        $linkStmt = $this->pdo->prepare("
            SELECT pgl.*, p.nome AS produto_nome
            FROM product_group_links pgl
            INNER JOIN produtos p ON p.id = pgl.product_id
            WHERE pgl.group_id = :group_id
            ORDER BY pgl.ordem_exibicao ASC, pgl.id ASC
        ");

        foreach ($groups as &$group) {
            $itemStmt->execute(['group_id' => $group['id']]);
            $group['options'] = $itemStmt->fetchAll();

            $linkStmt->execute(['group_id' => $group['id']]);
            $group['links'] = $linkStmt->fetchAll();
        }

        return $groups;
    }

    public function upsert(int $storeId, array $payload, ?int $groupId = null): int
    {
        $params = [
            'store_id' => $storeId,
            'nome' => $payload['name'],
            'descricao' => $payload['description'] ?? null,
            'tipo' => $payload['type'] ?? 'single',
            'obrigatorio' => $payload['required'] ?? 0,
            'minimo_selecoes' => $payload['min_select'] ?? 0,
            'maximo_selecoes' => $payload['max_select'] ?? 1,
            'ordem_exibicao' => $payload['sort_order'] ?? 0,
            'ativo' => $payload['active'] ?? 1,
        ];

        if ($groupId) {
            $stmt = $this->pdo->prepare("
                UPDATE product_option_groups
                SET nome = :nome,
                    descricao = :descricao,
                    tipo = :tipo,
                    obrigatorio = :obrigatorio,
                    minimo_selecoes = :minimo_selecoes,
                    maximo_selecoes = :maximo_selecoes,
                    ordem_exibicao = :ordem_exibicao,
                    ativo = :ativo
                WHERE id = :id
                  AND loja_id = :store_id
            ");
            $stmt->execute($params + ['id' => $groupId]);
        } else {
            $stmt = $this->pdo->prepare("
                INSERT INTO product_option_groups (
                    loja_id, nome, descricao, tipo, obrigatorio,
                    minimo_selecoes, maximo_selecoes, ordem_exibicao, ativo
                ) VALUES (
                    :store_id, :nome, :descricao, :tipo, :obrigatorio,
                    :minimo_selecoes, :maximo_selecoes, :ordem_exibicao, :ativo
                )
            ");
            $stmt->execute($params);
            $groupId = (int) $this->pdo->lastInsertId();
        }

        $deleteItemsStmt = $this->pdo->prepare('DELETE FROM product_option_items WHERE group_id = :group_id');
        $deleteItemsStmt->execute(['group_id' => $groupId]);

        $deleteLinksStmt = $this->pdo->prepare('DELETE FROM product_group_links WHERE group_id = :group_id');
        $deleteLinksStmt->execute(['group_id' => $groupId]);

        $itemStmt = $this->pdo->prepare("
            INSERT INTO product_option_items (group_id, nome, descricao, preco_adicional, ordem_exibicao, ativo)
            VALUES (:group_id, :nome, :descricao, :preco_adicional, :ordem_exibicao, :ativo)
        ");

        foreach ($payload['options'] ?? [] as $option) {
            $itemStmt->execute([
                'group_id' => $groupId,
                'nome' => $option['name'],
                'descricao' => $option['description'] ?? null,
                'preco_adicional' => $option['price_delta'] ?? 0,
                'ordem_exibicao' => $option['sort_order'] ?? 0,
                'ativo' => $option['active'] ?? 1,
            ]);
        }

        $linkStmt = $this->pdo->prepare("
            INSERT INTO product_group_links (product_id, group_id, ordem_exibicao)
            VALUES (:product_id, :group_id, :ordem_exibicao)
        ");
        foreach ($payload['product_ids'] ?? [] as $index => $productId) {
            $linkStmt->execute([
                'product_id' => $productId,
                'group_id' => $groupId,
                'ordem_exibicao' => $index + 1,
            ]);
        }

        return $groupId;
    }

    public function delete(int $storeId, int $groupId): void
    {
        $stmt = $this->pdo->prepare("
            DELETE pog
            FROM product_option_groups pog
            WHERE pog.id = :id
              AND pog.loja_id = :store_id
        ");
        $stmt->execute([
            'id' => $groupId,
            'store_id' => $storeId,
        ]);
    }
}
