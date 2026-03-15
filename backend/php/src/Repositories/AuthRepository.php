<?php

declare(strict_types=1);

namespace App\Repositories;

use PDO;

final class AuthRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function findMerchantByLogin(string $login): ?array
    {
        $stmt = $this->pdo->prepare("
            SELECT
                u.id AS usuario_id,
                u.uuid,
                u.nome,
                u.email,
                u.telefone,
                u.whatsapp,
                u.senha_hash,
                u.tipo_usuario,
                u.status,
                dl.id AS dono_loja_id,
                l.id AS loja_id,
                l.nome AS loja_nome,
                l.slug,
                l.status_loja,
                l.modo_operacao
            FROM usuarios u
            INNER JOIN donos_loja dl ON dl.usuario_id = u.id
            LEFT JOIN lojas l ON l.dono_loja_id = dl.id AND l.deleted_at IS NULL
            WHERE (u.email = :login OR u.telefone = :login OR u.whatsapp = :login)
            LIMIT 1
        ");
        $stmt->execute(['login' => $login]);

        return $stmt->fetch() ?: null;
    }

    public function findAdminByLogin(string $login): ?array
    {
        $stmt = $this->pdo->prepare("
            SELECT
                u.id AS usuario_id,
                u.uuid,
                u.nome,
                u.email,
                u.telefone,
                u.whatsapp,
                u.senha_hash,
                u.status,
                a.id AS administrador_id,
                a.nivel_acesso
            FROM usuarios u
            INNER JOIN administradores a ON a.usuario_id = u.id
            WHERE (u.email = :login OR u.telefone = :login)
            LIMIT 1
        ");
        $stmt->execute(['login' => $login]);

        return $stmt->fetch() ?: null;
    }
}
