import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MdAdd, MdPointOfSale, MdRemove, MdSavings } from "react-icons/md";
import MerchantPanelShell from "../components/merchant/MerchantPanelShell";
import { MerchantPanelMissingState } from "../components/merchant/MerchantPanelState";
import { api } from "../services/api";
import { useApp } from "../store/AppContext";
import { formatCurrency, formatDate } from "../utils/format";

const MOVEMENT_TYPES = [
  { id: "ENTRADA", label: "Entrada" },
  { id: "SAIDA", label: "Saida" },
  { id: "REFORCO", label: "Reforco" },
  { id: "SANGRIA", label: "Sangria" }
];

export default function MerchantCashRegisterPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { state, actions } = useApp();

  const store = state.stores.find((item) => item.id === storeId);
  const token = state.sessions.merchantToken;

  const [currentSession, setCurrentSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [openForm, setOpenForm] = useState({ valor_inicial: "0", observacoes_abertura: "" });
  const [movementForm, setMovementForm] = useState({ tipo_movimentacao: "REFORCO", valor: "", observacoes: "" });
  const [closeForm, setCloseForm] = useState({ valor_real: "", observacoes_fechamento: "" });

  const summary = useMemo(() => ({
    expected: Number(currentSession?.valor_esperado || 0),
    sales: Number(currentSession?.vendas_recebidas || 0),
    entries: Number(currentSession?.totais_movimentacao?.entradas || 0),
    outputs: Number(currentSession?.totais_movimentacao?.saidas || 0)
  }), [currentSession]);

  useEffect(() => {
    if (!token) {
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const result = await api.merchantCashRegister(token);
        setCurrentSession(result.current || null);
        setHistory(result.history || []);
      } catch (error) {
        setFeedback(error.message || "Nao foi possivel carregar o caixa.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  if (!store) {
    return <MerchantPanelMissingState description="Nao foi possivel carregar o modulo de caixa desta operacao." />;
  }

  async function refreshCashRegister() {
    if (!token) {
      return;
    }

    setLoading(true);
    try {
      const result = await api.merchantCashRegister(token);
      setCurrentSession(result.current || null);
      setHistory(result.history || []);
    } finally {
      setLoading(false);
    }
  }

  async function openCashRegister(event) {
    event.preventDefault();
    if (!token) {
      return;
    }

    setFeedback("");
    setLoading(true);
    try {
      const result = await api.openMerchantCashRegister(token, {
        valor_inicial: Number(openForm.valor_inicial || 0),
        observacoes_abertura: openForm.observacoes_abertura.trim()
      });
      setCurrentSession(result.session || null);
      setOpenForm({ valor_inicial: "0", observacoes_abertura: "" });
      setFeedback("Caixa aberto com sucesso.");
      await refreshCashRegister();
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel abrir o caixa.");
    } finally {
      setLoading(false);
    }
  }

  async function createMovement(event) {
    event.preventDefault();
    if (!token || !currentSession?.id) {
      return;
    }

    setFeedback("");
    setLoading(true);
    try {
      const result = await api.createMerchantCashMovement(token, currentSession.id, {
        tipo_movimentacao: movementForm.tipo_movimentacao,
        valor: Number(movementForm.valor || 0),
        observacoes: movementForm.observacoes.trim()
      });
      setCurrentSession(result.session || null);
      setMovementForm({ tipo_movimentacao: "REFORCO", valor: "", observacoes: "" });
      setFeedback("Movimentacao registrada com sucesso.");
      await refreshCashRegister();
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel registrar a movimentacao.");
    } finally {
      setLoading(false);
    }
  }

  async function closeCashRegister(event) {
    event.preventDefault();
    if (!token || !currentSession?.id) {
      return;
    }

    setFeedback("");
    setLoading(true);
    try {
      const result = await api.closeMerchantCashRegister(token, currentSession.id, {
        valor_real: Number(closeForm.valor_real || 0),
        observacoes_fechamento: closeForm.observacoes_fechamento.trim()
      });
      setCurrentSession(result.session?.status_caixa === "ABERTO" ? result.session : null);
      setCloseForm({ valor_real: "", observacoes_fechamento: "" });
      setFeedback("Caixa fechado com sucesso.");
      await refreshCashRegister();
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel fechar o caixa.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MerchantPanelShell
      storeId={storeId}
      store={store}
      eyebrow="PDV PREMIUM / CAIXA"
      title="Caixa da loja"
      description="Abra, acompanhe e feche o caixa da operacao com valor inicial, movimentacoes e historico recente."
      heroAside={(
        <div className="merchant-dashboard-hero-meta">
          <div className="merchant-dashboard-store-chip">
            <span>Caixa atual</span>
            <strong>{currentSession ? currentSession.status_caixa : "Fechado"}</strong>
          </div>
          <div className="merchant-dashboard-store-chip">
            <span>Valor esperado</span>
            <strong>{formatCurrency(summary.expected)}</strong>
          </div>
        </div>
      )}
      heroActions={(
        <div className="merchant-customers-hero-actions">
          <button type="button" className="btn btn-outline" onClick={refreshCashRegister}>Atualizar</button>
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
          <p>Vendas recebidas</p>
          <strong>{formatCurrency(summary.sales)}</strong>
          <small>Pagamentos capturados no periodo do caixa</small>
        </article>
        <article className="dashboard-kpi-card">
          <p>Entradas e reforcos</p>
          <strong>{formatCurrency(summary.entries)}</strong>
          <small>Movimentos positivos do turno</small>
        </article>
        <article className="dashboard-kpi-card">
          <p>Saidas e sangrias</p>
          <strong>{formatCurrency(summary.outputs)}</strong>
          <small>Movimentos retirados do turno</small>
        </article>
      </section>

      <div className="merchant-customers-layout">
        <section className="dashboard-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="prompt-card-kicker">OPERACAO</p>
              <h3>{currentSession ? "Caixa aberto" : "Abrir caixa"}</h3>
            </div>
          </div>

          {feedback ? <p className={feedback.includes("sucesso") ? "success-text" : "error-text"}>{feedback}</p> : null}
          {loading ? <p className="muted">Atualizando caixa...</p> : null}

          {!currentSession ? (
            <form className="merchant-customers-form" onSubmit={openCashRegister}>
              <label>
                <span>Valor inicial</span>
                <input type="number" step="0.01" value={openForm.valor_inicial} onChange={(event) => setOpenForm((prev) => ({ ...prev, valor_inicial: event.target.value }))} />
              </label>
              <label>
                <span>Observacoes de abertura</span>
                <textarea rows={4} value={openForm.observacoes_abertura} onChange={(event) => setOpenForm((prev) => ({ ...prev, observacoes_abertura: event.target.value }))} />
              </label>
              <button type="submit" className="btn btn-primary">
                <MdSavings />
                Abrir caixa
              </button>
            </form>
          ) : (
            <div className="merchant-customers-detail">
              <div className="merchant-customers-detail-grid">
                <article className="merchant-customers-stat-card">
                  <span>Aberto em</span>
                  <strong>{formatDate(currentSession.aberto_em)}</strong>
                </article>
                <article className="merchant-customers-stat-card">
                  <span>Valor inicial</span>
                  <strong>{formatCurrency(currentSession.valor_inicial)}</strong>
                </article>
                <article className="merchant-customers-stat-card">
                  <span>Valor esperado</span>
                  <strong>{formatCurrency(currentSession.valor_esperado)}</strong>
                </article>
              </div>

              <form className="merchant-customers-form" onSubmit={createMovement}>
                <div className="menu-v2-grid2">
                  <label>
                    <span>Tipo de movimentacao</span>
                    <select value={movementForm.tipo_movimentacao} onChange={(event) => setMovementForm((prev) => ({ ...prev, tipo_movimentacao: event.target.value }))}>
                      {MOVEMENT_TYPES.map((type) => (
                        <option key={type.id} value={type.id}>{type.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Valor</span>
                    <input type="number" step="0.01" value={movementForm.valor} onChange={(event) => setMovementForm((prev) => ({ ...prev, valor: event.target.value }))} />
                  </label>
                </div>
                <label>
                  <span>Observacoes</span>
                  <textarea rows={3} value={movementForm.observacoes} onChange={(event) => setMovementForm((prev) => ({ ...prev, observacoes: event.target.value }))} />
                </label>
                <button type="submit" className="btn btn-outline">
                  {movementForm.tipo_movimentacao === "SAIDA" || movementForm.tipo_movimentacao === "SANGRIA" ? <MdRemove /> : <MdAdd />}
                  Registrar movimentacao
                </button>
              </form>

              <form className="merchant-customers-form" onSubmit={closeCashRegister}>
                <label>
                  <span>Valor real no fechamento</span>
                  <input type="number" step="0.01" value={closeForm.valor_real} onChange={(event) => setCloseForm((prev) => ({ ...prev, valor_real: event.target.value }))} />
                </label>
                <label>
                  <span>Observacoes de fechamento</span>
                  <textarea rows={3} value={closeForm.observacoes_fechamento} onChange={(event) => setCloseForm((prev) => ({ ...prev, observacoes_fechamento: event.target.value }))} />
                </label>
                <button type="submit" className="btn btn-primary" disabled={loading || !closeForm.valor_real}>Fechar caixa</button>
              </form>
            </div>
          )}
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="prompt-card-kicker">HISTORICO</p>
              <h3>Sessoes recentes</h3>
            </div>
          </div>

          <div className="merchant-customers-orders">
            {!history.length ? <p className="muted">Nenhum caixa registrado ainda.</p> : null}
            {history.map((session) => (
              <article key={session.id} className="merchant-customers-order-row">
                <div>
                  <strong>{session.status_caixa}</strong>
                  <p>{formatDate(session.aberto_em)}</p>
                </div>
                <div>
                  <strong>{formatCurrency(session.valor_esperado || 0)}</strong>
                  <small>
                    {session.fechado_em ? `Fechado em ${formatDate(session.fechado_em)}` : "Caixa em andamento"}
                  </small>
                </div>
              </article>
            ))}
          </div>

          {currentSession?.movements?.length ? (
            <div className="merchant-customers-orders">
              <div className="dashboard-panel-head">
                <div>
                  <p className="prompt-card-kicker">MOVIMENTACOES</p>
                  <h3>Turno atual</h3>
                </div>
              </div>
              {currentSession.movements.map((movement) => (
                <article key={movement.id} className="merchant-customers-order-row">
                  <div>
                    <strong>{movement.tipo_movimentacao}</strong>
                    <p>{movement.observacoes || "Sem observacoes"}</p>
                  </div>
                  <div>
                    <strong>{formatCurrency(movement.valor)}</strong>
                    <small>{formatDate(movement.created_at)}</small>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </MerchantPanelShell>
  );
}
