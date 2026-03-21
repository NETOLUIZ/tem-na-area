import { useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import ModalConfirm from "../components/ModalConfirm";
import Table from "../components/Table";
import { useApp } from "../store/AppContext";
import { formatDate } from "../utils/format";

export default function SuperAdminStoresPage() {
  const { state, actions } = useApp();
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [categoryFilter, setCategoryFilter] = useState("TODAS");
  const [cityFilter, setCityFilter] = useState("");
  const [modal, setModal] = useState(null);
  const [leadLoadingId, setLeadLoadingId] = useState(null);
  const [leadError, setLeadError] = useState("");
  const [paidLeadLoadingId, setPaidLeadLoadingId] = useState(null);
  const [paidLeadError, setPaidLeadError] = useState("");

  const links = [
    { to: "/admin-temnaarea", label: "Dashboard" },
    { to: "/admin-temnaarea/lojas", label: "Lojas" },
    { to: "/admin-temnaarea/logs", label: "Logs" }
  ];

  const rows = useMemo(() => {
    const city = cityFilter.trim().toLowerCase();
    return state.adminStores.filter((store) => {
      const okStatus = statusFilter === "TODOS" || store.status === statusFilter;
      const okCategory = categoryFilter === "TODAS" || store.categoria === categoryFilter;
      const okCity = !city || store.endereco.cidade.toLowerCase().includes(city);
      return okStatus && okCategory && okCity;
    });
  }, [state.adminStores, statusFilter, categoryFilter, cityFilter]);

  const columns = [
    { key: "nome", label: "Loja" },
    { key: "categoria", label: "Categoria" },
    { key: "cidade", label: "Cidade", render: (row) => row.endereco.cidade },
    { key: "status", label: "Status" },
    { key: "createdAt", label: "Criada", render: (row) => formatDate(row.createdAt) },
    {
      key: "actions",
      label: "Acoes",
      render: (row) => (
        <div className="inline-actions">
          {row.status === "PENDENTE" ? (
            <button className="btn btn-primary" onClick={() => actions.superAdminAction("APROVAR", row.id, "Aprovacao manual")}>
              Aprovar
            </button>
          ) : null}
          {row.status === "BLOQUEADA" ? (
            <button className="btn btn-outline" onClick={() => actions.superAdminAction("DESBLOQUEAR", row.id, "Desbloqueio")}>
              Desbloquear
            </button>
          ) : (
            <button className="btn btn-outline" onClick={() => setModal({ type: "BLOQUEAR", row })}>
              Bloquear
            </button>
          )}
        </div>
      )
    }
  ];

  const leadColumns = [
    { key: "nome", label: "Negocio" },
    { key: "categoria", label: "Categoria" },
    { key: "cidade", label: "Cidade" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "createdAt", label: "Solicitacao", render: (row) => formatDate(row.createdAt) },
    { key: "status", label: "Status" },
    {
      key: "approve",
      label: "Acoes",
      render: (row) => (
        row.publishedAsCard ? (
          <button className="btn btn-outline" disabled>Publicado</button>
        ) : (
          <button
            className="btn btn-primary"
            disabled={leadLoadingId === row.id}
            onClick={async () => {
              setLeadError("");
              setLeadLoadingId(row.id);
              try {
                await actions.approveFreePlanLead(row.id);
              } catch (error) {
                setLeadError(error.message || "Nao foi possivel aprovar o plano gratis.");
              } finally {
                setLeadLoadingId(null);
              }
            }}
          >
            {leadLoadingId === row.id ? "Aprovando..." : "Aprovar plano gratis"}
          </button>
        )
      )
    }
  ];

  const paidLeadColumns = [
    { key: "nome", label: "Negocio" },
    { key: "categoria", label: "Categoria" },
    { key: "cidade", label: "Cidade" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "createdAt", label: "Solicitacao", render: (row) => formatDate(row.createdAt) },
    { key: "paymentStatus", label: "Pagamento" },
    { key: "status", label: "Status" },
    {
      key: "approve",
      label: "Acoes",
      render: (row) => (
        row.status === "APROVADA" ? (
          <button className="btn btn-outline" disabled>Cadastro aprovado</button>
        ) : row.paymentStatus === "APROVADO" ? (
          <button
            className="btn btn-primary"
            disabled={paidLeadLoadingId === row.id}
            onClick={async () => {
              setPaidLeadError("");
              setPaidLeadLoadingId(row.id);
              try {
                await actions.approvePaidPlanLead(row.id);
              } catch (error) {
                setPaidLeadError(error.message || "Nao foi possivel aprovar o cadastro.");
              } finally {
                setPaidLeadLoadingId(null);
              }
            }}
          >
            {paidLeadLoadingId === row.id ? "Aprovando..." : "Aprovar cadastro"}
          </button>
        ) : (
          <button
            className="btn btn-primary"
            disabled={paidLeadLoadingId === row.id}
            onClick={async () => {
              setPaidLeadError("");
              setPaidLeadLoadingId(row.id);
              try {
                await actions.confirmPaidPlanLead(row.id);
              } catch (error) {
                setPaidLeadError(error.message || "Nao foi possivel confirmar o pagamento.");
              } finally {
                setPaidLeadLoadingId(null);
              }
            }}
          >
            {paidLeadLoadingId === row.id ? "Confirmando..." : "Confirmar pagamento"}
          </button>
        )
      )
    }
  ];

  async function confirmModal() {
    if (!modal) return;
    await actions.superAdminAction(modal.type, modal.row.id, `${modal.type} via painel`);
    setModal(null);
  }

  return (
    <AdminLayout title="Lojas cadastradas" subtitle="Gestao global" links={links} onLogout={actions.logoutSuperAdmin}>
      <section className="dashboard-kpi-grid neon-gap">
        <article className="dashboard-kpi-card">
          <h4>Resultado atual</h4>
          <strong>{rows.length}</strong>
          <p>Lojas no filtro aplicado.</p>
        </article>
        <article className="dashboard-kpi-card">
          <h4>Pendentes</h4>
          <strong>{state.adminStores.filter((store) => store.status === "PENDENTE").length}</strong>
          <p>Operacoes aguardando aprovacao.</p>
        </article>
        <article className="dashboard-kpi-card">
          <h4>Comida</h4>
          <strong>{state.adminStores.filter((store) => store.categoria === "comida").length}</strong>
          <p>Estabelecimentos de alimentacao.</p>
        </article>
        <article className="dashboard-kpi-card">
          <h4>Outras categorias</h4>
          <strong>{state.adminStores.filter((store) => store.categoria !== "comida").length}</strong>
          <p>Servicos e lojas em operacao.</p>
        </article>
      </section>

      <section className="dashboard-panel neon-gap">
        <div className="filters-row">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="TODOS">Todos status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="ATIVA">Ativa</option>
            <option value="BLOQUEADA">Bloqueada</option>
          </select>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="TODAS">Todas as categorias</option>
            <option value="comida">Comida</option>
            <option value="servico">Servico</option>
            <option value="loja">Loja</option>
          </select>
          <input placeholder="Filtrar por cidade" value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} />
        </div>

        <Table columns={columns} rows={rows} emptyText="Nenhuma loja encontrada com esses filtros." />
      </section>

      <section className="dashboard-panel neon-gap">
        <div className="section-title">
          <h3>Solicitacoes do plano pago</h3>
          <span>{state.paidLeads.length} pedidos</span>
        </div>
        {paidLeadError ? <p className="error-text">{paidLeadError}</p> : null}
        <Table columns={paidLeadColumns} rows={state.paidLeads} emptyText="Nenhuma solicitacao do plano pago cadastrada." />
      </section>

      <section className="dashboard-panel neon-gap">
        <div className="section-title">
          <h3>Solicitacoes do plano gratis</h3>
          <span>{state.contactLeads.length} pedidos</span>
        </div>
        {leadError ? <p className="error-text">{leadError}</p> : null}
        <Table columns={leadColumns} rows={state.contactLeads} emptyText="Nenhuma solicitacao do plano gratis cadastrada." />
      </section>

      <ModalConfirm
        open={Boolean(modal)}
        title="Bloquear loja"
        description="A loja sera removida da Home e ficara inacessivel para clientes."
        onCancel={() => setModal(null)}
        onConfirm={confirmModal}
      />
    </AdminLayout>
  );
}
