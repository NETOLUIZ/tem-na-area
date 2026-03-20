import { ApiError } from "../lib/api-error.js";
import { runInTransaction } from "../lib/transactions.js";

export class RegistrationService {
  constructor(registrationRepository, pool) {
    this.registrationRepository = registrationRepository;
    this.pool = pool;
  }

  async createLead(payload, planCode) {
    for (const field of ["nome_empresa", "whatsapp", "categoria_principal"]) {
      if (payload[field] === undefined || payload[field] === "") {
        throw new ApiError("Campos obrigatorios ausentes.", 422, { missing: [field] });
      }
    }

    const plan = await this.registrationRepository.planByCode(planCode);
    if (!plan) {
      throw new ApiError("Plano nao encontrado.", 404);
    }

    if (plan.codigo === "PRO") {
      for (const field of ["telefone", "senha"]) {
        if (payload[field] === undefined || payload[field] === "") {
          throw new ApiError("Campos obrigatorios ausentes para o plano pago.", 422, { missing: [field] });
        }
      }
    }

    if (plan.codigo === "PRO" && String(payload.status_pagamento || "").toUpperCase() === "APROVADO") {
      const result = await runInTransaction(this.pool, async (connection) =>
        this.registrationRepository.createPaidLeadAndActivate(connection, payload, plan)
      );

      return {
        id: result.lead_id,
        store_id: result.store_id,
        user_id: result.user_id,
        slug: result.slug,
        plan: {
          id: plan.id,
          codigo: plan.codigo,
          nome: plan.nome
        },
        status_solicitacao: "APROVADA",
        status_pagamento: "APROVADO"
      };
    }

    const id = await this.registrationRepository.createLead(payload, plan);
    return {
      id,
      plan: {
        id: plan.id,
        codigo: plan.codigo,
        nome: plan.nome
      },
      status_solicitacao: plan.codigo === "FREE" ? "PENDENTE" : "AGUARDANDO_PAGAMENTO",
      status_pagamento: plan.codigo === "FREE" ? "NAO_APLICAVEL" : "PENDENTE"
    };
  }
}
