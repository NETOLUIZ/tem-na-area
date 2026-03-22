import { ApiError } from "../lib/api-error.js";

export class AdminService {
  constructor(storeRepository) {
    this.storeRepository = storeRepository;
  }

  async updateStoreStatus(storeId, status, adminId, reason) {
    const allowed = ["ATIVA", "INATIVA", "BLOQUEADA", "SUSPENSA", "REJEITADA", "PENDENTE"];
    if (!allowed.includes(status)) {
      throw new ApiError("Status de loja invalido.", 422, { allowed });
    }

    await this.storeRepository.updateStoreStatus(storeId, status, adminId, reason);
    const stores = await this.storeRepository.adminStores();
    const store = stores.find((item) => Number(item.id) === Number(storeId));

    if (!store) {
      throw new ApiError("Loja nao encontrada apos atualizacao.", 404);
    }

    return store;
  }

  async deleteStore(storeId, adminId, reason) {
    await this.storeRepository.softDeleteStore(storeId, adminId, reason);
    return { id: Number(storeId), deleted: true };
  }
}
