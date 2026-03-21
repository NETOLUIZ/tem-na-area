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

    if (plan.codigo === "PRO") {
      const result = await runInTransaction(this.pool, async (connection) =>
        this.registrationRepository.createPaidLeadWithPendingAccount(connection, payload, plan)
      );

      const paymentApproved = String(payload.status_pagamento || "").toUpperCase() === "APROVADO";
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
        status_solicitacao: paymentApproved ? "EM_ANALISE" : "AGUARDANDO_PAGAMENTO",
        status_pagamento: paymentApproved ? "APROVADO" : "PENDENTE"
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
      status_solicitacao: plan.codigo === "FREE"
        ? "PENDENTE"
        : (String(payload.status_pagamento || "").toUpperCase() === "APROVADO" ? "EM_ANALISE" : "AGUARDANDO_PAGAMENTO"),
      status_pagamento: plan.codigo === "FREE"
        ? "NAO_APLICAVEL"
        : (String(payload.status_pagamento || "").toUpperCase() === "APROVADO" ? "APROVADO" : "PENDENTE")
    };
  }
}
