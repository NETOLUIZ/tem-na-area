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
}
