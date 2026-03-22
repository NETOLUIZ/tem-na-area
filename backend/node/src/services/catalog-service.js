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
      preco: Number(payload.preco || 0),
      preco_promocional: payload.preco_promocional === null || payload.preco_promocional === undefined || payload.preco_promocional === ""
        ? null
        : Number(payload.preco_promocional),
      custo: payload.custo === null || payload.custo === undefined || payload.custo === ""
        ? null
        : Number(payload.custo),
      estoque_atual: Number(payload.estoque_atual || 0),
      estoque_minimo: Number(payload.estoque_minimo || 0),
      ordem_exibicao: Number(payload.ordem_exibicao || 0),
      peso_gramas: payload.peso_gramas === null || payload.peso_gramas === undefined || payload.peso_gramas === ""
        ? null
        : Number(payload.peso_gramas),
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
