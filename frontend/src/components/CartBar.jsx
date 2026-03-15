import { Link } from "react-router-dom";
import { formatCurrency } from "../utils/format";

export default function CartBar({ count, total, onOpen }) {
  if (!count) return null;

  return (
    <div className="cart-bar">
      <div>
        <strong>Ver sacola ({count})</strong>
        <span>{formatCurrency(total)}</span>
      </div>
      <div className="cart-bar-actions">
        <button type="button" className="btn btn-outline cart-bar-preview" onClick={onOpen}>
          Ver itens
        </button>
        <Link className="btn btn-dark" to="/sacola">
          Abrir
        </Link>
      </div>
    </div>
  );
}

