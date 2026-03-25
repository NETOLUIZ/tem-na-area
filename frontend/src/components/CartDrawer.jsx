import { Link } from "react-router-dom";
import { MdClose, MdOutlineShoppingBag, MdStorefront, MdVerified } from "react-icons/md";
import SmartImage from "./SmartImage";
import { formatCurrency } from "../utils/format";

export default function CartDrawer({ cart, open, onClose, onDecrease, onIncrease }) {
  if (!open || !cart?.items?.length) return null;

  const visibleItems = cart.highlightedCartItemId
    ? cart.items.filter((row) => row.id === cart.highlightedCartItemId)
    : cart.items;
  const visibleTotal = visibleItems.reduce((sum, row) => sum + row.subtotal, 0);

  return (
    <div className="cart-drawer-overlay" role="dialog" aria-modal="true" aria-label="Sacola da loja">
      <button type="button" className="cart-drawer-backdrop" aria-label="Fechar sacola" onClick={onClose} />

      <aside className="cart-drawer-panel">
        <header className="cart-drawer-header">
          <div className="cart-drawer-header-copy">
            <span className="cart-drawer-kicker">Sua compra no Tem na Area</span>
            <h3>{cart.store?.nome || "Sua sacola"}</h3>
            <div className="cart-drawer-store-meta">
              <span>
                <MdStorefront aria-hidden="true" />
                Loja ativa
              </span>
              <span>
                <MdVerified aria-hidden="true" />
                Atualizado em tempo real
              </span>
            </div>
          </div>

          <button type="button" className="cart-drawer-close" aria-label="Fechar" onClick={onClose}>
            <MdClose />
          </button>
        </header>

        <section className="cart-drawer-highlight">
          <div>
            <small>{cart.highlightedCartItemId ? "Item selecionado" : "Itens na sacola"}</small>
            <strong>{cart.highlightedCartItemId ? visibleItems.length : cart.items.length}</strong>
          </div>
          <div>
            <small>Total parcial</small>
            <strong>{formatCurrency(visibleTotal)}</strong>
          </div>
        </section>

        <div className="cart-drawer-list">
          {visibleItems.map((row) => (
            <article key={row.id} className="cart-drawer-item">
              <SmartImage src={row.item.imagem} alt={row.item.nome} className="cart-drawer-thumb" />

              <div className="cart-drawer-item-main">
                <div className="cart-drawer-item-top">
                  <div>
                    <strong>{row.item.nome}</strong>
                    <span>{formatCurrency(row.unitPrice)} por unidade</span>
                  </div>
                  <strong className="cart-drawer-subtotal">{formatCurrency(row.subtotal)}</strong>
                </div>

                {row.summaryLines?.length ? (
                  <div className="cart-line-summary">
                    {row.summaryLines.map((line) => <small key={line}>{line}</small>)}
                  </div>
                ) : null}

                <div className="cart-drawer-stepper">
                  <button type="button" onClick={() => onDecrease(row.id, 0)} className="cart-drawer-stepper-remove" aria-label="Remover item">
                    <MdClose />
                  </button>
                  <button type="button" onClick={() => onDecrease(row.id, row.quantidade - 1)} aria-label="Diminuir quantidade">
                    -
                  </button>
                  <span>{row.quantidade}</span>
                  <button type="button" onClick={() => onIncrease(row.id, row.quantidade + 1)} aria-label="Aumentar quantidade">
                    +
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <footer className="cart-drawer-footer">
          <div className="cart-drawer-total">
            <span>{cart.highlightedCartItemId ? "Total deste item" : "Total do pedido"}</span>
            <strong>{formatCurrency(cart.highlightedCartItemId ? visibleTotal : cart.total)}</strong>
          </div>

          <div className="cart-drawer-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Seguir navegando
            </button>
            <Link className="btn btn-primary cart-drawer-checkout" to="/sacola" onClick={onClose}>
              <MdOutlineShoppingBag aria-hidden="true" />
              Revisar sacola
            </Link>
          </div>
        </footer>
      </aside>
    </div>
  );
}
