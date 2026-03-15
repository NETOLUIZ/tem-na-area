import { MdArrowForward, MdBatteryStd, MdClose, MdSignalCellularAlt, MdWifi } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import SmartImage from "../components/SmartImage";
import { useApp } from "../store/AppContext";
import { formatCurrency } from "../utils/format";

export default function CartPage() {
  const navigate = useNavigate();
  const { selectors, actions } = useApp();
  const cart = selectors.cartDetailed();

  if (!cart.items.length) {
    return (
      <div className="container page-space">
        <div className="empty-state">
          <h3>Sacola vazia</h3>
          <p>Adicione produtos para seguir com a compra.</p>
          <Link className="btn btn-primary" to="/">Voltar para Home</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="cart-v2-page">
      <div className="cart-v2-statusbar">
        <span>9:41</span>
        <div><MdSignalCellularAlt /><MdWifi /><MdBatteryStd /></div>
      </div>

      <header className="cart-v2-header">
        <div className="cart-v2-title-row">
          <div>
            <p className="cart-v2-kicker">Seu pedido no Tem na Área</p>
            <h1>Sacola</h1>
          </div>
          <span>{cart.store.nome}</span>
        </div>
      </header>

      <section className="cart-v2-body">
        <div className="cart-v2-items">
          {cart.items.map((row) => (
            <article key={row.id} className="cart-v2-item">
              <SmartImage src={row.item.imagem} alt={row.item.nome} className="cart-v2-thumb" />

              <div className="cart-v2-item-content">
                <div className="cart-v2-item-top">
                  <div>
                    <small className="cart-v2-item-label">Item selecionado</small>
                    <h3>{row.item.nome}</h3>
                    <p>{formatCurrency(row.unitPrice)} cada</p>
                    {row.summaryLines?.length ? (
                      <div className="cart-line-summary">
                        {row.summaryLines.map((line) => <small key={line}>{line}</small>)}
                      </div>
                    ) : null}
                  </div>
                  <strong>{formatCurrency(row.subtotal)}</strong>
                </div>

                <div className="cart-v2-item-actions">
                  <button
                    type="button"
                    className="cart-v2-item-remove"
                    onClick={() => actions.setCartQuantity(row.id, 0)}
                    aria-label="Remover item"
                  >
                    <MdClose />
                  </button>
                  <div className="cart-v2-stepper">
                    <button type="button" onClick={() => actions.setCartQuantity(row.id, row.quantidade - 1)}>
                      -
                    </button>
                    <span>{row.quantidade}</span>
                    <button type="button" onClick={() => actions.setCartQuantity(row.id, row.quantidade + 1)}>
                      +
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="cart-v2-footer">
        <div className="cart-v2-total-row">
          <span>Total do pedido</span>
          <strong>{formatCurrency(cart.total)}</strong>
        </div>
        <button
          className="cart-v2-checkout"
          onClick={() => navigate("/checkout")}
        >
          Finalizar compra <span aria-hidden="true"><MdArrowForward /></span>
        </button>
        <div className="cart-v2-handle" />
      </footer>
    </main>
  );
}
