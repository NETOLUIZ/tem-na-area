import { useMemo, useState } from "react";
import {
  MdDashboard,
  MdNotificationsNone,
  MdReceiptLong,
  MdRestaurantMenu,
  MdSearch,
  MdSettings,
  MdLocalPrintshop,
  MdClose
} from "react-icons/md";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import MerchantPanelShell from "../components/merchant/MerchantPanelShell";
import { MerchantPanelMissingState } from "../components/merchant/MerchantPanelState";
import { buildSelectionSummary } from "../utils/customization";
import { formatCurrency, formatDate } from "../utils/format";
import { useApp } from "../store/AppContext";

const STATUS_FLOW = ["TODOS", "NOVO", "ACEITO", "EM_PREPARO", "SAIU_PARA_ENTREGA", "CONCLUIDO", "CANCELADO", "RECUSADO"];
const STATUS_LABEL = {
  TODOS: "Todos",
  NOVO: "Novo",
  ACEITO: "Aceito",
  EM_PREPARO: "Em preparo",
  SAIU_PARA_ENTREGA: "Saiu para entrega",
  CONCLUIDO: "Concluido",
  CANCELADO: "Cancelado",
  RECUSADO: "Recusado"
};

const DELAY_LIMITS = {
  NOVO: 10,
  ACEITO: 15,
  EM_PREPARO: 25,
  SAIU_PARA_ENTREGA: 40
};

function getElapsedMinutes(value) {
  const date = new Date(value).getTime();
  if (Number.isNaN(date)) return 0;
  return Math.max(0, Math.floor((Date.now() - date) / 60000));
}

function getRelativeTime(value) {
  const min = getElapsedMinutes(value);

  if (min < 1) return "Agora mesmo";
  if (min < 60) return `Ha ${min} min`;

  const hours = Math.floor(min / 60);
  if (hours < 24) return `Ha ${hours} h`;

  const days = Math.floor(hours / 24);
  return `Ha ${days} dia${days > 1 ? "s" : ""}`;
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

function getDelayState(order) {
  const limit = DELAY_LIMITS[order.status];
  if (!limit) return "normal";
  const elapsed = getElapsedMinutes(order.createdAt);
  if (elapsed >= limit) return "danger";
  if (elapsed >= Math.floor(limit * 0.7)) return "warning";
  return "normal";
}

function getSearchableText(order) {
  return [
    order.codigo,
    order.cliente.nome,
    order.cliente.telefone,
    order.cliente.enderecoEntrega
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function MerchantOrdersPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { state, selectors, actions } = useApp();
  const [status, setStatus] = useState("TODOS");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState("recentes");
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const store = state.stores.find((item) => item.id === storeId);
  const orders = selectors.ordersByStore(storeId).slice();

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const next = orders.filter((order) => {
      const byStatus = status === "TODOS" || order.status === status;
      const byQuery = !normalized || getSearchableText(order).includes(normalized);
      return byStatus && byQuery;
    });

    next.sort((a, b) => {
      if (sortMode === "espera") {
        return getElapsedMinutes(b.createdAt) - getElapsedMinutes(a.createdAt);
      }

      if (sortMode === "antigos") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }

      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return next;
  }, [orders, query, sortMode, status]);

  const openOrders = orders.filter((order) => ["NOVO", "ACEITO", "EM_PREPARO", "SAIU_PARA_ENTREGA"].includes(order.status)).length;
  const delayedOrders = orders.filter((order) => getDelayState(order) === "danger").length;

  async function handleAdvance(order) {
    const nextStatus = getNextStatus(order.status);
    if (nextStatus === order.status) {
      navigate(`/admin-loja/${storeId}/pedidos/${order.id}/imprimir`);
      return;
    }

    setBusyOrderId(order.id);
    await actions.updateOrderStatus(storeId, order.id, nextStatus);
    setBusyOrderId(null);
  }

  async function handleCancel(order) {
    const reason = window.prompt(`Informe o motivo para cancelar o pedido #${order.codigo}:`, "");
    if (!reason) return;

    setBusyOrderId(order.id);
    await actions.updateOrderStatus(storeId, order.id, "CANCELADO", reason);
    setBusyOrderId(null);
  }

  if (!store) {
    return <MerchantPanelMissingState description="Nao foi possivel carregar os pedidos desta operacao." />;
  }

  return (
    <MerchantPanelShell
      storeId={storeId}
      store={store}
      className="orders-v2-page merchant-orders-shell"
      bodyClassName="merchant-panel-main merchant-orders-main"
      eyebrow="PAINEL DA LOJA / PEDIDOS"
      title="Pedidos"
      description="Fluxo operacional reforcado com busca, fila, tempo de espera, impressao e historico."
      heroAside={(
        <div className="merchant-dashboard-hero-meta">
          <div className="merchant-dashboard-store-chip">
            <span>Em aberto</span>
            <strong>{openOrders}</strong>
          </div>
          <div className="merchant-dashboard-store-chip">
            <span>Atrasados</span>
            <strong>{delayedOrders}</strong>
          </div>
        </div>
      )}
      heroActions={(
        <button className="orders-v2-bell" type="button" aria-label="Notificacoes">
          <MdNotificationsNone />
        </button>
      )}
      onLogout={() => {
        actions.logoutMerchant();
        navigate("/pdv");
      }}
    >
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

      <section className="orders-v2-toolbar">
        <div className="orders-v2-search">
          <span><MdSearch /></span>
          <input
            type="text"
            placeholder="Buscar por pedido, cliente ou telefone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="orders-v2-sort">
          <button type="button" className={sortMode === "recentes" ? "active" : ""} onClick={() => setSortMode("recentes")}>Mais recentes</button>
          <button type="button" className={sortMode === "antigos" ? "active" : ""} onClick={() => setSortMode("antigos")}>Mais antigos</button>
          <button type="button" className={sortMode === "espera" ? "active" : ""} onClick={() => setSortMode("espera")}>Maior espera</button>
        </div>
      </section>

      <section className="orders-v2-body">
        <div className="orders-v2-list">
          {!filtered.length ? (
            <div className="orders-v2-empty">
              <div><MdReceiptLong /></div>
              <h3>Nenhum pedido encontrado</h3>
              <p>Nao ha pedidos para esse filtro no momento.</p>
            </div>
          ) : (
            filtered.map((order) => {
              const delayState = getDelayState(order);
              const elapsed = getElapsedMinutes(order.createdAt);
              const isExpanded = expandedOrderId === order.id;

              return (
                <article className={`orders-v2-card ${delayState === "danger" ? "is-late" : delayState === "warning" ? "is-warning" : ""}`} key={order.id}>
                  <div className="orders-v2-card-top">
                    <div>
                      <small>#{order.codigo}</small>
                      <h3>{order.cliente.nome}</h3>
                      <p className="orders-v2-contact">{order.cliente.telefone || "Sem telefone"} · {order.paymentStatus}</p>
                    </div>
                    <span className={`orders-v2-badge status-${order.status.toLowerCase().replace(/_/g, "-")}`}>
                      {STATUS_LABEL[order.status] || order.status}
                    </span>
                  </div>

                  <div className="orders-v2-highlights">
                    <span>{getRelativeTime(order.createdAt)}</span>
                    <span>{elapsed} min em fila</span>
                    <span>{order.items.length} item(ns)</span>
                    <span>{order.paymentStatus}</span>
                  </div>

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
                    <div className="orders-v2-total-wrap">
                      <strong>{formatCurrency(order.total)}</strong>
                      <small>{order.cliente.observacoes || "Sem observacoes do cliente."}</small>
                    </div>

                    <div className="orders-v2-actions">
                      <button
                        type="button"
                        className="orders-v2-action soft"
                        onClick={() => navigate(`/admin-loja/${storeId}/pedidos/${order.id}/imprimir`)}
                      >
                        <MdLocalPrintshop /> Imprimir
                      </button>

                      {!["CONCLUIDO", "CANCELADO", "RECUSADO"].includes(order.status) ? (
                        <button
                          type="button"
                          className="orders-v2-action cancel"
                          onClick={() => handleCancel(order)}
                          disabled={busyOrderId === order.id}
                        >
                          <MdClose /> Cancelar
                        </button>
                      ) : null}

                      <button
                        type="button"
                        className={`orders-v2-action ${order.status === "NOVO" ? "accept" : "soft"}`}
                        onClick={() => handleAdvance(order)}
                        disabled={busyOrderId === order.id}
                      >
                        {busyOrderId === order.id ? "Salvando..." : getActionLabel(order.status)}
                      </button>
                    </div>
                  </div>

                  <div className="orders-v2-footer-links">
                    <button type="button" className="orders-v2-link-button" onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}>
                      {isExpanded ? "Ocultar historico" : "Ver historico"}
                    </button>
                    <small>{order.cliente.enderecoEntrega || "Sem endereco informado"}</small>
                  </div>

                  {isExpanded ? (
                    <div className="orders-v2-history">
                      {order.history?.length ? (
                        order.history.map((entry) => (
                          <div key={entry.id} className="orders-v2-history-row">
                            <div>
                              <strong>{entry.previousStatus ? `${entry.previousStatus} → ${entry.nextStatus}` : entry.nextStatus}</strong>
                              <p>{entry.note || "Alteracao registrada sem observacao."}</p>
                            </div>
                            <small>{formatDate(entry.createdAt)}</small>
                          </div>
                        ))
                      ) : (
                        <p className="muted">Sem historico disponivel.</p>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </section>

      <nav className="orders-v2-nav" aria-label="Navegacao do painel">
        <NavLink to={`/admin-loja/${storeId}`} end className={({ isActive }) => (isActive ? "active" : "")}>
          <span><MdDashboard /></span>
          <small>Inicio</small>
        </NavLink>
        <NavLink to={`/admin-loja/${storeId}/pedidos`} className={({ isActive }) => (isActive ? "active" : "")}>
          <span><MdReceiptLong /></span>
          <small>Pedidos</small>
        </NavLink>
        <NavLink to={`/admin-loja/${storeId}/cardapio`} className={({ isActive }) => (isActive ? "active" : "")}>
          <span><MdRestaurantMenu /></span>
          <small>Catalogo</small>
        </NavLink>
        <NavLink to={`/admin-loja/${storeId}/ajustes`} className={({ isActive }) => (isActive ? "active" : "")}>
          <span><MdSettings /></span>
          <small>Ajustes</small>
        </NavLink>
      </nav>
    </MerchantPanelShell>
  );
}
