<?php

declare(strict_types=1);

namespace App\Support;

use App\Http\Request;

final class Auth
{
    public function __construct(private readonly AuthToken $token)
    {
    }

    public function user(Request $request): array
    {
        $header = $request->header('Authorization');
        if (!$header || !preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
            throw new ApiException('Token de acesso nao informado.', 401);
        }

        return $this->token->decode($matches[1]);
    }

    public function userWithRole(Request $request, string ...$roles): array
    {
        $user = $this->user($request);
        if ($roles && !in_array($user['role'] ?? '', $roles, true)) {
            throw new ApiException('Usuario sem permissao para este recurso.', 403);
        }

        return $user;
    }
}
