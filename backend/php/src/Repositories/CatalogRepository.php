<?php

declare(strict_types=1);

namespace App\Repositories;

use PDO;

final class CatalogRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function productsByStore(int $storeId, bool $onlyActive = false): array
    {
        $sql = "
            SELECT
                p.*,
                c.nome AS categoria_nome,
                ca.nome AS cardapio_nome
            FROM produtos p
            LEFT JOIN categorias c ON c.id = p.categoria_id
            LEFT JOIN cardapios ca ON ca.id = p.cardapio_id
            WHERE p.loja_id = :store_id
              AND p.deleted_at IS NULL
        ";

        if ($onlyActive) {
            $sql .= " AND p.status_produto = 'ATIVO'";
        }

        $sql .= ' ORDER BY c.ordem_exibicao ASC, p.nome ASC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['store_id' => $storeId]);

        return $stmt->fetchAll();
    }

    public function findProduct(int $storeId, int $productId): ?array
    {
        $stmt = $this->pdo->prepare("
            SELECT *
            FROM produtos
            WHERE id = :product_id
              AND loja_id = :store_id
              AND deleted_at IS NULL
            LIMIT 1
        ");
        $stmt->execute([
            'store_id' => $storeId,
            'product_id' => $productId,
        ]);

        return $stmt->fetch() ?: null;
    }

    public function upsertProduct(int $storeId, array $payload, ?int $productId = null): int
    {
        $params = [
            'store_id' => $storeId,
            'categoria_id' => $payload['categoria_id'] ?? null,
            'cardapio_id' => $payload['cardapio_id'] ?? null,
            'sku' => $payload['sku'] ?? null,
            'nome' => $payload['nome'],
            'slug' => $payload['slug'],
            'descricao' => $payload['descricao'] ?? null,
            'descricao_curta' => $payload['descricao_curta'] ?? null,
            'imagem_url' => $payload['imagem_url'] ?? null,
            'preco' => $payload['preco'],
            'preco_promocional' => $payload['preco_promocional'] ?? null,
            'custo' => $payload['custo'] ?? null,
            'estoque_atual' => $payload['estoque_atual'] ?? 0,
            'estoque_minimo' => $payload['estoque_minimo'] ?? 0,
            'controla_estoque' => $payload['controla_estoque'] ?? 1,
            'permite_venda_sem_estoque' => $payload['permite_venda_sem_estoque'] ?? 0,
            'destaque_home' => $payload['destaque_home'] ?? 0,
            'peso_gramas' => $payload['peso_gramas'] ?? null,
            'status_produto' => $payload['status_produto'] ?? 'ATIVO',
        ];

        if ($productId) {
            $stmt = $this->pdo->prepare("
                UPDATE produtos
                SET categoria_id = :categoria_id,
                    cardapio_id = :cardapio_id,
                    sku = :sku,
                    nome = :nome,
                    slug = :slug,
                    descricao = :descricao,
                    descricao_curta = :descricao_curta,
                    imagem_url = :imagem_url,
                    preco = :preco,
                    preco_promocional = :preco_promocional,
                    custo = :custo,
                    estoque_atual = :estoque_atual,
                    estoque_minimo = :estoque_minimo,
                    controla_estoque = :controla_estoque,
                    permite_venda_sem_estoque = :permite_venda_sem_estoque,
                    destaque_home = :destaque_home,
                    peso_gramas = :peso_gramas,
                    status_produto = :status_produto
                WHERE id = :id AND loja_id = :store_id
            ");
            $stmt->execute($params + ['id' => $productId]);

            return $productId;
        }

        $stmt = $this->pdo->prepare("
            INSERT INTO produtos (
                loja_id, categoria_id, cardapio_id, sku, nome, slug, descricao, descricao_curta, imagem_url,
                preco, preco_promocional, custo, estoque_atual, estoque_minimo, controla_estoque,
                permite_venda_sem_estoque, destaque_home, peso_gramas, status_produto
            ) VALUES (
                :store_id, :categoria_id, :cardapio_id, :sku, :nome, :slug, :descricao, :descricao_curta, :imagem_url,
                :preco, :preco_promocional, :custo, :estoque_atual, :estoque_minimo, :controla_estoque,
                :permite_venda_sem_estoque, :destaque_home, :peso_gramas, :status_produto
            )
        ");
        $stmt->execute($params);

        return (int) $this->pdo->lastInsertId();
    }

    public function deleteProduct(int $storeId, int $productId): void
    {
        $stmt = $this->pdo->prepare("
            UPDATE produtos
            SET deleted_at = NOW(), status_produto = 'INATIVO'
            WHERE id = :product_id AND loja_id = :store_id
        ");
        $stmt->execute([
            'product_id' => $productId,
            'store_id' => $storeId,
        ]);
    }
}
