import { useMemo, useState } from "react";
import {
  MdDashboard,
  MdDarkMode,
  MdNotificationsNone,
  MdReceiptLong,
  MdRestaurantMenu,
  MdSearch,
  MdSettings
} from "react-icons/md";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import MerchantDesktopSidebar from "../components/MerchantDesktopSidebar";
import { buildSelectionSummary } from "../utils/customization";
import { formatCurrency } from "../utils/format";
import { useApp } from "../store/AppContext";

const STATUS_FLOW = ["TODOS", "NOVO", "ACEITO", "EM_PREPARO", "SAIU_PARA_ENTREGA", "CONCLUIDO", "CANCELADO", "RECUSADO"];
const STATUS_LABEL = {
  TODOS: "Todos",
  NOVO: "Novo",
  ACEITO: "Aceito",
  EM_PREPARO: "Em preparo",
  SAIU_PARA_ENTREGA: "Saiu para entrega",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
  RECUSADO: "Recusado"
};

function getRelativeTime(value) {
  const date = new Date(value).getTime();
  const diff = Math.max(0, Date.now() - date);
  const min = Math.floor(diff / 60000);

  if (min < 1) return "Agora mesmo";
  if (min < 60) return `Há ${min} min`;

  const hours = Math.floor(min / 60);
  if (hours < 24) return `Há ${hours} h`;

  const days = Math.floor(hours / 24);
  return `Há ${days} dia${days > 1 ? "s" : ""}`;
}

function getNextStatus(status) {
  if (status === "NOVO") return "ACEITO";
  if (status === "ACEITO") return "EM_PREPARO";
  if (status === "EM_PREPARO") return "SAIU_PARA_ENTREGA";
  if (status === "SAIU_PARA_ENTREGA") return "CONCLUIDO";
  return status;
}

function getActionLabel(status) {
  if (status === "NOVO") return "Aceitar";
  if (status === "ACEITO") return "Preparar";
  if (status === "EM_PREPARO") return "Despachar";
  if (status === "SAIU_PARA_ENTREGA") return "Concluir";
  return "Imprimir";
}

export default function MerchantOrdersPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { state, selectors, actions } = useApp();
  const [status, setStatus] = useState("TODOS");
  const [query, setQuery] = useState("");
  const [busyOrderId, setBusyOrderId] = useState(null);

  const store = state.stores.find((item) => item.id === storeId);
  const orders = selectors.ordersByStore(storeId).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return orders.filter((order) => {
      const byStatus = status === "TODOS" || order.status === status;
      const byQuery = !normalized || order.codigo.toLowerCase().includes(normalized) || order.cliente.nome.toLowerCase().includes(normalized);
      return byStatus && byQuery;
    });
  }, [orders, query, status]);

  async function handleAction(order) {
    const nextStatus = getNextStatus(order.status);
    if (nextStatus === order.status) {
      navigate(`/admin-loja/${storeId}/pedidos/${order.id}/imprimir`);
      return;
    }

    setBusyOrderId(order.id);
    await actions.updateOrderStatus(storeId, order.id, nextStatus);
    setBusyOrderId(null);
  }

  if (!store) {
    return (
      <main className="container page-space">
        <div className="empty-state">
          <h3>Loja não encontrada</h3>
          <p>Não foi possível carregar os pedidos desta operação.</p>
          <Link className="btn btn-primary" to="/">Voltar para o início</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="orders-v2-page merchant-has-sidebar">
      <MerchantDesktopSidebar
        storeId={storeId}
        storeName={store.nome}
        storeSlug={store.slug}
        status={store.status}
        onLogout={() => {
          actions.logoutMerchant();
          navigate("/login-loja");
        }}
      />

      <div className="orders-v2-top-spacer" />

      <header className="orders-v2-header">
        <div className="orders-v2-title-wrap">
          <h1>Pedidos</h1>
          <p>Central operacional Tem na Área</p>
        </div>
        <button className="orders-v2-bell" type="button" aria-label="Notificações">
          <MdNotificationsNone />
        </button>
      </header>

      <section className="orders-v2-filters hide-scrollbar" aria-label="Filtros de status">
        {STATUS_FLOW.map((item) => (
          <button
            key={item}
            type="button"
            className={`orders-v2-chip ${status === item ? "active" : ""}`}
            onClick={() => setStatus(item)}
          >
            {STATUS_LABEL[item]}
          </button>
        ))}
      </section>

      <section className="orders-v2-body">
        <div className="orders-v2-search">
          <span><MdSearch /></span>
          <input
            type="text"
            placeholder="Buscar por cliente ou código..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="orders-v2-list">
          {!filtered.length ? (
            <div className="orders-v2-empty">
              <div><MdReceiptLong /></div>
              <h3>Nenhum pedido encontrado</h3>
              <p>Não há pedidos para esse filtro no momento.</p>
            </div>
          ) : (
            filtered.map((order) => (
              <article className="orders-v2-card" key={order.id}>
                <div className="orders-v2-card-top">
                  <div>
                    <small>#{order.codigo}</small>
                    <h3>{order.cliente.nome}</h3>
                  </div>
                  <span className={`orders-v2-badge status-${order.status.toLowerCase().replace(/_/g, "-")}`}>
                    {STATUS_LABEL[order.status] || order.status}
                  </span>
                </div>

                <p className="orders-v2-meta">{`${getRelativeTime(order.createdAt)} · ${order.items.length} item(ns)`}</p>

                <div className="orders-v2-order-lines">
                  {order.items.map((item) => {
                    const details = buildSelectionSummary(item.selectedGroups, item.customerNote);
                    return (
                      <div key={item.id || `${order.id}-${item.itemId}`} className="orders-v2-order-line">
                        <div>
                          <strong>{item.quantidade}x {item.nome}</strong>
                          {details.length ? (
                            <div className="cart-line-summary">
                              {details.map((line) => <small key={line}>{line}</small>)}
                            </div>
                          ) : null}
                        </div>
                        <span>{formatCurrency(item.unitPrice * item.quantidade)}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="orders-v2-card-bottom">
                  <strong>{formatCurrency(order.total)}</strong>
                  <button
                    type="button"
                    className={`orders-v2-action ${order.status === "NOVO" ? "accept" : "soft"}`}
                    onClick={() => handleAction(order)}
                    disabled={busyOrderId === order.id}
                  >
                    {busyOrderId === order.id ? "Salvando..." : getActionLabel(order.status)}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <nav className="orders-v2-nav" aria-label="Navegação do painel">
        <NavLink to={`/admin-loja/${storeId}`} end className={({ isActive }) => (isActive ? "active" : "")}>
          <span><MdDashboard /></span>
          <small>Início</small>
        </NavLink>
        <NavLink to={`/admin-loja/${storeId}/pedidos`} className={({ isActive }) => (isActive ? "active" : "")}>
          <span><MdReceiptLong /></span>
          <small>Pedidos</small>
        </NavLink>
        <NavLink to={`/admin-loja/${storeId}/cardapio`} className={({ isActive }) => (isActive ? "active" : "")}>
          <span><MdRestaurantMenu /></span>
          <small>Catálogo</small>
        </NavLink>
        <NavLink to={`/admin-loja/${storeId}/ajustes`} className={({ isActive }) => (isActive ? "active" : "")}>
          <span><MdSettings /></span>
          <small>Ajustes</small>
        </NavLink>
      </nav>

      <button
        type="button"
        className="orders-v2-theme"
        onClick={() => document.documentElement.classList.toggle("dark")}
        aria-label="Alternar tema"
      >
        <MdDarkMode />
      </button>
    </main>
  );
}
