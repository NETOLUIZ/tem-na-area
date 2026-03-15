import { Link, useNavigate, useParams } from "react-router-dom";
import MerchantDesktopSidebar from "../components/MerchantDesktopSidebar";
import { useApp } from "../store/AppContext";
import { formatCurrency } from "../utils/format";

function MerchantDonut({ value, label, tone }) {
  return (
    <article className="prompt-card prompt-donut-card merchant-dashboard-stat-card">
      <div className={`prompt-donut ${tone}`}>
        <div>
          <strong>{value}</strong>
        </div>
      </div>
      <p>{label}</p>
    </article>
  );
}

function MerchantProgressCard({ title, value, bars }) {
  return (
    <article className="prompt-card prompt-copy-card merchant-dashboard-progress-card">
      <p className="prompt-card-kicker">{title}</p>
      <strong>{value}</strong>
      <span>Resumo operacional da loja em tempo real.</span>
      <div className="prompt-progress-stack">
        {bars.map((bar, index) => (
          <div key={index} className="prompt-progress-line">
            <i style={{ width: `${bar}%` }} />
          </div>
        ))}
      </div>
    </article>
  );
}

function MerchantBars({ values }) {
  return (
    <article className="prompt-card prompt-bars-widget merchant-dashboard-bars-card">
      <div className="prompt-widget-head">
        <div>
          <p className="prompt-card-kicker">CARDAPIO</p>
          <h3>Itens e destaque</h3>
        </div>
      </div>
      <div className="prompt-bars-row">
        {values.map((bar, index) => (
          <span key={index} style={{ height: `${bar}%` }} />
        ))}
      </div>
    </article>
  );
}

function MerchantOrders({ orders }) {
  return (
    <article className="prompt-card prompt-activities-widget merchant-dashboard-orders-card">
      <p className="prompt-card-kicker">PEDIDOS RECENTES</p>
      <div className="prompt-merchant-rows">
        {orders.length ? (
          orders.map((order) => (
            <div key={order.id} className="prompt-merchant-row">
              <div>
                <strong>{order.id}</strong>
                <span>{order.cliente.nome}</span>
              </div>
              <em>{formatCurrency(order.total)}</em>
            </div>
          ))
        ) : (
          <span>Nenhum pedido recente para exibir.</span>
        )}
      </div>
    </article>
  );
}

function MerchantLinks({ storeId, slug }) {
  return (
    <article className="prompt-card prompt-slider-widget prompt-merchant-links merchant-dashboard-links-card">
      <div className="prompt-link-grid">
        <Link to={`/admin-loja/${storeId}/cardapio`} className="prompt-link-tile">CARDAPIO</Link>
        <Link to={`/admin-loja/${storeId}/pedidos`} className="prompt-link-tile">PEDIDOS</Link>
        <Link to={`/admin-loja/${storeId}/ajustes`} className="prompt-link-tile">AJUSTES</Link>
        <Link to={slug ? `/loja/${slug}` : `/admin-loja/${storeId}`} className="prompt-link-tile">LOJA</Link>
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

  if (!store) {
    return (
      <main className="container page-space">
        <div className="empty-state">
          <h3>Loja nao encontrada</h3>
          <p>Nao foi possivel carregar o painel dessa loja.</p>
          <Link className="btn btn-primary" to="/">Voltar para Home</Link>
        </div>
      </main>
    );
  }

  const completedRevenue = orders
    .filter((order) => order.status === "CONCLUIDO")
    .reduce((sum, order) => sum + order.total, 0);
  const pending = orders.filter((order) => ["NOVO", "ACEITO", "EM_PREPARO", "SAIU_PARA_ENTREGA"].includes(order.status)).length;
  const activeItems = items.filter((item) => item.ativo).length;
  const sampleBars = [56, 66, 48, 72, 84, 62, 70, 58];

  return (
    <main className="store-panel-page merchant-has-sidebar prompt-merchant-shell">
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

      <section className="prompt-merchant-main merchant-dashboard-main">
        <header className="prompt-topbar prompt-topbar-merchant merchant-dashboard-hero">
          <div className="merchant-dashboard-hero-copy">
            <p className="prompt-breadcrumb">PAINEL DA LOJA / VISAO GERAL</p>
            <h1>{store.nome}</h1>
            <p className="merchant-dashboard-subtitle">
              Acompanhe pedidos, cardapio e desempenho da loja em um painel mais organizado.
            </p>
          </div>

          <div className="prompt-topbar-right merchant-dashboard-hero-meta">
            <div className="merchant-dashboard-store-chip">
              <span>Status</span>
              <strong>{store.status}</strong>
            </div>
            <div className="merchant-dashboard-store-chip">
              <span>Categoria</span>
              <strong>{store.categoria || "Loja"}</strong>
            </div>
            <div className="prompt-avatar" aria-hidden="true">{store.nome.slice(0, 1)}</div>
          </div>
        </header>

        <div className="prompt-dashboard-grid merchant-dashboard-grid">
          <div className="prompt-donut-row merchant-dashboard-stats">
            <MerchantDonut value={store.metrics.visitasPagina || 0} label="VISITAS" tone="cyan" />
            <MerchantDonut value={store.metrics.cliquesWhatsapp || 0} label="WHATSAPP" tone="amber" />
            <MerchantDonut value={activeItems} label="ITENS ATIVOS" tone="lime" />
            <MerchantProgressCard title="FATURAMENTO" value={formatCurrency(completedRevenue)} bars={[78, 64, 88]} />
            <MerchantProgressCard title="PEDIDOS" value={pending} bars={[62, 82, 54]} />
          </div>

          <div className="prompt-main-row merchant-dashboard-content">
            <MerchantOrders orders={orders.slice(0, 5)} />
            <MerchantBars values={sampleBars} />
          </div>

          <div className="prompt-bottom-row prompt-bottom-row-merchant merchant-dashboard-links-wrap">
            <MerchantLinks storeId={storeId} slug={store.slug} />
          </div>
        </div>
      </section>
    </main>
  );
}
