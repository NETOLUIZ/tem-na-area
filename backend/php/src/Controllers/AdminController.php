<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Repositories\AdminRepository;
use App\Repositories\RegistrationRepository;
use App\Repositories\StoreRepository;
use App\Services\AdminService;
use App\Support\Auth;
use App\Support\ApiException;

final class AdminController
{
    public function __construct(
        private readonly Auth $auth,
        private readonly AdminRepository $adminRepository,
        private readonly RegistrationRepository $registrationRepository,
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

    public function leads(Request $request): array
    {
        $this->auth->userWithRole($request, 'admin');

        return [
            'leads' => $this->registrationRepository->freeLeads(),
        ];
    }

    public function approveLead(Request $request, array $params): array
    {
        $user = $this->auth->userWithRole($request, 'admin');
        $result = $this->registrationRepository->approveFreeLead((int) $params['id'], (int) ($user['admin_id'] ?? 0));
        if (!$result) {
            throw new ApiException('Lead nao encontrado ou invalido.', 404);
        }

        return [
            'approval' => $result,
            'leads' => $this->registrationRepository->freeLeads(),
            'stores' => $this->storeRepository->adminStores(),
        ];
    }
}
