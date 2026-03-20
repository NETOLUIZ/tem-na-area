import { sendData } from "../lib/http.js";
import { merchantStoreId, requireIntegerId } from "../lib/validators.js";

export class SalesController {
  constructor(commerceRepository) {
    this.commerceRepository = commerceRepository;
  }

  index = async (req, res) => {
    const storeId = req.auth.role === "merchant"
      ? merchantStoreId(req.auth)
      : (req.query.store_id ? requireIntegerId(req.query.store_id, "store_id") : null);

    sendData(res, {
      sales: await this.commerceRepository.listSales({
        storeId,
        status: req.query.status || null,
        dateFrom: req.query.date_from || null,
        dateTo: req.query.date_to || null,
        limit: req.query.limit || 100
      })
    });
  };
}
