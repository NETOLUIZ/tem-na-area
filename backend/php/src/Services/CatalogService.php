<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\CatalogRepository;
use App\Support\ApiException;
use App\Support\Str;

final class CatalogService
{
    public function __construct(private readonly CatalogRepository $catalogRepository)
    {
    }

    public function saveProduct(int $storeId, array $payload, ?int $productId = null): array
    {
        foreach (['nome', 'preco'] as $field) {
            if (!isset($payload[$field]) || $payload[$field] === '') {
                throw new ApiException('Campos obrigatorios ausentes.', 422, ['missing' => [$field]]);
            }
        }

        $payload['slug'] = isset($payload['slug']) && $payload['slug'] !== ''
            ? Str::slug((string) $payload['slug'])
            : Str::slug((string) $payload['nome']);

        $productId = $this->catalogRepository->upsertProduct($storeId, $payload, $productId);
        $product = $this->catalogRepository->findProduct($storeId, $productId);

        if (!$product) {
            throw new ApiException('Produto nao encontrado apos salvar.', 500);
        }

        return $product;
    }
}
