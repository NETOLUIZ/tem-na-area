<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Services\AuthService;
use App\Support\ApiException;

final class AuthController
{
    public function __construct(private readonly AuthService $authService)
    {
    }

    public function merchantLogin(Request $request): array
    {
        $data = $request->input();
        if (!isset($data['login'], $data['senha'])) {
            throw new ApiException('Campos obrigatorios ausentes.', 422, ['missing' => ['login', 'senha']]);
        }

        return $this->authService->merchantLogin((string) $data['login'], (string) $data['senha']);
    }

    public function adminLogin(Request $request): array
    {
        $data = $request->input();
        if (!isset($data['login'], $data['senha'])) {
            throw new ApiException('Campos obrigatorios ausentes.', 422, ['missing' => ['login', 'senha']]);
        }

        return $this->authService->adminLogin((string) $data['login'], (string) $data['senha']);
    }
}
