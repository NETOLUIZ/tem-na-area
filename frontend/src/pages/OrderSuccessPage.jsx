import { MdArrowForward, MdCheckCircle, MdHome, MdLocalShipping, MdStorefront } from "react-icons/md";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "../store/AppContext";

export default function OrderSuccessPage() {
  const location = useLocation();
  const { state } = useApp();

  const orderId = location.state?.orderId;
  const order = state.orders.find((item) => item.id === orderId) || null;
  const store = order ? state.stores.find((item) => item.id === order.storeId) || null : null;
  const progressSteps = [
    { id: "placed", label: "Pedido\nrecebido", done: true },
    { id: "preparing", label: "Em\npreparo", done: true, active: true },
    { id: "shipping", label: "Saiu\npara entrega" },
    { id: "delivered", label: "Entregue" }
  ];

  return (
    <main className="success-v2-page public-flow-page success-v2-page-public">
      <section className="success-v2-wrap">
        <p className="success-v2-topline">Order Confirmed</p>

        <div className="success-v2-head">
          <div className="success-v2-icon-wrap">
            <div className="success-v2-icon-glow" />
            <div className="success-v2-icon"><MdCheckCircle /></div>
          </div>

          <p className="success-v2-kicker">Pedido confirmado</p>
          <h1>Success!</h1>
          <p>
            Seu pedido foi enviado para <strong>{store?.nome || "a operacao selecionada"}</strong>.
          </p>
          <strong className="success-v2-order-id">Order #{order?.id || orderId || "123456789"}</strong>
        </div>

        <article className="success-v2-card">
          <div className="success-v2-estimate">
            <small>Estimated Delivery</small>
            <strong>Hoje, 35 a 50 min</strong>
          </div>

          <div className="success-v2-progress" aria-hidden="true">
            <div className="success-v2-progress-track" />
            {progressSteps.map((step) => (
              <div
                key={step.id}
                className={`success-v2-progress-step ${step.done ? "is-done" : ""} ${step.active ? "is-active" : ""}`}
              >
                <span className="success-v2-progress-dot">
                  {step.id === "placed" ? <MdCheckCircle /> : step.id === "preparing" ? <MdStorefront /> : step.id === "shipping" ? <MdLocalShipping /> : <MdHome />}
                </span>
                <small>{step.label}</small>
              </div>
            ))}
          </div>
        </article>

        <div className="success-v2-actions">
          <Link className="success-v2-primary" to={store?.slug ? `/loja/${store.slug}` : "/"}>
            Ver detalhes <span aria-hidden="true"><MdArrowForward /></span>
          </Link>
          <Link className="success-v2-secondary" to="/">
            <MdHome aria-hidden="true" />
            Ir para o inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
