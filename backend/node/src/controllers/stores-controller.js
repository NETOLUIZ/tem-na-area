import { sendData } from "../lib/http.js";

export class StoresController {
  constructor(commerceRepository) {
    this.commerceRepository = commerceRepository;
  }

  index = async (req, res) => {
    sendData(res, {
      stores: await this.commerceRepository.listStores({
        status: req.query.status || null,
        search: req.query.search || req.query.busca || null
      })
    });
  };
}
