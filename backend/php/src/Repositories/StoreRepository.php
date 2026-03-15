<?php

declare(strict_types=1);

namespace App\Repositories;

use PDO;

final class StoreRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function findPlans(): array
    {
        $stmt = $this->pdo->query("
            SELECT id, codigo, nome, descricao, tipo_exibicao, preco_mensal, permite_cardapio,
                   permite_produtos, permite_pedidos, permite_relatorios, limite_produtos, limite_banners
            FROM planos
            WHERE ativo = 1
            ORDER BY preco_mensal ASC, nome ASC
        ");

        return $stmt->fetchAll();
    }

    public function homeCards(): array
    {
        $stmt = $this->pdo->query("
            SELECT
                ch.id,
                ch.titulo_exibicao,
                ch.subtitulo_exibicao,
                ch.descricao_curta,
                ch.imagem_url,
                ch.botao_label,
                ch.link_destino,
                ch.tipo_card,
                ch.ordem_exibicao,
                l.id AS loja_id,
                l.nome AS loja_nome,
                l.slug,
                l.categoria_principal,
                l.status_loja,
                l.logo_url,
                l.whatsapp
            FROM cards_home ch
            INNER JOIN lojas l ON l.id = ch.loja_id
            WHERE ch.ativo = 1
              AND l.deleted_at IS NULL
              AND (ch.data_inicio IS NULL OR ch.data_inicio <= NOW())
              AND (ch.data_fim IS NULL OR ch.data_fim >= NOW())
            ORDER BY ch.ordem_exibicao ASC, ch.id DESC
        ");

        return $stmt->fetchAll();
    }

    public function activeStores(?string $category = null, ?string $search = null): array
    {
        $sql = "
            SELECT
                l.id,
                l.uuid,
                l.nome,
                l.slug,
                l.categoria_principal,
                l.descricao_curta,
                l.whatsapp,
                l.telefone,
                l.logo_url,
                l.capa_url,
                l.endereco_cidade,
                l.endereco_estado,
                l.horario_funcionamento,
                l.modo_operacao,
                l.status_loja,
                c.taxa_entrega_padrao,
                c.pedido_minimo,
                c.tempo_medio_preparo_minutos
            FROM lojas l
            LEFT JOIN configuracoes_loja c ON c.loja_id = l.id
            WHERE l.status_loja = 'ATIVA'
              AND l.deleted_at IS NULL
        ";

        $params = [];
        if ($category) {
            $sql .= ' AND l.categoria_principal = :category';
            $params['category'] = $category;
        }
        if ($search) {
            $sql .= ' AND (l.nome LIKE :search OR l.descricao_curta LIKE :search OR l.categoria_principal LIKE :search)';
            $params['search'] = '%' . $search . '%';
        }

        $sql .= ' ORDER BY l.destaque_home DESC, l.nome ASC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    public function findStoreBySlug(string $slug): ?array
    {
        $stmt = $this->pdo->prepare("
            SELECT
                l.*,
                c.cor_primaria,
                c.cor_secundaria,
                c.taxa_entrega_padrao,
                c.pedido_minimo,
                c.tempo_medio_preparo_minutos,
                c.tempo_medio_entrega_minutos,
                c.aceita_retirada,
                c.aceita_entrega,
                c.exibir_produtos_esgotados,
                c.exibir_whatsapp,
                c.mensagem_boas_vindas,
                c.politica_troca,
                c.politica_entrega,
                c.seo_title,
                c.seo_description
            FROM lojas l
            LEFT JOIN configuracoes_loja c ON c.loja_id = l.id
            WHERE l.slug = :slug
              AND l.deleted_at IS NULL
            LIMIT 1
        ");
        $stmt->execute(['slug' => $slug]);

        return $stmt->fetch() ?: null;
    }

    public function merchantSettings(int $storeId): ?array
    {
        $stmt = $this->pdo->prepare("
            SELECT
                l.*,
                c.id AS configuracao_id,
                c.cor_primaria,
                c.cor_secundaria,
                c.taxa_entrega_padrao,
                c.pedido_minimo,
                c.tempo_medio_preparo_minutos,
                c.tempo_medio_entrega_minutos,
                c.aceita_retirada,
                c.aceita_entrega,
                c.exibir_produtos_esgotados,
                c.exibir_whatsapp,
                c.mensagem_boas_vindas,
                c.politica_troca,
                c.politica_entrega,
                c.seo_title,
                c.seo_description
            FROM lojas l
            LEFT JOIN configuracoes_loja c ON c.loja_id = l.id
            WHERE l.id = :store_id
              AND l.deleted_at IS NULL
            LIMIT 1
        ");
        $stmt->execute(['store_id' => $storeId]);

        return $stmt->fetch() ?: null;
    }

    public function merchantDashboard(int $storeId): array
    {
        $store = $this->merchantSettings($storeId);

        $summaryStmt = $this->pdo->prepare("
            SELECT
                COUNT(*) AS total_pedidos,
                SUM(CASE WHEN status_pedido IN ('NOVO', 'ACEITO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA') THEN 1 ELSE 0 END) AS pedidos_abertos,
                SUM(CASE WHEN status_pedido = 'CONCLUIDO' THEN 1 ELSE 0 END) AS pedidos_concluidos,
                SUM(CASE WHEN status_pedido IN ('CANCELADO', 'RECUSADO') THEN 1 ELSE 0 END) AS pedidos_cancelados,
                COALESCE(SUM(total), 0) AS faturamento_total
            FROM pedidos
            WHERE loja_id = :store_id
        ");
        $summaryStmt->execute(['store_id' => $storeId]);

        $productStmt = $this->pdo->prepare("
            SELECT
                COUNT(*) AS total_produtos,
                SUM(CASE WHEN status_produto = 'ATIVO' THEN 1 ELSE 0 END) AS produtos_ativos,
                SUM(CASE WHEN status_produto = 'ESGOTADO' THEN 1 ELSE 0 END) AS produtos_esgotados
            FROM produtos
            WHERE loja_id = :store_id
              AND deleted_at IS NULL
        ");
        $productStmt->execute(['store_id' => $storeId]);

        $metricStmt = $this->pdo->prepare("
            SELECT *
            FROM metricas
            WHERE loja_id = :store_id
            ORDER BY data_referencia DESC
            LIMIT 7
        ");
        $metricStmt->execute(['store_id' => $storeId]);

        return [
            'store' => $store,
            'summary' => $summaryStmt->fetch(),
            'products' => $productStmt->fetch(),
            'metrics' => $metricStmt->fetchAll(),
        ];
    }

    public function adminStores(?string $status = null): array
    {
        $sql = "
            SELECT
                l.id,
                l.nome,
                l.slug,
                l.categoria_principal,
                l.modo_operacao,
                l.status_loja,
                l.destaque_home,
                l.aceita_pedidos,
                l.created_at,
                u.nome AS responsavel_nome,
                u.email AS responsavel_email,
                u.telefone AS responsavel_telefone,
                p.nome AS plano_nome,
                p.codigo AS plano_codigo,
                s.status_solicitacao,
                s.status_pagamento
            FROM lojas l
            INNER JOIN donos_loja dl ON dl.id = l.dono_loja_id
            INNER JOIN usuarios u ON u.id = dl.usuario_id
            INNER JOIN planos p ON p.id = l.plano_id
            LEFT JOIN solicitacoes_cadastro s ON s.id = l.solicitacao_cadastro_id
            WHERE l.deleted_at IS NULL
        ";

        $params = [];
        if ($status) {
            $sql .= ' AND l.status_loja = :status';
            $params['status'] = $status;
        }

        $sql .= ' ORDER BY l.created_at DESC, l.id DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    public function updateStoreStatus(int $storeId, string $status, ?int $adminId, ?string $reason): void
    {
        $stmt = $this->pdo->prepare("
            UPDATE lojas
            SET status_loja = :status,
                aprovado_por_admin_id = CASE WHEN :status = 'ATIVA' THEN :admin_id ELSE aprovado_por_admin_id END,
                aprovado_em = CASE WHEN :status = 'ATIVA' THEN NOW() ELSE aprovado_em END,
                bloqueado_em = CASE WHEN :status IN ('BLOQUEADA', 'SUSPENSA') THEN NOW() ELSE NULL END,
                motivo_status = :reason
            WHERE id = :store_id
        ");
        $stmt->execute([
            'status' => $status,
            'admin_id' => $adminId,
            'reason' => $reason,
            'store_id' => $storeId,
        ]);
    }

    public function upsertSettings(int $storeId, array $payload): void
    {
        $existsStmt = $this->pdo->prepare('SELECT id FROM configuracoes_loja WHERE loja_id = :store_id LIMIT 1');
        $existsStmt->execute(['store_id' => $storeId]);
        $configId = $existsStmt->fetchColumn();

        if ($configId) {
            $stmt = $this->pdo->prepare("
                UPDATE configuracoes_loja
                SET cor_primaria = :cor_primaria,
                    cor_secundaria = :cor_secundaria,
                    taxa_entrega_padrao = :taxa_entrega_padrao,
                    pedido_minimo = :pedido_minimo,
                    tempo_medio_preparo_minutos = :tempo_medio_preparo_minutos,
                    tempo_medio_entrega_minutos = :tempo_medio_entrega_minutos,
                    aceita_retirada = :aceita_retirada,
                    aceita_entrega = :aceita_entrega,
                    exibir_produtos_esgotados = :exibir_produtos_esgotados,
                    exibir_whatsapp = :exibir_whatsapp,
                    mensagem_boas_vindas = :mensagem_boas_vindas,
                    politica_troca = :politica_troca,
                    politica_entrega = :politica_entrega,
                    seo_title = :seo_title,
                    seo_description = :seo_description
                WHERE loja_id = :store_id
            ");
        } else {
            $stmt = $this->pdo->prepare("
                INSERT INTO configuracoes_loja (
                    loja_id, cor_primaria, cor_secundaria, taxa_entrega_padrao, pedido_minimo,
                    tempo_medio_preparo_minutos, tempo_medio_entrega_minutos, aceita_retirada, aceita_entrega,
                    exibir_produtos_esgotados, exibir_whatsapp, mensagem_boas_vindas, politica_troca,
                    politica_entrega, seo_title, seo_description
                ) VALUES (
                    :store_id, :cor_primaria, :cor_secundaria, :taxa_entrega_padrao, :pedido_minimo,
                    :tempo_medio_preparo_minutos, :tempo_medio_entrega_minutos, :aceita_retirada, :aceita_entrega,
                    :exibir_produtos_esgotados, :exibir_whatsapp, :mensagem_boas_vindas, :politica_troca,
                    :politica_entrega, :seo_title, :seo_description
                )
            ");
        }

        $stmt->execute([
            'store_id' => $storeId,
            'cor_primaria' => $payload['cor_primaria'] ?? null,
            'cor_secundaria' => $payload['cor_secundaria'] ?? null,
            'taxa_entrega_padrao' => $payload['taxa_entrega_padrao'] ?? 0,
            'pedido_minimo' => $payload['pedido_minimo'] ?? 0,
            'tempo_medio_preparo_minutos' => $payload['tempo_medio_preparo_minutos'] ?? null,
            'tempo_medio_entrega_minutos' => $payload['tempo_medio_entrega_minutos'] ?? null,
            'aceita_retirada' => $payload['aceita_retirada'] ?? 1,
            'aceita_entrega' => $payload['aceita_entrega'] ?? 1,
            'exibir_produtos_esgotados' => $payload['exibir_produtos_esgotados'] ?? 0,
            'exibir_whatsapp' => $payload['exibir_whatsapp'] ?? 1,
            'mensagem_boas_vindas' => $payload['mensagem_boas_vindas'] ?? null,
            'politica_troca' => $payload['politica_troca'] ?? null,
            'politica_entrega' => $payload['politica_entrega'] ?? null,
            'seo_title' => $payload['seo_title'] ?? null,
            'seo_description' => $payload['seo_description'] ?? null,
        ]);

        $storeStmt = $this->pdo->prepare("
            UPDATE lojas
            SET whatsapp = :whatsapp,
                telefone = :telefone,
                email_contato = :email_contato,
                descricao_curta = :descricao_curta,
                descricao_completa = :descricao_completa,
                logo_url = :logo_url,
                capa_url = :capa_url,
                horario_funcionamento = :horario_funcionamento
            WHERE id = :store_id
        ");
        $storeStmt->execute([
            'store_id' => $storeId,
            'whatsapp' => $payload['whatsapp'] ?? null,
            'telefone' => $payload['telefone'] ?? null,
            'email_contato' => $payload['email_contato'] ?? null,
            'descricao_curta' => $payload['descricao_curta'] ?? null,
            'descricao_completa' => $payload['descricao_completa'] ?? null,
            'logo_url' => $payload['logo_url'] ?? null,
            'capa_url' => $payload['capa_url'] ?? null,
            'horario_funcionamento' => $payload['horario_funcionamento'] ?? null,
        ]);
    }
}
