import { ApiError } from "../lib/api-error.js";
import { slugify } from "../lib/strings.js";

export class CatalogService {
  constructor(catalogRepository) {
    this.catalogRepository = catalogRepository;
  }

  async saveProduct(storeId, payload, productId = null) {
    for (const field of ["nome", "preco"]) {
      if (payload[field] === undefined || payload[field] === "") {
        throw new ApiError("Campos obrigatorios ausentes.", 422, { missing: [field] });
      }
    }

    const normalized = {
      ...payload,
      slug: payload.slug && payload.slug !== "" ? slugify(payload.slug) : slugify(payload.nome)
    };

    const savedId = await this.catalogRepository.upsertProduct(storeId, normalized, productId);
    const product = await this.catalogRepository.findProduct(storeId, savedId);

    if (!product) {
      throw new ApiError("Produto nao encontrado apos salvar.", 500);
    }

    return product;
  }
}
