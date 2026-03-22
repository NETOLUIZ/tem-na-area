import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MdAdd, MdEdit, MdPointOfSale, MdRefresh, MdSearch, MdSave } from "react-icons/md";
import MerchantPanelShell from "../components/merchant/MerchantPanelShell";
import { MerchantPanelMissingState } from "../components/merchant/MerchantPanelState";
import { api } from "../services/api";
import { useApp } from "../store/AppContext";
import { getUserErrorMessage } from "../utils/errors";
import { formatCurrency, formatDate } from "../utils/format";

const emptyCustomerForm = {
  nome: "",
  telefone: "",
  whatsapp: "",
  email: "",
  cpf_cnpj: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  referencia: ""
};

function toCustomerForm(customer) {
  if (!customer) {
    return emptyCustomerForm;
  }

  return {
    nome: customer.nome || "",
    telefone: customer.telefone || "",
    whatsapp: customer.whatsapp || "",
    email: customer.email || "",
    cpf_cnpj: customer.cpf_cnpj || "",
    cep: customer.endereco?.cep || "",
    logradouro: customer.endereco?.logradouro || "",
    numero: customer.endereco?.numero || "",
    complemento: customer.endereco?.complemento || "",
    bairro: customer.endereco?.bairro || "",
    cidade: customer.endereco?.cidade || "",
    estado: customer.endereco?.estado || "",
    referencia: customer.endereco?.referencia || ""
  };
}

export default function MerchantCustomersPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { state, actions } = useApp();

  const store = state.stores.find((item) => item.id === storeId);
  const token = state.sessions.merchantToken;

  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const timer = setTimeout(async () => {
      setLoadingList(true);
      try {
        const result = await api.merchantCustomers(token, search, 24);
        const nextCustomers = result.customers || [];
        setCustomers(nextCustomers);

        if (!selectedCustomerId && !showForm && nextCustomers[0]) {
          setSelectedCustomerId(String(nextCustomers[0].id));
        }

        if (selectedCustomerId && !showForm && !nextCustomers.some((customer) => String(customer.id) === String(selectedCustomerId))) {
          setSelectedCustomerId(nextCustomers[0] ? String(nextCustomers[0].id) : null);
        }
      } catch (error) {
        setFeedback(getUserErrorMessage(error, "Nao foi possivel carregar os clientes."));
        setCustomers([]);
      } finally {
        setLoadingList(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search, selectedCustomerId, showForm, token]);

  useEffect(() => {
    if (!token || !selectedCustomerId) {
      setSelectedCustomer(null);
      return;
    }

    let active = true;
    setLoadingDetail(true);

    api.merchantCustomerDetail(token, selectedCustomerId)
      .then((result) => {
        if (!active) {
          return;
        }

        const customer = result.customer || null;
        setSelectedCustomer(customer);
        if (!showForm) {
          setCustomerForm(toCustomerForm(customer));
        }
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setSelectedCustomer(null);
        setFeedback(getUserErrorMessage(error, "Nao foi possivel carregar o cliente."));
      })
      .finally(() => {
        if (active) {
          setLoadingDetail(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedCustomerId, showForm, token]);

  const summary = useMemo(() => {
    const totalCustomers = customers.length;
    const customersWithOrders = customers.filter((customer) => Number(customer.metricas?.totalPedidos || 0) > 0).length;
    const totalRevenue = customers.reduce((sum, customer) => sum + Number(customer.metricas?.totalGasto || 0), 0);
    const averageOrders = totalCustomers ? customers.reduce((sum, customer) => sum + Number(customer.metricas?.totalPedidos || 0), 0) / totalCustomers : 0;

    return {
      totalCustomers,
      customersWithOrders,
      totalRevenue,
      averageOrders
    };
  }, [customers]);

  if (!store) {
    return <MerchantPanelMissingState description="Nao foi possivel carregar o modulo de clientes desta operacao." />;
  }

  async function refreshList() {
    if (!token) {
      return;
    }

    setLoadingList(true);
    try {
      const result = await api.merchantCustomers(token, search, 24);
      setCustomers(result.customers || []);
    } finally {
      setLoadingList(false);
    }
  }

  async function saveCustomer() {
    if (!token) {
      return;
    }

    setSaving(true);
    setFeedback("");

    try {
      let nextCustomerId = selectedCustomerId;
      if (showForm && selectedCustomer) {
        await api.updateMerchantCustomer(token, selectedCustomer.id, customerForm);
        setFeedback("Cliente atualizado com sucesso.");
        nextCustomerId = String(selectedCustomer.id);
      } else {
        const result = await api.createMerchantCustomer(token, customerForm);
        nextCustomerId = String(result.customer.id);
        setSelectedCustomerId(nextCustomerId);
        setFeedback(result.reused ? "Cliente ja existia e foi reaproveitado." : "Cliente criado com sucesso.");
      }

      setShowForm(false);
      await refreshList();

      if (nextCustomerId) {
        const detail = await api.merchantCustomerDetail(token, nextCustomerId);
        setSelectedCustomer(detail.customer || null);
      }
    } catch (error) {
      setFeedback(getUserErrorMessage(error, "Nao foi possivel salvar o cliente."));
    } finally {
      setSaving(false);
    }
  }

  function startCreate() {
    setSelectedCustomer(null);
    setSelectedCustomerId(null);
    setCustomerForm(emptyCustomerForm);
    setShowForm(true);
    setFeedback("");
  }

  function startEdit() {
    setCustomerForm(toCustomerForm(selectedCustomer));
    setShowForm(true);
    setFeedback("");
  }

  return (
    <MerchantPanelShell
      storeId={storeId}
      store={store}
      eyebrow="PDV PREMIUM / CLIENTES"
      title="Base de clientes"
      description="Acompanhe recorrencia, historico de pedidos e mantenha o cadastro operacional da loja organizado."
      heroAside={(
        <div className="merchant-dashboard-hero-meta">
          <div className="merchant-dashboard-store-chip">
            <span>Clientes visiveis</span>
            <strong>{summary.totalCustomers}</strong>
          </div>
          <div className="merchant-dashboard-store-chip">
            <span>Total movimentado</span>
            <strong>{formatCurrency(summary.totalRevenue)}</strong>
          </div>
        </div>
      )}
      heroActions={(
        <div className="merchant-customers-hero-actions">
          <button type="button" className="btn btn-outline" onClick={refreshList}>
            <MdRefresh /> Atualizar
          </button>
          <Link className="btn btn-primary" to={`/admin-loja/${storeId}/pdv`}>
            <MdPointOfSale /> Ir para o PDV
          </Link>
        </div>
      )}
      onLogout={() => {
        actions.logoutMerchant();
        navigate("/pdv");
      }}
    >
      <section className="dashboard-kpi-grid">
        <article className="dashboard-kpi-card">
          <p>Clientes com pedidos</p>
          <strong>{summary.customersWithOrders}</strong>
          <small>Base com recorrencia na loja</small>
        </article>
        <article className="dashboard-kpi-card">
          <p>Pedidos por cliente</p>
          <strong>{summary.averageOrders.toFixed(1)}</strong>
          <small>Media da base atual listada</small>
        </article>
        <article className="dashboard-kpi-card">
          <p>Atendimento rapido</p>
          <strong>{selectedCustomer?.metricas?.totalPedidos || 0}</strong>
          <small>Pedidos do cliente selecionado</small>
        </article>
      </section>

      <div className="merchant-customers-layout">
        <section className="dashboard-panel merchant-customers-list-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="prompt-card-kicker">LISTAGEM</p>
              <h3>Clientes da operacao</h3>
            </div>
            <button type="button" className="btn btn-outline" onClick={startCreate}>
              <MdAdd /> Novo cliente
            </button>
          </div>

          <div className="orders-v2-search">
            <span><MdSearch /></span>
            <input
              type="text"
              placeholder="Buscar por nome, telefone, WhatsApp ou email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="merchant-customers-list">
            {loadingList ? <p className="muted">Carregando clientes...</p> : null}
            {!loadingList && !customers.length ? <p className="muted">Nenhum cliente encontrado nesta busca.</p> : null}
            {!loadingList && customers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                className={`merchant-customers-list-item ${String(selectedCustomerId) === String(customer.id) ? "active" : ""}`}
                onClick={() => {
                  setSelectedCustomerId(String(customer.id));
                  setShowForm(false);
                  setFeedback("");
                }}
              >
                <strong>{customer.nome}</strong>
                <span>{customer.whatsapp || customer.telefone || "Sem telefone"}</span>
                <small>
                  {Number(customer.metricas?.totalPedidos || 0)} pedido(s) · {formatCurrency(customer.metricas?.totalGasto || 0)}
                </small>
              </button>
            ))}
          </div>
        </section>

        <section className="dashboard-panel merchant-customers-detail-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="prompt-card-kicker">DETALHE</p>
              <h3>{showForm ? (selectedCustomer ? "Editar cliente" : "Cadastrar cliente") : "Painel do cliente"}</h3>
            </div>
            {!showForm && selectedCustomer ? (
              <button type="button" className="btn btn-outline" onClick={startEdit}>
                <MdEdit /> Editar
              </button>
            ) : null}
          </div>

          {feedback ? <p className={feedback.includes("sucesso") || feedback.includes("reaproveitado") ? "success-text" : "error-text"}>{feedback}</p> : null}

          {showForm ? (
            <div className="merchant-customers-form">
              <div className="menu-v2-grid2">
                <label>
                  <span>Nome</span>
                  <input value={customerForm.nome} onChange={(event) => setCustomerForm((prev) => ({ ...prev, nome: event.target.value }))} />
                </label>
                <label>
                  <span>Telefone</span>
                  <input value={customerForm.telefone} onChange={(event) => setCustomerForm((prev) => ({ ...prev, telefone: event.target.value }))} />
                </label>
              </div>

              <div className="menu-v2-grid2">
                <label>
                  <span>WhatsApp</span>
                  <input value={customerForm.whatsapp} onChange={(event) => setCustomerForm((prev) => ({ ...prev, whatsapp: event.target.value }))} />
                </label>
                <label>
                  <span>Email</span>
                  <input value={customerForm.email} onChange={(event) => setCustomerForm((prev) => ({ ...prev, email: event.target.value }))} />
                </label>
              </div>

              <div className="menu-v2-grid2">
                <label>
                  <span>CEP</span>
                  <input value={customerForm.cep} onChange={(event) => setCustomerForm((prev) => ({ ...prev, cep: event.target.value }))} />
                </label>
                <label>
                  <span>CPF/CNPJ</span>
                  <input value={customerForm.cpf_cnpj} onChange={(event) => setCustomerForm((prev) => ({ ...prev, cpf_cnpj: event.target.value }))} />
                </label>
              </div>

              <div className="menu-v2-grid2">
                <label>
                  <span>Logradouro</span>
                  <input value={customerForm.logradouro} onChange={(event) => setCustomerForm((prev) => ({ ...prev, logradouro: event.target.value }))} />
                </label>
                <label>
                  <span>Numero</span>
                  <input value={customerForm.numero} onChange={(event) => setCustomerForm((prev) => ({ ...prev, numero: event.target.value }))} />
                </label>
              </div>

              <div className="menu-v2-grid2">
                <label>
                  <span>Complemento</span>
                  <input value={customerForm.complemento} onChange={(event) => setCustomerForm((prev) => ({ ...prev, complemento: event.target.value }))} />
                </label>
                <label>
                  <span>Bairro</span>
                  <input value={customerForm.bairro} onChange={(event) => setCustomerForm((prev) => ({ ...prev, bairro: event.target.value }))} />
                </label>
              </div>

              <div className="menu-v2-grid2">
                <label>
                  <span>Cidade</span>
                  <input value={customerForm.cidade} onChange={(event) => setCustomerForm((prev) => ({ ...prev, cidade: event.target.value }))} />
                </label>
                <label>
                  <span>Estado</span>
                  <input value={customerForm.estado} onChange={(event) => setCustomerForm((prev) => ({ ...prev, estado: event.target.value }))} />
                </label>
              </div>

              <label>
                <span>Referencia</span>
                <input value={customerForm.referencia} onChange={(event) => setCustomerForm((prev) => ({ ...prev, referencia: event.target.value }))} />
              </label>

              <div className="merchant-customers-form-actions">
                <button type="button" className="btn btn-primary" onClick={saveCustomer} disabled={saving}>
                  <MdSave /> {saving ? "Salvando..." : "Salvar cliente"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setShowForm(false);
                    setCustomerForm(toCustomerForm(selectedCustomer));
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : loadingDetail ? (
            <p className="muted">Carregando cliente...</p>
          ) : selectedCustomer ? (
            <div className="merchant-customers-detail">
              <div className="merchant-customers-detail-grid">
                <article className="merchant-customers-stat-card">
                  <span>Total gasto</span>
                  <strong>{formatCurrency(selectedCustomer.metricas?.totalGasto || 0)}</strong>
                </article>
                <article className="merchant-customers-stat-card">
                  <span>Pedidos</span>
                  <strong>{selectedCustomer.metricas?.totalPedidos || 0}</strong>
                </article>
                <article className="merchant-customers-stat-card">
                  <span>Ultimo pedido</span>
                  <strong>{selectedCustomer.metricas?.ultimoPedidoEm ? formatDate(selectedCustomer.metricas.ultimoPedidoEm) : "Sem historico"}</strong>
                </article>
              </div>

              <div className="merchant-customers-contact">
                <h4>{selectedCustomer.nome}</h4>
                <p>{selectedCustomer.whatsapp || selectedCustomer.telefone || "Sem telefone cadastrado"}</p>
                <p>{selectedCustomer.email || "Sem email cadastrado"}</p>
                <small>
                  {[selectedCustomer.endereco?.logradouro, selectedCustomer.endereco?.numero, selectedCustomer.endereco?.bairro, selectedCustomer.endereco?.cidade]
                    .filter(Boolean)
                    .join(", ") || "Endereco ainda nao informado"}
                </small>
              </div>

              <div className="merchant-customers-orders">
                <div className="dashboard-panel-head">
                  <div>
                    <p className="prompt-card-kicker">HISTORICO</p>
                    <h3>Ultimos pedidos do cliente</h3>
                  </div>
                </div>

                {!selectedCustomer.pedidosRecentes?.length ? <p className="muted">Esse cliente ainda nao tem pedidos nesta loja.</p> : null}
                {selectedCustomer.pedidosRecentes?.map((order) => (
                  <Link key={order.id} className="merchant-customers-order-row" to={`/admin-loja/${storeId}/pedidos`}>
                    <div>
                      <strong>#{order.codigo || order.id}</strong>
                      <p>{formatDate(order.createdAt)}</p>
                    </div>
                    <div>
                      <strong>{formatCurrency(order.total)}</strong>
                      <small>{order.status} · {order.paymentStatus}</small>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <p className="muted">Selecione um cliente na lista ou crie um novo cadastro.</p>
          )}
        </section>
      </div>
    </MerchantPanelShell>
  );
}
