import { sendData } from "../lib/http.js";
import { merchantStoreId, requireIntegerId } from "../lib/validators.js";

export class PaymentsController {
  constructor(commerceRepository) {
    this.commerceRepository = commerceRepository;
  }

  index = async (req, res) => {
    const storeId = req.auth.role === "merchant"
      ? merchantStoreId(req.auth)
      : (req.query.store_id ? requireIntegerId(req.query.store_id, "store_id") : null);

    sendData(res, {
      payments: await this.commerceRepository.listPayments({
        storeId,
        status: req.query.status || null,
        limit: req.query.limit || 100
      })
    });
  };
}
