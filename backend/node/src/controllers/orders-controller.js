import { ApiError } from "../lib/api-error.js";
import { sendData } from "../lib/http.js";
import { merchantStoreId, requireFields, requireIntegerId } from "../lib/validators.js";

function resolveStoreIdFromAuth(auth, requestedStoreId = null) {
  if (auth.role === "merchant") {
    return merchantStoreId(auth);
  }

  return requestedStoreId ? requireIntegerId(requestedStoreId, "store_id") : null;
}

export class OrdersController {
  constructor(commerceRepository, orderService) {
    this.commerceRepository = commerceRepository;
    this.orderService = orderService;
  }

  index = async (req, res) => {
    const storeId = resolveStoreIdFromAuth(req.auth, req.query.store_id || null);

    sendData(res, {
      orders: await this.commerceRepository.listOrders({
        storeId,
        status: req.query.status || null,
        limit: req.query.limit || 100
      })
    });
  };

  create = async (req, res) => {
    sendData(res, { order: await this.orderService.create(req.body) }, 201);
  };

  updateStatus = async (req, res) => {
    requireFields(req.body, ["status"]);

    const orderId = requireIntegerId(req.params.id);
    const existing = await this.commerceRepository.findOrder(orderId);
    if (!existing) {
      throw new ApiError("Pedido nao encontrado.", 404);
    }

    const resolvedStoreId = req.auth.role === "merchant"
      ? merchantStoreId(req.auth)
      : Number(existing.loja_id);

    sendData(res, {
      order: await this.orderService.updateStatus(
        resolvedStoreId,
        orderId,
        req.body.status,
        Number(req.auth.sub || 0)
      )
    });
  };
}
