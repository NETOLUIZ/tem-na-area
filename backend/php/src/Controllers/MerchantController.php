<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Repositories\CatalogRepository;
use App\Repositories\OrderRepository;
use App\Repositories\StoreRepository;
use App\Services\CatalogService;
use App\Services\OrderService;
use App\Support\Auth;
use App\Support\ApiException;

final class MerchantController
{
    public function __construct(
        private readonly Auth $auth,
        private readonly StoreRepository $storeRepository,
        private readonly CatalogRepository $catalogRepository,
        private readonly OrderRepository $orderRepository,
        private readonly CatalogService $catalogService,
        private readonly OrderService $orderService
    ) {
    }

    public function dashboard(Request $request): array
    {
        $user = $this->auth->userWithRole($request, 'merchant');
        $storeId = (int) ($user['store_id'] ?? 0);
        if ($storeId <= 0) {
            throw new ApiException('Usuario sem loja vinculada.', 403);
        }

        return $this->storeRepository->merchantDashboard($storeId);
    }

    public function orders(Request $request): array
    {
        $user = $this->auth->userWithRole($request, 'merchant');
        $storeId = (int) ($user['store_id'] ?? 0);

        return [
            'orders' => $this->orderRepository->ordersByStore($storeId, $request->query('status')),
        ];
    }

    public function updateOrderStatus(Request $request, array $params): array
    {
        $user = $this->auth->userWithRole($request, 'merchant');
        $storeId = (int) ($user['store_id'] ?? 0);
        $input = $request->input();
        $status = (string) ($input['status'] ?? '');

        if ($status === '') {
            throw new ApiException('Informe o novo status.', 422);
        }

        return [
            'order' => $this->orderService->updateStatus($storeId, (int) $params['id'], $status, (int) $user['sub']),
        ];
    }

    public function products(Request $request): array
    {
        $user = $this->auth->userWithRole($request, 'merchant');
        $storeId = (int) ($user['store_id'] ?? 0);

        return [
            'products' => $this->catalogRepository->productsByStore($storeId),
        ];
    }

    public function createProduct(Request $request): array
    {
        $user = $this->auth->userWithRole($request, 'merchant');
        $storeId = (int) ($user['store_id'] ?? 0);

        return [
            'product' => $this->catalogService->saveProduct($storeId, $request->input()),
        ];
    }

    public function updateProduct(Request $request, array $params): array
    {
        $user = $this->auth->userWithRole($request, 'merchant');
        $storeId = (int) ($user['store_id'] ?? 0);

        return [
            'product' => $this->catalogService->saveProduct($storeId, $request->input(), (int) $params['id']),
        ];
    }

    public function deleteProduct(Request $request, array $params): array
    {
        $user = $this->auth->userWithRole($request, 'merchant');
        $storeId = (int) ($user['store_id'] ?? 0);
        $this->catalogRepository->deleteProduct($storeId, (int) $params['id']);

        return ['deleted' => true];
    }

    public function settings(Request $request): array
    {
        $user = $this->auth->userWithRole($request, 'merchant');
        $storeId = (int) ($user['store_id'] ?? 0);

        return [
            'store' => $this->storeRepository->merchantSettings($storeId),
        ];
    }

    public function updateSettings(Request $request): array
    {
        $user = $this->auth->userWithRole($request, 'merchant');
        $storeId = (int) ($user['store_id'] ?? 0);
        $this->storeRepository->upsertSettings($storeId, $request->input());

        return [
            'store' => $this->storeRepository->merchantSettings($storeId),
        ];
    }
}
