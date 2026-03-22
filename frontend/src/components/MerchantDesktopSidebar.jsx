import { NavLink } from "react-router-dom";
import { MdAssessment, MdDashboard, MdGroup, MdInventory2, MdLogout, MdPointOfSale, MdReceiptLong, MdRestaurantMenu, MdSavings, MdSettings, MdStorefront } from "react-icons/md";
import { useApp } from "../store/AppContext";

export default function MerchantDesktopSidebar({ storeId, storeName, storeSlug, status, onLogout }) {
  const { selectors } = useApp();
  const initial = String(storeName || "M").slice(0, 1).toUpperCase();
  const can = selectors.can;

  return (
    <aside className="merchant-desktop-sidebar">
      <div className="merchant-desktop-brand">
        <div className="merchant-desktop-brand-mark" aria-hidden="true">{initial}</div>
        <div className="merchant-desktop-brand-copy">
          <h2>Tem na Area</h2>
          <p>{storeName || "Minha operacao"}</p>
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
        {can("customers:view") ? (
          <NavLink to={`/admin-loja/${storeId}/clientes`} className={({ isActive }) => (isActive ? "active" : "")}>
            <MdGroup />
            <span>Clientes</span>
          </NavLink>
        ) : null}
        {can("cash_register:view") ? (
          <NavLink to={`/admin-loja/${storeId}/caixa`} className={({ isActive }) => (isActive ? "active" : "")}>
            <MdSavings />
            <span>Caixa</span>
          </NavLink>
        ) : null}
        {can("inventory:view") ? (
          <NavLink to={`/admin-loja/${storeId}/estoque`} className={({ isActive }) => (isActive ? "active" : "")}>
            <MdInventory2 />
            <span>Estoque</span>
          </NavLink>
        ) : null}
        {can("reports:view") ? (
          <NavLink to={`/admin-loja/${storeId}/relatorios`} className={({ isActive }) => (isActive ? "active" : "")}>
            <MdAssessment />
            <span>Relatorios</span>
          </NavLink>
        ) : null}
        {can("pdv:access") ? (
          <NavLink to={`/admin-loja/${storeId}/pdv`} className={({ isActive }) => (isActive ? "active" : "")}>
            <MdPointOfSale />
            <span>Frente de caixa</span>
          </NavLink>
        ) : null}
        {can("products:view") ? (
          <NavLink to={`/admin-loja/${storeId}/cardapio`} className={({ isActive }) => (isActive ? "active" : "")}>
            <MdRestaurantMenu />
            <span>Catalogo</span>
          </NavLink>
        ) : null}
        {can("settings:view") ? (
          <NavLink to={`/admin-loja/${storeId}/ajustes`} className={({ isActive }) => (isActive ? "active" : "")}>
            <MdSettings />
            <span>Ajustes</span>
          </NavLink>
        ) : null}
        <NavLink
          to={storeSlug ? `/loja/${storeSlug}` : `/admin-loja/${storeId}`}
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <MdStorefront />
          <span>Vitrine</span>
        </NavLink>
      </nav>

      <button type="button" className="merchant-desktop-logout" onClick={onLogout}>
        <MdLogout />
        <span>Sair da conta</span>
      </button>
    </aside>
  );
}
