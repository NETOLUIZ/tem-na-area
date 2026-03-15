<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\RegistrationRepository;
use App\Support\ApiException;

final class RegistrationService
{
    public function __construct(private readonly RegistrationRepository $registrationRepository)
    {
    }

    public function createLead(array $payload, string $planCode): array
    {
        foreach (['nome_empresa', 'whatsapp', 'categoria_principal'] as $field) {
            if (!isset($payload[$field]) || $payload[$field] === '') {
                throw new ApiException('Campos obrigatorios ausentes.', 422, ['missing' => [$field]]);
            }
        }

        $plan = $this->registrationRepository->planByCode($planCode);
        if (!$plan) {
            throw new ApiException('Plano nao encontrado.', 404);
        }

        $id = $this->registrationRepository->createLead($payload, $plan);

        return [
            'id' => $id,
            'plan' => [
                'id' => $plan['id'],
                'codigo' => $plan['codigo'],
                'nome' => $plan['nome'],
            ],
            'status_solicitacao' => $plan['codigo'] === 'FREE' ? 'PENDENTE' : 'AGUARDANDO_PAGAMENTO',
        ];
    }
}
