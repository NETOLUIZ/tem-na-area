<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\AdminRepository;
use App\Repositories\StoreRepository;
use App\Support\ApiException;

final class AdminService
{
    public function __construct(
        private readonly AdminRepository $adminRepository,
        private readonly StoreRepository $storeRepository
    ) {
    }

    public function updateStoreStatus(int $storeId, string $status, ?int $adminId, ?string $reason): array
    {
        $allowed = ['ATIVA', 'INATIVA', 'BLOQUEADA', 'SUSPENSA', 'REJEITADA', 'PENDENTE'];
        if (!in_array($status, $allowed, true)) {
            throw new ApiException('Status de loja invalido.', 422, ['allowed' => $allowed]);
        }

        $this->storeRepository->updateStoreStatus($storeId, $status, $adminId, $reason);

        foreach ($this->storeRepository->adminStores() as $store) {
            if ((int) $store['id'] === $storeId) {
                return $store;
            }
        }

        throw new ApiException('Loja nao encontrada apos atualizacao.', 404);
    }
}
