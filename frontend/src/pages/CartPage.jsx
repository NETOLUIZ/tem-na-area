import { XMarkIcon, ShoppingBagIcon, ArrowRightIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Link, useNavigate } from "react-router-dom";
import SmartImage from "../components/SmartImage";
import Navigation, { BottomNav } from "../components/Navigation";
import Button from "../components/Button";
import { useApp } from "../store/AppContext";
import { formatCurrency } from "../utils/format";

export default function CartPage() {
  const navigate = useNavigate();
  const { selectors, actions } = useApp();
  const cart = selectors.cartDetailed();

  if (!cart.items.length) {
    return (
      <>
        <Navigation userRole="customer" cartCount={0} />
        <div className="cart-page-v2">
          <div className="empty-state" style={{ padding: "80px 20px", minHeight: "60vh", display: "grid", placeItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <ShoppingBagIcon style={{ width: "64px", height: "64px", margin: "0 auto 20px", opacity: 0.5 }} />
              <h3>Sacola vazia</h3>
              <p>Adicione produtos para continuar a compra.</p>
              <Link className="btn btn-primary" to="/">Voltar para o inicio</Link>
            </div>
          </div>
        </div>
        <BottomNav userRole="customer" activeRoute="/cart" />
      </>
    );
  }

  return (
    <>
      <Navigation userRole="customer" cartCount={cart.items.length} />

      <main className="cart-page-v2">
        {/* Header */}
        <header className="cart-header">
          <div className="cart-header-content">
            <div>
              <p className="cart-kicker">Sua compra no Tem na Area</p>
              <h1>Sacola</h1>
              <p className="cart-subtitle">Revise os itens antes de seguir para a confirmação final.</p>
            </div>
            <span className="cart-store-badge">{cart.store.nome}</span>
          </div>
        </header>

        {/* Body */}
        <section className="cart-body">
          {/* Items List */}
          <div className="cart-items-section">
            <h2 className="cart-section-title">{cart.items.length} item(ns) na sacola</h2>

            <div className="cart-items-list">
              {cart.items.map((row) => (
                <article key={row.id} className="cart-item-card">
                  <div className="cart-item-media">
                    <SmartImage src={row.item.imagem} alt={row.item.nome} />
                  </div>

                  <div className="cart-item-content">
                    <div>
                      <small className="cart-item-label">Item selecionado</small>
                      <h3>{row.item.nome}</h3>
                      <p className="cart-item-price">{formatCurrency(row.unitPrice)} por unidade</p>

                      {row.summaryLines?.length ? (
                        <div className="cart-item-notes">
                          {row.summaryLines.map((line) => (
                            <small key={line} className="cart-item-note">{line}</small>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="cart-item-actions">
                      <strong className="cart-item-subtotal">{formatCurrency(row.subtotal)}</strong>

                      <div className="cart-item-controls">
                        <button
                          type="button"
                          className="cart-item-remove"
                          onClick={() => actions.setCartQuantity(row.id, 0)}
                          title="Remover item"
                          aria-label="Remover item"
                        >
                          <TrashIcon width={20} height={20} strokeWidth={1.5} />
                        </button>

                        <div className="cart-stepper">
                          <button
                            type="button"
                            onClick={() => actions.setCartQuantity(row.id, row.quantidade - 1)}
                            title="Diminuir quantidade"
                          >
                            −
                          </button>
                          <span>{row.quantidade}</span>
                          <button
                            type="button"
                            onClick={() => actions.setCartQuantity(row.id, row.quantidade + 1)}
                            title="Aumentar quantidade"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Summary Panel */}
          <aside className="cart-summary-panel">
            <div className="cart-summary-card">
              <div className="cart-summary-head">
                <h2>Resumo do Pedido</h2>
                <span className="cart-summary-count">{cart.items.length} item(ns)</span>
              </div>

              <div className="cart-summary-body">
                {cart.items.map((row) => (
                  <div key={row.id} className="cart-summary-row">
                    <span className="cart-summary-description">
                      {row.quantidade}x <strong>{row.item.nome}</strong>
                    </span>
                    <strong className="cart-summary-amount">{formatCurrency(row.subtotal)}</strong>
                  </div>
                ))}
              </div>

              <div className="cart-summary-divider" />

              <div className="cart-summary-total">
                <span>Total do Pedido</span>
                <strong>{formatCurrency(cart.total)}</strong>
              </div>

              <Button
                variant="primary"
                size="lg"
                icon={ShoppingBagIcon}
                iconPosition="left"
                onClick={() => navigate("/checkout")}
                style={{ width: "100%" }}
              >
                Avançar para Confirmação
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => navigate(-1)}
                style={{ width: "100%" }}
              >
                Continuar Comprando
              </Button>
            </div>
          </aside>
        </section>

        {/* Mobile Footer */}
        <footer className="cart-footer-mobile">
          <div className="cart-footer-total">
            <small>Total</small>
            <strong>{formatCurrency(cart.total)}</strong>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate("/checkout")}
            style={{ width: "100%" }}
          >
            Continuar
          </Button>
        </footer>
      </main>

      <BottomNav userRole="customer" activeRoute="/cart" />
    </>
  );
}
