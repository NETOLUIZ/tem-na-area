import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import MerchantPanelShell from "../components/merchant/MerchantPanelShell";
import { MerchantPanelMissingState } from "../components/merchant/MerchantPanelState";
import { api } from "../services/api";
import { useApp } from "../store/AppContext";
import { getUserErrorMessage } from "../utils/errors";
import { formatCurrency, formatDate } from "../utils/format";

function formatInputDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

export default function MerchantReportsPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { state, actions } = useApp();

  const store = state.stores.find((item) => item.id === storeId);
  const token = state.sessions.merchantToken;

  const [filters, setFilters] = useState({
    start: formatInputDate(new Date(Date.now() - (6 * 24 * 60 * 60 * 1000))),
    end: formatInputDate(new Date())
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!token) {
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const result = await api.merchantReports(token, filters);
        setReport(result);
      } catch (error) {
        setFeedback(getUserErrorMessage(error, "Nao foi possivel carregar os relatorios."));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [filters, token]);

  const summary = report?.summary || {
    total_pedidos: 0,
    faturamento_total: 0,
    ticket_medio: 0,
    cancelamentos: 0
  };

  const cancellationRate = useMemo(() => {
    if (!summary.total_pedidos) return 0;
    return Number(((summary.cancelamentos / summary.total_pedidos) * 100).toFixed(1));
  }, [summary.cancelamentos, summary.total_pedidos]);

  if (!store) {
    return <MerchantPanelMissingState description="Nao foi possivel carregar os relatorios desta operacao." />;
  }

  return (
    <MerchantPanelShell
      storeId={storeId}
      store={store}
      eyebrow="PDV PREMIUM / RELATORIOS"
      title="Relatorios da loja"
      description="Consulte faturamento, pedidos, pagamentos, categorias e desempenho de produtos por periodo."
      heroAside={(
        <div className="merchant-dashboard-hero-meta">
          <div className="merchant-dashboard-store-chip">
            <span>Periodo</span>
            <strong>{filters.start} ate {filters.end}</strong>
          </div>
          <div className="merchant-dashboard-store-chip">
            <span>Ticket medio</span>
            <strong>{formatCurrency(summary.ticket_medio)}</strong>
          </div>
        </div>
      )}
      heroActions={(
        <div className="merchant-customers-hero-actions">
          <Link className="btn btn-outline" to={`/admin-loja/${storeId}`}>Dashboard</Link>
          <Link className="btn btn-primary" to={`/admin-loja/${storeId}/pedidos`}>Pedidos</Link>
        </div>
      )}
      onLogout={() => {
        actions.logoutMerchant();
        navigate("/pdv");
      }}
    >
      <section className="dashboard-panel">
        <div className="dashboard-panel-head">
          <div>
            <p className="prompt-card-kicker">FILTROS</p>
            <h3>Periodo do relatorio</h3>
          </div>
        </div>
        <div className="menu-v2-grid2">
          <label>
            <span>Inicio</span>
            <input type="date" value={filters.start} onChange={(event) => setFilters((prev) => ({ ...prev, start: event.target.value }))} />
          </label>
          <label>
            <span>Fim</span>
            <input type="date" value={filters.end} onChange={(event) => setFilters((prev) => ({ ...prev, end: event.target.value }))} />
          </label>
        </div>
        <div className="menu-v2-filters hide-scrollbar">
          <button type="button" onClick={() => setFilters({ start: formatInputDate(new Date()), end: formatInputDate(new Date()) })}>
            Hoje
          </button>
          <button type="button" onClick={() => setFilters({ start: formatInputDate(new Date(Date.now() - (6 * 24 * 60 * 60 * 1000))), end: formatInputDate(new Date()) })}>
            7 dias
          </button>
          <button type="button" onClick={() => setFilters({ start: formatInputDate(new Date(Date.now() - (29 * 24 * 60 * 60 * 1000))), end: formatInputDate(new Date()) })}>
            30 dias
          </button>
        </div>
        {feedback ? <p className="error-text">{feedback}</p> : null}
        {loading ? <p className="muted">Atualizando relatorios...</p> : null}
      </section>

      <section className="dashboard-kpi-grid">
        <article className="dashboard-kpi-card">
          <p>Faturamento</p>
          <strong>{formatCurrency(summary.faturamento_total)}</strong>
          <small>Periodo filtrado</small>
        </article>
        <article className="dashboard-kpi-card">
          <p>Pedidos</p>
          <strong>{summary.total_pedidos}</strong>
          <small>Total no periodo</small>
        </article>
        <article className="dashboard-kpi-card">
          <p>Ticket medio</p>
          <strong>{formatCurrency(summary.ticket_medio)}</strong>
          <small>Media por pedido</small>
        </article>
        <article className="dashboard-kpi-card">
          <p>Cancelamentos</p>
          <strong>{summary.cancelamentos}</strong>
          <small>{cancellationRate}% do periodo</small>
        </article>
      </section>

      <div className="merchant-customers-layout">
        <section className="dashboard-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="prompt-card-kicker">EVOLUCAO</p>
              <h3>Faturamento por dia</h3>
            </div>
          </div>
          <div className="merchant-customers-orders">
            {!report?.daily?.length ? <p className="muted">Sem dados diarios para este periodo.</p> : null}
            {report?.daily?.map((row) => (
              <article key={row.date} className="merchant-customers-order-row">
                <div>
                  <strong>{formatDate(row.date)}</strong>
                  <p>{row.total_pedidos} pedido(s)</p>
                </div>
                <div>
                  <strong>{formatCurrency(row.faturamento_total)}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="prompt-card-kicker">PAGAMENTOS E STATUS</p>
              <h3>Distribuicao operacional</h3>
            </div>
          </div>
          <div className="merchant-customers-orders">
            {!report?.payments?.length ? <p className="muted">Sem registros de pagamento detalhados no periodo.</p> : null}
            {report?.payments?.map((row) => (
              <article key={row.label} className="merchant-customers-order-row">
                <div>
                  <strong>{row.label}</strong>
                  <p>{row.total} registro(s)</p>
                </div>
                <div>
                  <strong>{formatCurrency(row.valor_total)}</strong>
                </div>
              </article>
            ))}
            {report?.status?.map((row) => (
              <article key={`status-${row.label}`} className="merchant-customers-order-row">
                <div>
                  <strong>{row.label}</strong>
                  <p>Status de pedido</p>
                </div>
                <div>
                  <strong>{row.total}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="merchant-customers-layout">
        <section className="dashboard-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="prompt-card-kicker">PRODUTOS</p>
              <h3>Mais vendidos</h3>
            </div>
          </div>
          <div className="merchant-customers-orders">
            {!report?.top_products?.length ? <p className="muted">Sem produtos vendidos neste periodo.</p> : null}
            {report?.top_products?.map((row) => (
              <article key={`top-${row.id}`} className="merchant-customers-order-row">
                <div>
                  <strong>{row.nome}</strong>
                  <p>{row.quantidade_total} unidade(s)</p>
                </div>
                <div>
                  <strong>{formatCurrency(row.faturamento_total)}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="prompt-card-kicker">PRODUTOS</p>
              <h3>Menos vendidos</h3>
            </div>
          </div>
          <div className="merchant-customers-orders">
            {!report?.low_products?.length ? <p className="muted">Sem produtos para comparar neste periodo.</p> : null}
            {report?.low_products?.map((row) => (
              <article key={`low-${row.id}`} className="merchant-customers-order-row">
                <div>
                  <strong>{row.nome}</strong>
                  <p>{row.quantidade_total} unidade(s)</p>
                </div>
                <div>
                  <strong>{formatCurrency(row.faturamento_total)}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="dashboard-panel">
        <div className="dashboard-panel-head">
          <div>
            <p className="prompt-card-kicker">CATEGORIAS</p>
            <h3>Desempenho por categoria</h3>
          </div>
        </div>
        <div className="merchant-customers-orders">
          {!report?.categories?.length ? <p className="muted">Sem categorias vendidas neste periodo.</p> : null}
          {report?.categories?.map((row) => (
            <article key={row.label} className="merchant-customers-order-row">
              <div>
                <strong>{row.label}</strong>
                <p>{row.itens_vendidos} item(ns) vendidos</p>
              </div>
              <div>
                <strong>{formatCurrency(row.faturamento_total)}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    </MerchantPanelShell>
  );
}
