import { sendData } from "../lib/http.js";
import { requireIntegerId } from "../lib/validators.js";

export class ProductsController {
  constructor(commerceRepository) {
    this.commerceRepository = commerceRepository;
  }

  index = async (req, res) => {
    const storeId = req.query.store_id ? requireIntegerId(req.query.store_id, "store_id") : null;

    sendData(res, {
      products: await this.commerceRepository.listProducts({
        storeId,
        activeOnly: req.query.active === "true"
      })
    });
  };
}
