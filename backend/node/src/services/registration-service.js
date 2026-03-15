import { ApiError } from "../lib/api-error.js";

export class RegistrationService {
  constructor(registrationRepository) {
    this.registrationRepository = registrationRepository;
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

    const id = await this.registrationRepository.createLead(payload, plan);
    return {
      id,
      plan: {
        id: plan.id,
        codigo: plan.codigo,
        nome: plan.nome
      },
      status_solicitacao: plan.codigo === "FREE" ? "PENDENTE" : "AGUARDANDO_PAGAMENTO"
    };
  }
}
