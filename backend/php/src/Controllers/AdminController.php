<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Repositories\AdminRepository;
use App\Repositories\StoreRepository;
use App\Services\AdminService;
use App\Support\Auth;
use App\Support\ApiException;

final class AdminController
{
    public function __construct(
        private readonly Auth $auth,
        private readonly AdminRepository $adminRepository,
        private readonly StoreRepository $storeRepository,
        private readonly AdminService $adminService
    ) {
    }

    public function dashboard(Request $request): array
    {
        $this->auth->userWithRole($request, 'admin');

        return $this->adminRepository->dashboard();
    }

    public function stores(Request $request): array
    {
        $this->auth->userWithRole($request, 'admin');

        return [
            'stores' => $this->storeRepository->adminStores($request->query('status')),
        ];
    }

    public function updateStoreStatus(Request $request, array $params): array
    {
        $user = $this->auth->userWithRole($request, 'admin');
        $input = $request->input();
        $status = (string) ($input['status'] ?? '');
        if ($status === '') {
            throw new ApiException('Informe o status da loja.', 422);
        }

        return [
            'store' => $this->adminService->updateStoreStatus(
                (int) $params['id'],
                $status,
                isset($user['admin_id']) ? (int) $user['admin_id'] : null,
                isset($input['motivo']) ? (string) $input['motivo'] : null
            ),
        ];
    }

    public function logs(Request $request): array
    {
        $this->auth->userWithRole($request, 'admin');

        return [
            'logs' => $this->adminRepository->logs(),
        ];
    }
}
