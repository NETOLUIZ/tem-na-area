<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Support\Str;
use PDO;

final class RegistrationRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function planByCode(string $code): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM planos WHERE codigo = :code AND ativo = 1 LIMIT 1');
        $stmt->execute(['code' => $code]);

        return $stmt->fetch() ?: null;
    }

    public function createLead(array $payload, array $plan): int
    {
        $stmt = $this->pdo->prepare("
            INSERT INTO solicitacoes_cadastro (
                protocolo, tipo_solicitacao, nome_empresa, nome_responsavel, email, telefone, whatsapp,
                cpf_cnpj, categoria_principal, descricao_resumida, cidade, estado, endereco_logradouro,
                endereco_numero, endereco_bairro, endereco_complemento, cep, horario_funcionamento,
                logo_url, capa_url, observacoes, plano_id, status_solicitacao, status_pagamento
            ) VALUES (
                :protocolo, :tipo_solicitacao, :nome_empresa, :nome_responsavel, :email, :telefone, :whatsapp,
                :cpf_cnpj, :categoria_principal, :descricao_resumida, :cidade, :estado, :endereco_logradouro,
                :endereco_numero, :endereco_bairro, :endereco_complemento, :cep, :horario_funcionamento,
                :logo_url, :capa_url, :observacoes, :plano_id, :status_solicitacao, :status_pagamento
            )
        ");
        $stmt->execute([
            'protocolo' => Str::protocol('SOL'),
            'tipo_solicitacao' => $plan['codigo'] === 'FREE' ? 'LOJA_GRATIS' : 'LOJA_PAGA',
            'nome_empresa' => $payload['nome_empresa'],
            'nome_responsavel' => $payload['nome_responsavel'] ?? null,
            'email' => $payload['email'] ?? null,
            'telefone' => $payload['telefone'] ?? null,
            'whatsapp' => $payload['whatsapp'],
            'cpf_cnpj' => $payload['cpf_cnpj'] ?? null,
            'categoria_principal' => $payload['categoria_principal'],
            'descricao_resumida' => $payload['descricao_resumida'] ?? null,
            'cidade' => $payload['cidade'] ?? null,
            'estado' => $payload['estado'] ?? null,
            'endereco_logradouro' => $payload['endereco_logradouro'] ?? null,
            'endereco_numero' => $payload['endereco_numero'] ?? null,
            'endereco_bairro' => $payload['endereco_bairro'] ?? null,
            'endereco_complemento' => $payload['endereco_complemento'] ?? null,
            'cep' => $payload['cep'] ?? null,
            'horario_funcionamento' => $payload['horario_funcionamento'] ?? null,
            'logo_url' => $payload['logo_url'] ?? null,
            'capa_url' => $payload['capa_url'] ?? null,
            'observacoes' => $payload['observacoes'] ?? null,
            'plano_id' => $plan['id'],
            'status_solicitacao' => $plan['codigo'] === 'FREE' ? 'PENDENTE' : 'AGUARDANDO_PAGAMENTO',
            'status_pagamento' => $plan['codigo'] === 'FREE' ? 'NAO_APLICAVEL' : 'PENDENTE',
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    public function freeLeads(): array
    {
        $stmt = $this->pdo->query("
            SELECT sc.*, p.codigo AS plano_codigo
            FROM solicitacoes_cadastro sc
            INNER JOIN planos p ON p.id = sc.plano_id
            WHERE p.codigo = 'FREE'
            ORDER BY sc.created_at DESC, sc.id DESC
        ");

        return $stmt->fetchAll();
    }

    public function findLead(int $leadId): ?array
    {
        $stmt = $this->pdo->prepare("
            SELECT sc.*, p.codigo AS plano_codigo
            FROM solicitacoes_cadastro sc
            INNER JOIN planos p ON p.id = sc.plano_id
            WHERE sc.id = :id
            LIMIT 1
        ");
        $stmt->execute(['id' => $leadId]);

        return $stmt->fetch() ?: null;
    }

    public function approveFreeLead(int $leadId, int $adminId): ?array
    {
        $lead = $this->findLead($leadId);
        if (!$lead || $lead['plano_codigo'] !== 'FREE') {
            return null;
        }

        $ownerUserId = null;
        if (!empty($lead['usuario_id'])) {
            $ownerUserId = (int) $lead['usuario_id'];
        } else {
            $userStmt = $this->pdo->prepare("
                INSERT INTO usuarios (
                    uuid, nome, email, telefone, whatsapp, senha_hash, tipo_usuario, status,
                    email_verificado_em, telefone_verificado_em
                ) VALUES (
                    :uuid, :nome, :email, :telefone, :whatsapp, :senha_hash, 'DONO_LOJA', 'ATIVO',
                    NOW(), NOW()
                )
            ");
            $userStmt->execute([
                'uuid' => Str::uuid(),
                'nome' => $lead['nome_responsavel'] ?: $lead['nome_empresa'],
                'email' => $lead['email'] ?: sprintf('lead-%d@temnaarea.local', $leadId),
                'telefone' => $lead['telefone'] ?: $lead['whatsapp'],
                'whatsapp' => $lead['whatsapp'],
                'senha_hash' => password_hash(Str::protocol('tmp'), PASSWORD_DEFAULT),
            ]);
            $ownerUserId = (int) $this->pdo->lastInsertId();
        }

        $ownerStmt = $this->pdo->prepare('SELECT id FROM donos_loja WHERE usuario_id = :usuario_id LIMIT 1');
        $ownerStmt->execute(['usuario_id' => $ownerUserId]);
        $ownerId = $ownerStmt->fetchColumn();

        if (!$ownerId) {
            $insertOwnerStmt = $this->pdo->prepare("
                INSERT INTO donos_loja (usuario_id, nome_fantasia, razao_social, cpf_cnpj, data_adesao)
                VALUES (:usuario_id, :nome_fantasia, :razao_social, :cpf_cnpj, NOW())
            ");
            $insertOwnerStmt->execute([
                'usuario_id' => $ownerUserId,
                'nome_fantasia' => $lead['nome_empresa'],
                'razao_social' => $lead['nome_empresa'],
                'cpf_cnpj' => $lead['cpf_cnpj'] ?: null,
            ]);
            $ownerId = (int) $this->pdo->lastInsertId();
        }

        $slugBase = Str::slug((string) $lead['nome_empresa']);
        $slug = $slugBase;
        $counter = 2;

        while ($this->slugExists($slug)) {
            $slug = $slugBase . '-' . $counter;
            $counter++;
        }

        $storeStmt = $this->pdo->prepare("
            INSERT INTO lojas (
                uuid, dono_loja_id, plano_id, solicitacao_cadastro_id, nome, slug, categoria_principal,
                descricao_curta, email_contato, telefone, whatsapp, logo_url, capa_url,
                endereco_cep, endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado,
                horario_funcionamento, modo_operacao, status_loja, destaque_home, aceita_pedidos,
                aprovado_por_admin_id, aprovado_em
            ) VALUES (
                :uuid, :dono_loja_id, :plano_id, :solicitacao_cadastro_id, :nome, :slug, :categoria_principal,
                :descricao_curta, :email_contato, :telefone, :whatsapp, :logo_url, :capa_url,
                :endereco_cep, :endereco_logradouro, :endereco_numero, :endereco_bairro, :endereco_cidade, :endereco_estado,
                :horario_funcionamento, 'WHATSAPP_ONLY', 'ATIVA', 0, 0,
                :aprovado_por_admin_id, NOW()
            )
        ");
        $storeStmt->execute([
            'uuid' => Str::uuid(),
            'dono_loja_id' => $ownerId,
            'plano_id' => $lead['plano_id'],
            'solicitacao_cadastro_id' => $leadId,
            'nome' => $lead['nome_empresa'],
            'slug' => $slug,
            'categoria_principal' => $lead['categoria_principal'],
            'descricao_curta' => $lead['descricao_resumida'] ?: 'Atendimento direto pelo WhatsApp.',
            'email_contato' => $lead['email'] ?: null,
            'telefone' => $lead['telefone'] ?: $lead['whatsapp'],
            'whatsapp' => $lead['whatsapp'],
            'logo_url' => $lead['logo_url'] ?: null,
            'capa_url' => $lead['capa_url'] ?: null,
            'endereco_cep' => $lead['cep'] ?: null,
            'endereco_logradouro' => $lead['endereco_logradouro'] ?: null,
            'endereco_numero' => $lead['endereco_numero'] ?: null,
            'endereco_bairro' => $lead['endereco_bairro'] ?: null,
            'endereco_cidade' => $lead['cidade'] ?: null,
            'endereco_estado' => $lead['estado'] ?: null,
            'horario_funcionamento' => $lead['horario_funcionamento'] ?: 'Atendimento por WhatsApp',
            'aprovado_por_admin_id' => $adminId,
        ]);
        $storeId = (int) $this->pdo->lastInsertId();

        $homeCardStmt = $this->pdo->prepare("
            INSERT INTO cards_home (
                loja_id, titulo_exibicao, subtitulo_exibicao, descricao_curta, imagem_url,
                botao_label, link_destino, tipo_card, ordem_exibicao, ativo, data_inicio
            ) VALUES (
                :loja_id, :titulo_exibicao, :subtitulo_exibicao, :descricao_curta, :imagem_url,
                'Chamar no WhatsApp', :link_destino, 'WHATSAPP', 0, 1, NOW()
            )
        ");
        $homeCardStmt->execute([
            'loja_id' => $storeId,
            'titulo_exibicao' => $lead['nome_empresa'],
            'subtitulo_exibicao' => $lead['categoria_principal'],
            'descricao_curta' => $lead['descricao_resumida'] ?: 'Atendimento local pelo WhatsApp.',
            'imagem_url' => $lead['logo_url'] ?: $lead['capa_url'],
            'link_destino' => 'https://wa.me/55' . preg_replace('/\D+/', '', (string) $lead['whatsapp']),
        ]);

        $updateLeadStmt = $this->pdo->prepare("
            UPDATE solicitacoes_cadastro
            SET usuario_id = :usuario_id,
                dono_loja_id = :dono_loja_id,
                status_solicitacao = 'APROVADA',
                analisado_por_admin_id = :admin_id,
                analisado_em = NOW()
            WHERE id = :id
        ");
        $updateLeadStmt->execute([
            'usuario_id' => $ownerUserId,
            'dono_loja_id' => $ownerId,
            'admin_id' => $adminId,
            'id' => $leadId,
        ]);

        return [
            'lead_id' => $leadId,
            'store_id' => $storeId,
            'slug' => $slug,
        ];
    }

    private function slugExists(string $slug): bool
    {
        $stmt = $this->pdo->prepare('SELECT id FROM lojas WHERE slug = :slug LIMIT 1');
        $stmt->execute(['slug' => $slug]);

        return (bool) $stmt->fetchColumn();
    }
}
