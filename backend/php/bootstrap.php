<?php

declare(strict_types=1);

use App\Controllers\AdminController;
use App\Controllers\AuthController;
use App\Controllers\HealthController;
use App\Controllers\MerchantController;
use App\Controllers\PublicController;
use App\Http\Router;
use App\Repositories\AdminRepository;
use App\Repositories\AuthRepository;
use App\Repositories\CatalogRepository;
use App\Repositories\OrderRepository;
use App\Repositories\OptionGroupRepository;
use App\Repositories\PromotionRepository;
use App\Repositories\RegistrationRepository;
use App\Repositories\StoreRepository;
use App\Services\AdminService;
use App\Services\AuthService;
use App\Services\CatalogService;
use App\Services\OrderService;
use App\Services\RegistrationService;
use App\Support\Auth;
use App\Support\AuthToken;

spl_autoload_register(static function (string $class): void {
    $prefix = 'App\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relative = substr($class, strlen($prefix));
    $path = __DIR__ . '/src/' . str_replace('\\', '/', $relative) . '.php';

    if (is_file($path)) {
        require $path;
    }
});

$config = require __DIR__ . '/config/app.php';
$pdo = require __DIR__ . '/config/database.php';

$authToken = new AuthToken($config['app_key']);
$auth = new Auth($authToken);

$authRepository = new AuthRepository($pdo);
$storeRepository = new StoreRepository($pdo);
$catalogRepository = new CatalogRepository($pdo);
$orderRepository = new OrderRepository($pdo);
$optionGroupRepository = new OptionGroupRepository($pdo);
$promotionRepository = new PromotionRepository($pdo);
$registrationRepository = new RegistrationRepository($pdo);
$adminRepository = new AdminRepository($pdo);

$authService = new AuthService($authRepository, $authToken);
$catalogService = new CatalogService($catalogRepository);
$orderService = new OrderService($pdo, $storeRepository, $catalogRepository, $orderRepository);
$registrationService = new RegistrationService($registrationRepository);
$adminService = new AdminService($adminRepository, $storeRepository);

$healthController = new HealthController();
$authController = new AuthController($authService);
$publicController = new PublicController($storeRepository, $catalogRepository, $optionGroupRepository, $registrationService, $orderService);
$merchantController = new MerchantController($auth, $storeRepository, $catalogRepository, $orderRepository, $optionGroupRepository, $promotionRepository, $catalogService, $orderService);
$adminController = new AdminController($auth, $adminRepository, $registrationRepository, $storeRepository, $adminService);

$router = new Router();

$register = static function (string $method, string $path, callable $handler) use ($router): void {
    $normalized = $path === '' ? '/' : $path;
    foreach ([$normalized, '/php/public/index.php' . $path] as $routePath) {
        $router->add($method, $routePath, $handler);
    }
};

$register('GET', '', static fn () => $healthController->show());
$register('GET', '/health', static fn () => $healthController->show());
$register('GET', '/api/v1/health', static fn () => $healthController->show());

$register('POST', '/api/v1/auth/merchant/login', static fn ($request) => $authController->merchantLogin($request));
$register('POST', '/api/v1/auth/admin/login', static fn ($request) => $authController->adminLogin($request));

$register('GET', '/api/v1/public/home', static fn () => $publicController->home());
$register('GET', '/api/v1/public/stores', static fn ($request) => $publicController->stores($request));
$register('GET', '/api/v1/public/stores/{slug}', static fn ($request, $params) => $publicController->store($params));
$register('GET', '/api/v1/public/stores/{slug}/products', static fn ($request, $params) => $publicController->products($params));
$register('POST', '/api/v1/public/leads/free', static fn ($request) => $publicController->freeLead($request));
$register('POST', '/api/v1/public/leads/paid', static fn ($request) => $publicController->paidSignup($request));
$register('POST', '/api/v1/public/orders', static fn ($request) => $publicController->createOrder($request));

$register('GET', '/api/v1/merchant/dashboard', static fn ($request) => $merchantController->dashboard($request));
$register('GET', '/api/v1/merchant/orders', static fn ($request) => $merchantController->orders($request));
$register('PATCH', '/api/v1/merchant/orders/{id}/status', static fn ($request, $params) => $merchantController->updateOrderStatus($request, $params));
$register('GET', '/api/v1/merchant/products', static fn ($request) => $merchantController->products($request));
$register('POST', '/api/v1/merchant/products', static fn ($request) => $merchantController->createProduct($request));
$register('PUT', '/api/v1/merchant/products/{id}', static fn ($request, $params) => $merchantController->updateProduct($request, $params));
$register('DELETE', '/api/v1/merchant/products/{id}', static fn ($request, $params) => $merchantController->deleteProduct($request, $params));
$register('GET', '/api/v1/merchant/settings', static fn ($request) => $merchantController->settings($request));
$register('PUT', '/api/v1/merchant/settings', static fn ($request) => $merchantController->updateSettings($request));
$register('GET', '/api/v1/merchant/option-groups', static fn ($request) => $merchantController->optionGroups($request));
$register('POST', '/api/v1/merchant/option-groups', static fn ($request) => $merchantController->createOptionGroup($request));
$register('PUT', '/api/v1/merchant/option-groups/{id}', static fn ($request, $params) => $merchantController->updateOptionGroup($request, $params));
$register('DELETE', '/api/v1/merchant/option-groups/{id}', static fn ($request, $params) => $merchantController->deleteOptionGroup($request, $params));
$register('GET', '/api/v1/merchant/promotions', static fn ($request) => $merchantController->promotions($request));
$register('POST', '/api/v1/merchant/promotions', static fn ($request) => $merchantController->createPromotion($request));
$register('PUT', '/api/v1/merchant/promotions/{id}', static fn ($request, $params) => $merchantController->updatePromotion($request, $params));
$register('DELETE', '/api/v1/merchant/promotions/{id}', static fn ($request, $params) => $merchantController->deletePromotion($request, $params));

$register('GET', '/api/v1/admin/dashboard', static fn ($request) => $adminController->dashboard($request));
$register('GET', '/api/v1/admin/stores', static fn ($request) => $adminController->stores($request));
$register('PATCH', '/api/v1/admin/stores/{id}/status', static fn ($request, $params) => $adminController->updateStoreStatus($request, $params));
$register('GET', '/api/v1/admin/logs', static fn ($request) => $adminController->logs($request));
$register('GET', '/api/v1/admin/leads', static fn ($request) => $adminController->leads($request));
$register('PATCH', '/api/v1/admin/leads/{id}/approve', static fn ($request, $params) => $adminController->approveLead($request, $params));

return [
    'config' => $config,
    'pdo' => $pdo,
    'router' => $router,
    'controllers' => [
        'health' => $healthController,
        'auth' => $authController,
        'public' => $publicController,
        'merchant' => $merchantController,
        'admin' => $adminController,
    ],
];
