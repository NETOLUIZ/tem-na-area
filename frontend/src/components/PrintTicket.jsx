import { formatCurrency, formatDate } from "../utils/format";
import { buildSelectionSummary } from "../utils/customization";

export default function PrintTicket({ order, store }) {
  return (
    <div className="ticket-58mm">
      <h2>{store.nome}</h2>
      <p>{store.endereco.rua} - {store.endereco.bairro}</p>
      <p>{store.endereco.cidade}</p>
      <hr />
      <p><strong>Pedido:</strong> {order.id}</p>
      <p><strong>Data:</strong> {formatDate(order.createdAt)}</p>
      <p><strong>Status:</strong> {order.status}</p>
      <hr />
      {order.items.map((item) => {
        const details = buildSelectionSummary(item.selectedGroups, item.customerNote);
        return (
          <div className="ticket-item-block" key={item.id || item.itemId}>
            <div className="ticket-item">
              <span>{item.quantidade}x {item.nome}</span>
              <span>{formatCurrency(item.unitPrice * item.quantidade)}</span>
            </div>
            {details.map((line) => (
              <p key={line} className="ticket-option-line">{line}</p>
            ))}
          </div>
        );
      })}
      <hr />
      <p className="ticket-total"><strong>Total:</strong> {formatCurrency(order.total)}</p>
      <p><strong>Cliente:</strong> {order.cliente.nome}</p>
      <p><strong>Telefone:</strong> {order.cliente.telefone}</p>
      <p><strong>Entrega:</strong> {order.cliente.enderecoEntrega}</p>
        {order.cliente.observacoes ? <p><strong>Obs:</strong> {order.cliente.observacoes}</p> : null}
      <hr />
      <p className="ticket-footer">Obrigado por comprar no Tem na Área</p>
    </div>
  );
}

