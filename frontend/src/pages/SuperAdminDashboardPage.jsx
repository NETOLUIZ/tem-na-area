import AdminLayout from "../components/AdminLayout";
import { useApp } from "../store/AppContext";

export default function SuperAdminDashboardPage() {
  const { state, actions } = useApp();
  const summary = state.adminSummary || {};

  const links = [
    { to: "/admin-temnaarea", label: "Dashboard" },
    { to: "/admin-temnaarea/lojas", label: "Lojas" },
    { to: "/admin-temnaarea/logs", label: "Logs" }
  ];

  return (
    <AdminLayout title="Global Admin Dashboard" subtitle="Central da rede" links={links} onLogout={actions.logoutSuperAdmin}>
      <div className="super-admin-mobile-dashboard">
        <section className="dashboard-kpi-grid super-admin-mobile-kpis">
          <article className="dashboard-kpi-card">
            <h4>Total GMV</h4>
            <strong>{summary.gmv_total || "$14.5M"}</strong>
            <p>+12.4% last 30 days</p>
          </article>
          <article className="dashboard-kpi-card">
            <h4>New Stores</h4>
            <strong>{summary.lojas_pendentes || 287}</strong>
            <p>+8.2% last 30 days</p>
          </article>
          <article className="dashboard-kpi-card">
            <h4>Active Users</h4>
            <strong>{summary.usuarios_ativos || "1.2M"}</strong>
            <p>+5.1% last 30 days</p>
          </article>
        </section>

        <section className="dashboard-panel super-admin-mobile-panel">
          <div className="section-title">
            <h3>System Logs Preview</h3>
            <span>View all</span>
          </div>
          <div className="dashboard-mini-list">
            {(state.logs || []).slice(0, 4).map((log) => (
              <article key={log.id} className="log-item super-admin-log-row">
                <div className="log-item-top">
                  <strong>{log.actionType}</strong>
                  <em>
                    {log.createdAt
                      ? new Date(log.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                      : "--:--"}
                  </em>
                </div>
                <p>{log.storeName || "Sistema"}</p>
                <small>{log.motivo || "Evento registrado pela plataforma."}</small>
              </article>
            ))}
            {!state.logs?.length ? <p className="muted">Nenhum log recente.</p> : null}
          </div>
        </section>

        <section className="dashboard-panel super-admin-mobile-panel">
          <div className="section-title">
            <h3>Flagged Stores</h3>
            <span>View all</span>
          </div>
          <div className="dashboard-mini-list">
            {state.adminRecentRequests.map((request) => (
              <article key={request.id} className="log-item super-admin-flag-row">
                <div className="log-item-top">
                  <strong>{request.nome_empresa}</strong>
                  <em>{request.status_solicitacao}</em>
                </div>
                <p>Status: {request.status_pagamento || "Em analise"}</p>
                <small>{request.categoria_principal || "Categoria nao informada"}</small>
              </article>
            ))}
            {!state.adminRecentRequests.length ? <p className="muted">Nenhuma entrada sinalizada no momento.</p> : null}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
