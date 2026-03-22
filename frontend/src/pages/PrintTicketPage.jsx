import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import PrintTicket from "../components/PrintTicket";
import { useApp } from "../store/AppContext";

const VALID_COPY_TYPES = new Set(["customer", "kitchen", "counter"]);
const VALID_WIDTHS = new Set(["58", "80"]);

export default function PrintTicketPage() {
  const { storeId, orderId } = useParams();
  const { state } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const store = state.stores.find((item) => item.id === storeId);
  const order = state.orders.find((item) => item.id === orderId && item.storeId === storeId);
  const copyType = VALID_COPY_TYPES.has(searchParams.get("copy")) ? searchParams.get("copy") : "customer";
  const paperWidth = VALID_WIDTHS.has(searchParams.get("width")) ? searchParams.get("width") : "58";

  useEffect(() => {
    if (store && order) {
      const timer = setTimeout(() => window.print(), 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [copyType, order?.id, paperWidth, store?.id]);

  function updatePrintMode(next) {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => params.set(key, value));
    setSearchParams(params, { replace: true });
  }

  if (!store || !order) {
    return (
      <main className="container page-space">
        <div className="empty-state">
          <h3>Pedido nao encontrado</h3>
          <p>Nao foi possivel gerar o ticket deste pedido.</p>
          <Link className="btn btn-primary" to={`/admin-loja/${storeId}/pedidos`}>Voltar</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="print-page">
      <section className="print-toolbar no-print">
        <div className="print-toolbar-group">
          <span>Via</span>
          <button type="button" className={copyType === "customer" ? "active" : ""} onClick={() => updatePrintMode({ copy: "customer" })}>Cliente</button>
          <button type="button" className={copyType === "kitchen" ? "active" : ""} onClick={() => updatePrintMode({ copy: "kitchen" })}>Cozinha</button>
          <button type="button" className={copyType === "counter" ? "active" : ""} onClick={() => updatePrintMode({ copy: "counter" })}>Balcao</button>
        </div>

        <div className="print-toolbar-group">
          <span>Largura</span>
          <button type="button" className={paperWidth === "58" ? "active" : ""} onClick={() => updatePrintMode({ width: "58" })}>58mm</button>
          <button type="button" className={paperWidth === "80" ? "active" : ""} onClick={() => updatePrintMode({ width: "80" })}>80mm</button>
        </div>

        <div className="print-toolbar-actions">
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>Imprimir novamente</button>
          <Link className="btn btn-outline" to={`/admin-loja/${storeId}/pedidos`}>Voltar</Link>
        </div>
      </section>

      <PrintTicket store={store} order={order} copyType={copyType} paperWidth={paperWidth} />
    </main>
  );
}
