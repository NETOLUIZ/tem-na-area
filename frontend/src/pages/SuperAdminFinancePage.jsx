import { useMemo } from "react";
import AdminLayout from "../components/AdminLayout";
import Table from "../components/Table";
import { useApp } from "../store/AppContext";
import { formatDate } from "../utils/format";

function isPaidStore(store) {
  return store.planType && store.planType !== "FREE";
}

function isPaymentApproved(store) {
  return store.paymentStatus === "APROVADO";
}

export default function SuperAdminFinancePage() {
  const { state, actions } = useApp();

  const links = [
    { to: "/admin-temnaarea", label: "Dashboard" },
    { to: "/admin-temnaarea/lojas", label: "Lojas" },
    { to: "/admin-temnaarea/logs", label: "Logs" },
    { to: "/admin-temnaarea/financeiro", label: "Financeiro" }
  ];

  const paidStores = useMemo(
    () => state.adminStores.filter(isPaidStore),
    [state.adminStores]
  );

  const approvedPaidStores = useMemo(
    () => paidStores.filter(isPaymentApproved),
    [paidStores]
  );

  const pendingPaidStores = useMemo(
    () => paidStores.filter((store) => !isPaymentApproved(store)),
    [paidStores]
  );

  const activeApprovedStores = useMemo(
    () => approvedPaidStores.filter((store) => store.status === "ATIVA"),
    [approvedPaidStores]
  );

  const conversionRate = paidStores.length
    ? Math.round((approvedPaidStores.length / paidStores.length) * 100)
    : 0;

  const columns = [
    { key: "nome", label: "Loja" },
    { key: "planName", label: "Plano" },
    { key: "categoria", label: "Categoria" },
    { key: "status", label: "Status da loja" },
    { key: "paymentStatus", label: "Pagamento" },
    { key: "createdAt", label: "Entrada", render: (row) => formatDate(row.createdAt) }
  ];

  return (
    <AdminLayout title="Financeiro" subtitle="Conversao de lojas pagas" links={links} onLogout={actions.logoutSuperAdmin}>
      <section className="dashboard-kpi-grid neon-gap">
        <article className="dashboard-kpi-card">
          <h4>Lojas pagas</h4>
          <strong>{approvedPaidStores.length}</strong>
          <p>Cadastros com pagamento aprovado.</p>
        </article>
        <article className="dashboard-kpi-card">
          <h4>Ativas no plano pago</h4>
          <strong>{activeApprovedStores.length}</strong>
          <p>Lojas pagas ja operando no painel.</p>
        </article>
        <article className="dashboard-kpi-card">
          <h4>Pendentes</h4>
          <strong>{pendingPaidStores.length}</strong>
          <p>Cadastros pagos aguardando aprovacao ou confirmacao.</p>
        </article>
        <article className="dashboard-kpi-card">
          <h4>Conversao</h4>
          <strong>{conversionRate}%</strong>
          <p>Pagamento aprovado dentro das lojas do plano pago.</p>
        </article>
      </section>

      <section className="dashboard-panel neon-gap">
        <div className="section-title">
          <h3>Lojas com servico pago</h3>
          <span>{approvedPaidStores.length} aprovadas</span>
        </div>
        <Table columns={columns} rows={approvedPaidStores} emptyText="Nenhuma loja paga aprovada ate agora." />
      </section>

      <section className="dashboard-panel neon-gap">
        <div className="section-title">
          <h3>Pagamentos pendentes</h3>
          <span>{pendingPaidStores.length} registros</span>
        </div>
        <Table columns={columns} rows={pendingPaidStores} emptyText="Nenhum pagamento pendente no momento." />
      </section>
    </AdminLayout>
  );
}
