import { NavLink } from "react-router-dom";
import { MdDashboard, MdLogout, MdReceiptLong, MdRestaurantMenu, MdSettings, MdStorefront } from "react-icons/md";

export default function MerchantDesktopSidebar({ storeId, storeName, storeSlug, status, onLogout }) {
  const initial = String(storeName || "M").slice(0, 1).toUpperCase();

  return (
    <aside className="merchant-desktop-sidebar">
      <div className="merchant-desktop-brand">
        <div className="merchant-desktop-brand-mark" aria-hidden="true">{initial}</div>
        <div className="merchant-desktop-brand-copy">
          <h2>Tem na Area</h2>
          <p>{storeName || "Minha Loja"}</p>
          <small>{status || "PENDENTE"}</small>
        </div>
      </div>

      <nav className="merchant-desktop-nav">
        <NavLink to={`/admin-loja/${storeId}`} end className={({ isActive }) => (isActive ? "active" : "")}>
          <MdDashboard />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to={`/admin-loja/${storeId}/pedidos`} className={({ isActive }) => (isActive ? "active" : "")}>
          <MdReceiptLong />
          <span>Pedidos</span>
        </NavLink>
        <NavLink to={`/admin-loja/${storeId}/cardapio`} className={({ isActive }) => (isActive ? "active" : "")}>
          <MdRestaurantMenu />
          <span>Cardapio</span>
        </NavLink>
        <NavLink to={`/admin-loja/${storeId}/ajustes`} className={({ isActive }) => (isActive ? "active" : "")}>
          <MdSettings />
          <span>Ajustes</span>
        </NavLink>
        <NavLink
          to={storeSlug ? `/loja/${storeSlug}` : `/admin-loja/${storeId}`}
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <MdStorefront />
          <span>Loja</span>
        </NavLink>
      </nav>

      <button type="button" className="merchant-desktop-logout" onClick={onLogout}>
        <MdLogout />
        <span>Sair da conta</span>
      </button>
    </aside>
  );
}
