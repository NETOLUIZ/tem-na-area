import AdminLayout from "../components/AdminLayout";
import { useApp } from "../store/AppContext";

function DonutCard({ value, tone, label }) {
  return (
    <article className="prompt-card prompt-donut-card">
      <div className={`prompt-donut ${tone}`}>
        <div>
          <strong>{value}</strong>
        </div>
      </div>
      <p>{label}</p>
    </article>
  );
}

export default function SuperAdminDashboardPage() {
  const { state, actions } = useApp();
  const summary = state.adminSummary || {};

  const links = [
    { to: "/admin-temnaarea", label: "Dashboard" },
    { to: "/admin-temnaarea/lojas", label: "Lojas" },
    { to: "/admin-temnaarea/logs", label: "Logs" }
  ];

  return (
    <AdminLayout title="Painel estratégico" subtitle="Super Admin" links={links} onLogout={actions.logoutSuperAdmin}>
      <div className="prompt-dashboard-grid">
        <div className="prompt-donut-row">
          <DonutCard value={summary.lojas_ativas || 0} tone="cyan" label="Lojas ativas" />
          <DonutCard value={summary.lojas_pendentes || 0} tone="amber" label="Pendências" />
          <DonutCard value={summary.pedidos_30_dias || 0} tone="lime" label="Pedidos 30 dias" />
          <DonutCard value={summary.solicitacoes_abertas || 0} tone="cyan" label="Solicitações abertas" />
          <DonutCard value={summary.total_lojas || 0} tone="amber" label="Total de lojas" />
        </div>

        <section className="dashboard-panel neon-gap">
          <div className="section-title">
            <h3>Solicitações recentes</h3>
            <span>{state.adminRecentRequests.length} registros</span>
          </div>
          <div className="dashboard-mini-list">
            {state.adminRecentRequests.map((request) => (
              <article key={request.id} className="log-item log-item-neon">
                <div className="log-item-top">
                  <strong>{request.nome_empresa}</strong>
                  <em>{request.status_solicitacao}</em>
                </div>
                <p>{request.categoria_principal}</p>
                <small>{request.status_pagamento}</small>
              </article>
            ))}
            {!state.adminRecentRequests.length ? <p className="muted">Nenhuma solicitação recente.</p> : null}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
