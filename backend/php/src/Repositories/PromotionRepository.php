<?php

declare(strict_types=1);

namespace App\Repositories;

use PDO;

final class PromotionRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function byStore(int $storeId): array
    {
        $stmt = $this->pdo->prepare("
            SELECT
                ch.*,
                p.id AS produto_id,
                p.nome AS produto_nome,
                p.imagem_url AS produto_imagem_url,
                p.preco,
                p.preco_promocional
            FROM cards_home ch
            LEFT JOIN produtos p ON p.id = CAST(ch.link_destino AS UNSIGNED)
            WHERE ch.loja_id = :store_id
              AND ch.tipo_card = 'PROMOCAO'
            ORDER BY ch.created_at DESC, ch.id DESC
        ");
        $stmt->execute(['store_id' => $storeId]);

        return $stmt->fetchAll();
    }

    public function upsert(int $storeId, array $payload, ?int $promotionId = null): int
    {
        $params = [
            'store_id' => $storeId,
            'titulo_exibicao' => $payload['title'],
            'subtitulo_exibicao' => $payload['subtitle'] ?? null,
            'descricao_curta' => $payload['description'] ?? null,
            'imagem_url' => $payload['image_url'] ?? null,
            'botao_label' => $payload['button_label'] ?? 'Ver oferta',
            'link_destino' => (string) $payload['product_id'],
            'ordem_exibicao' => $payload['sort_order'] ?? 0,
            'ativo' => $payload['active'] ?? 1,
            'data_inicio' => $payload['date_start'] ?? date('Y-m-d H:i:s'),
            'data_fim' => $payload['date_end'] ?? date('Y-m-d H:i:s', time() + 172800),
        ];

        if ($promotionId) {
            $stmt = $this->pdo->prepare("
                UPDATE cards_home
                SET titulo_exibicao = :titulo_exibicao,
                    subtitulo_exibicao = :subtitulo_exibicao,
                    descricao_curta = :descricao_curta,
                    imagem_url = :imagem_url,
                    botao_label = :botao_label,
                    link_destino = :link_destino,
                    ordem_exibicao = :ordem_exibicao,
                    ativo = :ativo,
                    data_inicio = :data_inicio,
                    data_fim = :data_fim
                WHERE id = :id
                  AND loja_id = :store_id
                  AND tipo_card = 'PROMOCAO'
            ");
            $stmt->execute($params + ['id' => $promotionId]);

            return $promotionId;
        }

        $stmt = $this->pdo->prepare("
            INSERT INTO cards_home (
                loja_id, titulo_exibicao, subtitulo_exibicao, descricao_curta, imagem_url,
                botao_label, link_destino, tipo_card, ordem_exibicao, ativo, data_inicio, data_fim
            ) VALUES (
                :store_id, :titulo_exibicao, :subtitulo_exibicao, :descricao_curta, :imagem_url,
                :botao_label, :link_destino, 'PROMOCAO', :ordem_exibicao, :ativo, :data_inicio, :data_fim
            )
        ");
        $stmt->execute($params);

        return (int) $this->pdo->lastInsertId();
    }

    public function delete(int $storeId, int $promotionId): void
    {
        $stmt = $this->pdo->prepare("
            DELETE FROM cards_home
            WHERE id = :id
              AND loja_id = :store_id
              AND tipo_card = 'PROMOCAO'
        ");
        $stmt->execute([
            'id' => $promotionId,
            'store_id' => $storeId,
        ]);
    }
}
