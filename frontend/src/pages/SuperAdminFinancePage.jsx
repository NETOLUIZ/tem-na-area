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
    { to: "/admin-temnaarea/logs", label: "Logs" }
  ];

  const paidStores = useMemo(() => state.adminStores.filter(isPaidStore), [state.adminStores]);
  const approvedPaidStores = useMemo(() => paidStores.filter(isPaymentApproved), [paidStores]);
  const pendingPaidStores = useMemo(() => paidStores.filter((store) => !isPaymentApproved(store)), [paidStores]);
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
    <AdminLayout title="Financeiro" subtitle="Receita e conversão da rede" links={links} onLogout={actions.logoutSuperAdmin}>
      <section className="dashboard-kpi-grid neon-gap">
        <article className="dashboard-kpi-card">
          <h4>Lojas pagas</h4>
          <strong>{approvedPaidStores.length}</strong>
          <p>Cadastros com pagamento aprovado.</p>
        </article>
        <article className="dashboard-kpi-card">
          <h4>Ativas no plano pago</h4>
          <strong>{activeApprovedStores.length}</strong>
          <p>Operações pagas já rodando na plataforma.</p>
        </article>
        <article className="dashboard-kpi-card">
          <h4>Pendências</h4>
          <strong>{pendingPaidStores.length}</strong>
          <p>Cadastros aguardando confirmação ou aprovação.</p>
        </article>
        <article className="dashboard-kpi-card">
          <h4>Conversão</h4>
          <strong>{conversionRate}%</strong>
          <p>Pagamentos aprovados dentro da base paga.</p>
        </article>
      </section>

      <section className="dashboard-panel neon-gap">
        <div className="section-title">
          <h3>Operações com serviço pago</h3>
          <span>{approvedPaidStores.length} aprovada(s)</span>
        </div>
        <Table columns={columns} rows={approvedPaidStores} emptyText="Nenhuma loja paga aprovada até agora." />
      </section>

      <section className="dashboard-panel neon-gap">
        <div className="section-title">
          <h3>Pagamentos pendentes</h3>
          <span>{pendingPaidStores.length} registro(s)</span>
        </div>
        <Table columns={columns} rows={pendingPaidStores} emptyText="Nenhum pagamento pendente no momento." />
      </section>
    </AdminLayout>
  );
}
