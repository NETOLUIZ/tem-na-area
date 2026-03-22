import { MdArrowForward, MdCheckCircle, MdHome, MdLocalShipping, MdStorefront } from "react-icons/md";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "../store/AppContext";

export default function OrderSuccessPage() {
  const location = useLocation();
  const { state } = useApp();

  const orderId = location.state?.orderId;
  const order = state.orders.find((item) => item.id === orderId) || null;
  const store = order ? state.stores.find((item) => item.id === order.storeId) || null : null;

  return (
    <main className="success-v2-page">
      <div className="success-v2-top-space" />

      <section className="success-v2-wrap">
        <div className="success-v2-icon-wrap">
          <div className="success-v2-icon-glow" />
          <div className="success-v2-icon"><MdCheckCircle /></div>
        </div>

        <div className="success-v2-head">
          <p className="success-v2-kicker">Pedido confirmado no Tem na Área</p>
          <h1>Pedido realizado com sucesso</h1>
          <p>
            Seu pedido <strong>{order?.id || orderId || "#----"}</strong> já foi enviado para{" "}
            <strong>{store?.nome || "a operação selecionada"}</strong>.
          </p>
        </div>

        <article className="success-v2-card">
          <div className="success-v2-row">
            <div className="success-v2-badge mint"><MdLocalShipping /></div>
            <div>
              <small>TEMPO ESTIMADO</small>
              <strong>35 a 50 minutos</strong>
            </div>
          </div>

          <hr />

          <div className="success-v2-row">
            <div className="success-v2-badge blue"><MdHome /></div>
            <div>
              <small>ENTREGA EM</small>
              <strong>{order?.cliente?.enderecoEntrega || "Endereço não informado"}</strong>
            </div>
          </div>
        </article>

        <div className="success-v2-actions">
          <Link className="success-v2-primary" to={store?.slug ? `/loja/${store.slug}` : "/"}>
            <MdStorefront aria-hidden="true" />
            Voltar para a vitrine <span aria-hidden="true"><MdArrowForward /></span>
          </Link>
          <Link className="success-v2-secondary" to="/">Ir para o início</Link>
        </div>
      </section>
    </main>
  );
}
