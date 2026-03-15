<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Repositories\CatalogRepository;
use App\Repositories\StoreRepository;
use App\Services\OrderService;
use App\Services\RegistrationService;
use App\Support\ApiException;

final class PublicController
{
    public function __construct(
        private readonly StoreRepository $storeRepository,
        private readonly CatalogRepository $catalogRepository,
        private readonly RegistrationService $registrationService,
        private readonly OrderService $orderService
    ) {
    }

    public function home(): array
    {
        return [
            'plans' => $this->storeRepository->findPlans(),
            'cards' => $this->storeRepository->homeCards(),
            'stores' => $this->storeRepository->activeStores(),
        ];
    }

    public function stores(Request $request): array
    {
        return [
            'stores' => $this->storeRepository->activeStores(
                $request->query('categoria'),
                $request->query('busca')
            ),
        ];
    }

    public function store(array $params): array
    {
        $store = $this->storeRepository->findStoreBySlug($params['slug']);
        if (!$store) {
            throw new ApiException('Loja nao encontrada.', 404);
        }

        return [
            'store' => $store,
            'products' => $this->catalogRepository->productsByStore((int) $store['id'], true),
        ];
    }

    public function products(array $params): array
    {
        return $this->store($params);
    }

    public function freeLead(Request $request): array
    {
        return $this->registrationService->createLead($request->input(), 'FREE');
    }

    public function paidSignup(Request $request): array
    {
        return $this->registrationService->createLead($request->input(), 'PRO');
    }

    public function createOrder(Request $request): array
    {
        return ['order' => $this->orderService->create($request->input())];
    }
}
