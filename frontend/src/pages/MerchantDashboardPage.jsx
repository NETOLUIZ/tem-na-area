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

function MerchantProgressCard({ title, value }) {
  return (
    <article className="prompt-card prompt-copy-card merchant-dashboard-progress-card">
      <p className="prompt-card-kicker">{title}</p>
      <strong>{value}</strong>
      <span>Resumo operacional da loja em tempo real.</span>
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
          </div>
        </header>

        <div className="prompt-dashboard-grid merchant-dashboard-grid">
          <div className="prompt-donut-row merchant-dashboard-stats">
            <MerchantDonut value={store.metrics.visitasPagina || 0} label="VISITAS" tone="cyan" />
            <MerchantDonut value={store.metrics.cliquesWhatsapp || 0} label="WHATSAPP" tone="amber" />
            <MerchantDonut value={activeItems} label="ITENS ATIVOS" tone="lime" />
            <MerchantProgressCard title="FATURAMENTO" value={formatCurrency(completedRevenue)} />
            <MerchantProgressCard title="PEDIDOS" value={pending} />
          </div>

          <div className="prompt-main-row merchant-dashboard-content">
            <MerchantOrders orders={orders.slice(0, 5)} />
          </div>

          <div className="prompt-bottom-row prompt-bottom-row-merchant merchant-dashboard-links-wrap">
            <MerchantLinks storeId={storeId} slug={store.slug} />
          </div>
        </div>
      </section>
    </main>
  );
}
