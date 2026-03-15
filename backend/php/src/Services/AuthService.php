<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\AuthRepository;
use App\Support\ApiException;
use App\Support\AuthToken;

final class AuthService
{
    public function __construct(
        private readonly AuthRepository $authRepository,
        private readonly AuthToken $token
    ) {
    }

    public function merchantLogin(string $login, string $password): array
    {
        $user = $this->authRepository->findMerchantByLogin($login);
        if (!$user || !$this->verifyPassword($password, (string) $user['senha_hash'])) {
            throw new ApiException('Login ou senha invalidos.', 401);
        }
        if ($user['status'] !== 'ATIVO') {
            throw new ApiException('Usuario sem acesso liberado.', 403, ['status' => $user['status']]);
        }

        return [
            'token' => $this->token->encode([
                'sub' => (int) $user['usuario_id'],
                'role' => 'merchant',
                'store_id' => $user['loja_id'] ? (int) $user['loja_id'] : null,
                'exp' => time() + 60 * 60 * 12,
            ]),
            'user' => [
                'id' => (int) $user['usuario_id'],
                'nome' => $user['nome'],
                'email' => $user['email'],
                'telefone' => $user['telefone'],
                'whatsapp' => $user['whatsapp'],
            ],
            'store' => [
                'id' => $user['loja_id'] ? (int) $user['loja_id'] : null,
                'nome' => $user['loja_nome'],
                'slug' => $user['slug'],
                'status_loja' => $user['status_loja'],
                'modo_operacao' => $user['modo_operacao'],
            ],
        ];
    }

    public function adminLogin(string $login, string $password): array
    {
        $user = $this->authRepository->findAdminByLogin($login);
        if (!$user || !$this->verifyPassword($password, (string) $user['senha_hash'])) {
            throw new ApiException('Login ou senha invalidos.', 401);
        }
        if ($user['status'] !== 'ATIVO') {
            throw new ApiException('Administrador sem acesso liberado.', 403, ['status' => $user['status']]);
        }

        return [
            'token' => $this->token->encode([
                'sub' => (int) $user['usuario_id'],
                'admin_id' => (int) $user['administrador_id'],
                'role' => 'admin',
                'access_level' => $user['nivel_acesso'],
                'exp' => time() + 60 * 60 * 12,
            ]),
            'user' => [
                'id' => (int) $user['usuario_id'],
                'nome' => $user['nome'],
                'email' => $user['email'],
                'telefone' => $user['telefone'],
            ],
            'admin' => [
                'id' => (int) $user['administrador_id'],
                'nivel_acesso' => $user['nivel_acesso'],
            ],
        ];
    }

    private function verifyPassword(string $plainPassword, string $storedHash): bool
    {
        if ($storedHash === '') {
            return false;
        }

        if (strlen($storedHash) === 64 && ctype_xdigit($storedHash)) {
            return hash('sha256', $plainPassword) === strtolower($storedHash);
        }

        return password_verify($plainPassword, $storedHash);
    }
}
