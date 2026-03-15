import AdminLayout from "../components/AdminLayout";
import { useApp } from "../store/AppContext";
import { formatDate } from "../utils/format";

export default function SuperAdminLogsPage() {
  const { state, actions } = useApp();

  const links = [
    { to: "/admin-temnaarea", label: "Dashboard" },
    { to: "/admin-temnaarea/lojas", label: "Lojas" },
    { to: "/admin-temnaarea/logs", label: "Logs" }
  ];

  return (
    <AdminLayout title="Logs de acoes" subtitle="Historico do Tem na Area" links={links} onLogout={actions.logoutSuperAdmin}>
      <section className="dashboard-kpi-grid neon-gap">
        <article className="dashboard-kpi-card">
          <h4>Total de logs</h4>
          <strong>{state.logs.length}</strong>
          <p>Eventos retornados pela API.</p>
        </article>
      </section>

      <section className="dashboard-panel neon-gap">
        <div className="dashboard-mini-list">
          {state.logs.map((log) => (
            <article key={log.id} className="log-item log-item-neon">
              <div className="log-item-top">
                <strong>{log.actionType}</strong>
                <em>{formatDate(log.createdAt)}</em>
              </div>
              <p>{log.storeName}</p>
              <small>{log.motivo}</small>
            </article>
          ))}
          {!state.logs.length ? <p className="muted">Nenhuma acao registrada.</p> : null}
        </div>
      </section>
    </AdminLayout>
  );
}
