import { formatCurrency, formatDate } from "../utils/format";
import { buildSelectionSummary, buildStoredSelectionSummary } from "../utils/customization";

const COPY_LABEL = {
  customer: "Via do cliente",
  kitchen: "Via da cozinha",
  counter: "Via do balcao"
};

function classifyDetailLine(line) {
  const value = String(line || "").trim();
  if (!value) return { text: "", kind: "default", label: "" };
  if (value.toLowerCase().startsWith("observacao:")) {
    return {
      text: value.slice("observacao:".length).trim(),
      kind: "note",
      label: "Obs."
    };
  }

  return {
    text: value,
    kind: "option",
    label: "+"
  };
}

export default function PrintTicket({ order, store, copyType = "customer", paperWidth = "58" }) {
  const ticketClass = paperWidth === "80" ? "ticket-paper ticket-paper-80" : "ticket-paper ticket-paper-58";
  const copyLabel = COPY_LABEL[copyType] || COPY_LABEL.customer;
  const showFinancials = copyType !== "kitchen";
  const showCustomerBlock = copyType !== "kitchen";
  const payments = Array.isArray(order.payments) ? order.payments : [];

  return (
    <div className={ticketClass}>
      <header className="ticket-header">
        <p className="ticket-copy-type">{copyLabel}</p>
        <h2>{store.nome}</h2>
        <p>{store.endereco.rua} - {store.endereco.bairro}</p>
        <p>{store.endereco.cidade}</p>
        <p>{store.telefone || store.whatsapp || ""}</p>
      </header>

      <section className="ticket-section">
        <div className="ticket-row">
          <span>Pedido</span>
          <strong>#{order.codigo || order.id}</strong>
        </div>
        <div className="ticket-row">
          <span>Data</span>
          <strong>{formatDate(order.createdAt)}</strong>
        </div>
        <div className="ticket-row">
          <span>Status</span>
          <strong>{order.status}</strong>
        </div>
        <div className="ticket-row">
          <span>Entrega</span>
          <strong>{order.paymentStatus} / {order.cliente.enderecoEntrega ? "Entrega" : "Retirada"}</strong>
        </div>
      </section>

      <section className="ticket-section">
        <p className="ticket-section-title">Itens</p>
        {order.items.map((item) => {
          const details = item.selectedGroups?.length
            ? buildSelectionSummary(item.selectedGroups, item.customerNote)
            : buildStoredSelectionSummary(item.rawNotes);
          return (
            <div className="ticket-item-block" key={item.id || item.itemId}>
              <div className="ticket-item">
                <strong>{item.quantidade}x {item.nome}</strong>
                {showFinancials ? <span>{formatCurrency(item.unitPrice * item.quantidade)}</span> : null}
              </div>
              {details.map((line) => {
                const detail = classifyDetailLine(line);
                return (
                  <p key={line} className={`ticket-option-line ticket-option-line-${detail.kind}`}>
                    <strong>{detail.label}</strong> {detail.text}
                  </p>
                );
              })}
            </div>
          );
        })}
      </section>

      {showFinancials ? (
        <section className="ticket-section">
          <div className="ticket-row">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal || order.total)}</span>
          </div>
          <div className="ticket-row">
            <span>Desconto</span>
            <span>{formatCurrency(order.desconto || 0)}</span>
          </div>
          <div className="ticket-row">
            <span>Taxa entrega</span>
            <span>{formatCurrency(order.taxaEntrega || 0)}</span>
          </div>
          <div className="ticket-row ticket-row-total">
            <span>Total</span>
            <strong>{formatCurrency(order.total)}</strong>
          </div>
        </section>
      ) : null}

      {showFinancials && payments.length ? (
        <section className="ticket-section">
          <p className="ticket-section-title">Pagamento</p>
          {payments.map((payment) => (
            <div className="ticket-item-block" key={payment.id}>
              <div className="ticket-row">
                <span>{payment.method}</span>
                <strong>{formatCurrency(payment.amount)}</strong>
              </div>
              <div className="ticket-row">
                <span>Status</span>
                <span>{payment.status}</span>
              </div>
              {payment.amountReceived != null ? (
                <div className="ticket-row">
                  <span>Recebido</span>
                  <span>{formatCurrency(payment.amountReceived)}</span>
                </div>
              ) : null}
              {payment.change != null ? (
                <div className="ticket-row">
                  <span>Troco</span>
                  <span>{formatCurrency(payment.change)}</span>
                </div>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}

      {showCustomerBlock ? (
        <section className="ticket-section">
          <p className="ticket-section-title">Cliente</p>
          <p><strong>{order.cliente.nome}</strong></p>
          <p>{order.cliente.telefone || "Sem telefone"}</p>
          <p>{order.cliente.enderecoEntrega || "Retirada no balcao"}</p>
          {order.cliente.observacoes ? <p><strong>Obs:</strong> {order.cliente.observacoes}</p> : null}
        </section>
      ) : (
        <section className="ticket-section">
          <p className="ticket-section-title">Producao</p>
          <p>Separar itens conforme observacoes abaixo.</p>
          {order.cliente.observacoes ? <p><strong>Obs. geral:</strong> {order.cliente.observacoes}</p> : null}
        </section>
      )}

      <footer className="ticket-footer">
        <p>Tem na Area</p>
        <p>{copyLabel}</p>
      </footer>
    </div>
  );
}
