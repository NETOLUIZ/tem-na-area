export class PaymentRecordRepository {
  constructor(db) {
    this.db = db;
  }

  async createMany(connection, storeId, orderId, payments = []) {
    try {
      for (const payment of payments) {
        await connection.execute(
          `
            INSERT INTO pedido_pagamentos (
              pedido_id,
              loja_id,
              metodo_pagamento,
              status_pagamento,
              valor,
              valor_recebido,
              troco,
              referencia_externa,
              observacoes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            orderId,
            storeId,
            payment.method,
            payment.status,
            payment.amount,
            payment.amountReceived,
            payment.change,
            payment.reference,
            payment.notes
          ]
        );
      }
    } catch (error) {
      if (error?.code === "42P01") {
        return;
      }

      throw error;
    }
  }

  async byOrder(orderId) {
    try {
      const [rows] = await this.db.execute(
        `
          SELECT *
          FROM pedido_pagamentos
          WHERE pedido_id = ?
          ORDER BY created_at ASC, id ASC
        `,
        [orderId]
      );

      return rows;
    } catch (error) {
      if (error?.code === "42P01") {
        return [];
      }

      throw error;
    }
  }
}
