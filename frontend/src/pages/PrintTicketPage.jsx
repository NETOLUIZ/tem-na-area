import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import PrintTicket from "../components/PrintTicket";
import { useApp } from "../store/AppContext";

export default function PrintTicketPage() {
  const { storeId, orderId } = useParams();
  const { state } = useApp();

  const store = state.stores.find((item) => item.id === storeId);
  const order = state.orders.find((item) => item.id === orderId && item.storeId === storeId);

  useEffect(() => {
    if (store && order) {
      const timer = setTimeout(() => window.print(), 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [order?.id, store?.id]);

  if (!store || !order) {
    return (
      <main className="container page-space">
        <div className="empty-state">
          <h3>Pedido não encontrado</h3>
          <p>Não foi possível gerar o ticket deste pedido.</p>
          <Link className="btn btn-primary" to={`/admin-loja/${storeId}/pedidos`}>Voltar</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="print-page">
      <PrintTicket store={store} order={order} />
    </main>
  );
}
