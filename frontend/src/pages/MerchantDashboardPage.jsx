import { Link, useNavigate, useParams } from "react-router-dom";
import MerchantPanelShell from "../components/merchant/MerchantPanelShell";
import { MerchantPanelMissingState } from "../components/merchant/MerchantPanelState";
import { useApp } from "../store/AppContext";
import { formatCurrency, formatDate } from "../utils/format";

function formatDelta(value) {
  const amount = Number(value || 0);
  const signal = amount > 0 ? "+" : "";
  return `${signal}${amount.toFixed(1)}% vs ontem`;
}

function DashboardKpiCard({ title, value, helper, tone = "default" }) {
  return (
    <article className={`dashboard-kpi-card tone-${tone}`}>
      <div className="dashboard-kpi-head">
        <span>{title}</span>
      </div>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function DashboardAlertCard({ alert }) {
  return (
    <article className={`dashboard-alert-card tone-${alert.tone || "info"}`}>
      <strong>{alert.title}</strong>
      <p>{alert.description}</p>
    </article>
  );
}

function DashboardRecentOrders({ orders }) {
  return (
    <article className="dashboard-panel merchant-dashboard-panel">
      <div className="dashboard-panel-head">
        <div>
          <p className="prompt-card-kicker">ULTIMOS PEDIDOS</p>
          <h3>Feed operacional</h3>
        </div>
      </div>

      <div className="dashboard-mini-list">
        {orders.length ? (
          orders.map((order) => (
            <div key={order.id} className="log-item">
              <div className="log-item-top">
                <strong>#{order.codigo || order.id}</strong>
                <span className={`orders-v2-badge status-${String(order.status || order.status_pedido || "").toLowerCase().replace(/_/g, "-")}`}>
                  {order.status || order.status_pedido}
                </span>
              </div>
              <p>{order.cliente?.nome || order.nome_cliente}</p>
              <small>{formatDate(order.createdAt || order.created_at)}</small>
              <em>{formatCurrency(order.total)}</em>
            </div>
          ))
        ) : (
          <p className="muted">Nenhum pedido recente para exibir.</p>
        )}
      </div>
    </article>
  );
}

function DashboardPaymentSummary({ rows }) {
  return (
    <article className="dashboard-panel merchant-dashboard-panel">
      <div className="dashboard-panel-head">
        <div>
          <p className="prompt-card-kicker">PAGAMENTOS</p>
          <h3>Resumo do dia</h3>
        </div>
      </div>

      <div className="dashboard-mini-list">
        {rows.length ? (
          rows.map((row) => (
            <div key={row.label} className="list-row">
              <div>
                <strong>{row.label}</strong>
                <p className="muted">{row.total} pedido(s)</p>
              </div>
              <em>{formatCurrency(row.valor_total)}</em>
            </div>
          ))
        ) : (
          <p className="muted">Sem dados de pagamento no dia.</p>
        )}
      </div>
    </article>
  );
}

function DashboardAlerts({ alerts }) {
  return (
    <article className="dashboard-panel merchant-dashboard-panel">
      <div className="dashboard-panel-head">
        <div>
          <p className="prompt-card-kicker">ALERTAS</p>
          <h3>Prioridades operacionais</h3>
        </div>
      </div>

      <div className="dashboard-alert-list">
        {alerts.length ? alerts.map((alert) => <DashboardAlertCard key={alert.id} alert={alert} />) : <p className="muted">Operacao estavel no momento.</p>}
      </div>
    </article>
  );
}

function DashboardQuickLinks({ storeId, slug }) {
  return (
    <article className="dashboard-panel merchant-dashboard-panel merchant-dashboard-links">
      <div className="dashboard-panel-head">
        <div>
          <p className="prompt-card-kicker">ATALHOS</p>
          <h3>Acesso rapido</h3>
        </div>
      </div>

      <div className="prompt-link-grid">
        <Link to={`/admin-loja/${storeId}/pedidos`} className="prompt-link-tile">PEDIDOS</Link>
        <Link to={`/admin-loja/${storeId}/cardapio`} className="prompt-link-tile">CATALOGO</Link>
        <Link to={`/admin-loja/${storeId}/ajustes`} className="prompt-link-tile">AJUSTES</Link>
        <Link to={slug ? `/loja/${slug}` : `/admin-loja/${storeId}`} className="prompt-link-tile">VITRINE</Link>
      </div>
    </article>
  );
}

export default function MerchantDashboardPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { state, selectors, actions } = useApp();

  const store = state.stores.find((item) => item.id === storeId);
  const orders = selectors.ordersByStore(storeId).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const items = selectors.allItemsByStore(storeId);
  const dashboard = selectors.merchantDashboard(storeId);

  if (!store) {
    return <MerchantPanelMissingState description="Nao foi possivel carregar o painel desta operacao." />;
  }

  const today = dashboard?.today || {
    faturamento_total: orders.filter((order) => new Date(order.createdAt).toDateString() === new Date().toDateString()).reduce((sum, order) => sum + order.total, 0),
    total_pedidos: orders.filter((order) => new Date(order.createdAt).toDateString() === new Date().toDateString()).length,
    pedidos_abertos: orders.filter((order) => ["NOVO", "ACEITO", "EM_PREPARO", "SAIU_PARA_ENTREGA"].includes(order.status)).length,
    ticket_medio: 0
  };
  const summary = dashboard?.summary || {};
  const products = dashboard?.products || {};
  const comparison = dashboard?.comparison || {
    faturamento_total_pct: 0,
    total_pedidos_pct: 0,
    ticket_medio_pct: 0
  };
  const paymentSummary = dashboard?.payment_summary || [];
  const alerts = dashboard?.alerts || [];
  const recentOrders = dashboard?.recent_orders?.length
    ? dashboard.recent_orders
    : orders.slice(0, 6).map((order) => ({
        ...order,
        status_pedido: order.status,
        nome_cliente: order.cliente.nome,
        created_at: order.createdAt
      }));

  const effectiveTicket = Number(today.ticket_medio || 0) || (today.total_pedidos ? today.faturamento_total / today.total_pedidos : 0);

  return (
    <MerchantPanelShell
      storeId={storeId}
      store={store}
      className="prompt-merchant-shell merchant-dashboard-shell"
      bodyClassName="merchant-dashboard-main"
      eyebrow="PAINEL DA LOJA / VISAO GERAL"
      title={store.nome}
      description="Visao operacional premium da loja com indicadores diarios, alertas e feed recente da operacao."
      heroAside={(
        <div className="merchant-dashboard-hero-meta">
          <div className="merchant-dashboard-store-chip">
            <span>Status</span>
            <strong>{store.status}</strong>
          </div>
          <div className="merchant-dashboard-store-chip">
            <span>Categoria</span>
            <strong>{store.categoria || "Loja"}</strong>
          </div>
          <div className="merchant-dashboard-store-chip merchant-dashboard-store-chip-accent">
            <span>Vitrine</span>
            <strong>{store.slug ? "Online" : "Interna"}</strong>
          </div>
        </div>
      )}
      onLogout={() => {
        actions.logoutMerchant();
        navigate("/pdv");
      }}
    >
      <div className="dashboard-kpi-grid merchant-dashboard-stats">
        <DashboardKpiCard title="Vendas do dia" value={formatCurrency(today.faturamento_total)} helper={formatDelta(comparison.faturamento_total_pct)} tone="gold" />
        <DashboardKpiCard title="Pedidos do dia" value={today.total_pedidos} helper={formatDelta(comparison.total_pedidos_pct)} tone="blue" />
        <DashboardKpiCard title="Pedidos em aberto" value={today.pedidos_abertos} helper="Pedidos que exigem acao agora" tone="orange" />
        <DashboardKpiCard title="Ticket medio" value={formatCurrency(effectiveTicket)} helper={formatDelta(comparison.ticket_medio_pct)} tone="violet" />
        <DashboardKpiCard title="Itens ativos" value={products.produtos_ativos || items.filter((item) => item.ativo).length} helper={`${summary.total_pedidos || orders.length} pedidos na base`} tone="green" />
      </div>

      <div className="merchant-dashboard-content">
        <DashboardRecentOrders orders={recentOrders} />
        <DashboardAlerts alerts={alerts} />
      </div>

      <div className="merchant-dashboard-bottom">
        <DashboardPaymentSummary rows={paymentSummary} />
        <DashboardQuickLinks storeId={storeId} slug={store.slug} />
      </div>
    </MerchantPanelShell>
  );
}
