import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MdAdd, MdInventory2, MdRemove, MdWarning } from "react-icons/md";
import MerchantPanelShell from "../components/merchant/MerchantPanelShell";
import { MerchantPanelMissingState } from "../components/merchant/MerchantPanelState";
import { api } from "../services/api";
import { useApp } from "../store/AppContext";
import { getUserErrorMessage } from "../utils/errors";
import { formatDate } from "../utils/format";

const MOVEMENT_TYPES = [
  { id: "ENTRADA", label: "Entrada" },
  { id: "SAIDA", label: "Saida" },
  { id: "AJUSTE", label: "Ajuste" }
];

export default function MerchantInventoryPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { state, actions } = useApp();

  const store = state.stores.find((item) => item.id === storeId);
  const token = state.sessions.merchantToken;

  const [inventory, setInventory] = useState({ products: [], movements: [], summary: null });
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [productMovements, setProductMovements] = useState([]);
  const [movementForm, setMovementForm] = useState({ tipo_movimentacao: "ENTRADA", quantidade: "", observacoes: "" });
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("TODOS");

  useEffect(() => {
    if (!token) {
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const result = await api.merchantInventory(token);
        setInventory(result);
        if (!selectedProductId && result.products?.[0]) {
          setSelectedProductId(String(result.products[0].id));
        }
      } catch (error) {
        setFeedback(getUserErrorMessage(error, "Nao foi possivel carregar o estoque."));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  useEffect(() => {
    if (!token || !selectedProductId) {
      setProductMovements([]);
      return;
    }

    api.merchantInventoryMovements(token, selectedProductId, 12)
      .then((result) => setProductMovements(result.movements || []))
      .catch(() => setProductMovements([]));
  }, [selectedProductId, token]);

  const selectedProduct = useMemo(
    () => inventory.products?.find((product) => String(product.id) === String(selectedProductId)) || null,
    [inventory.products, selectedProductId]
  );

  const filteredProducts = useMemo(() => {
    const products = inventory.products || [];
    if (filter === "BAIXO") {
      return products.filter((product) => Number(product.estoque_atual || 0) <= Number(product.estoque_minimo || 0));
    }
    if (filter === "ZERADO") {
      return products.filter((product) => Number(product.estoque_atual || 0) <= 0);
    }
    if (filter === "CONTROLADO") {
      return products.filter((product) => Number(product.controla_estoque ?? 1) === 1);
    }
    return products;
  }, [filter, inventory.products]);

  if (!store) {
    return <MerchantPanelMissingState description="Nao foi possivel carregar o modulo de estoque desta operacao." />;
  }

  async function refreshInventory() {
    if (!token) {
      return;
    }

    setLoading(true);
    try {
      const result = await api.merchantInventory(token);
      setInventory(result);
    } finally {
      setLoading(false);
    }
  }

  async function createMovement(event) {
    event.preventDefault();
    if (!token || !selectedProductId) {
      return;
    }

    setFeedback("");
    setLoading(true);
    try {
      await api.createMerchantInventoryMovement(token, selectedProductId, {
        tipo_movimentacao: movementForm.tipo_movimentacao,
        quantidade: Number(movementForm.quantidade || 0),
        observacoes: movementForm.observacoes.trim()
      });
      setMovementForm({ tipo_movimentacao: "ENTRADA", quantidade: "", observacoes: "" });
      setFeedback("Movimentacao de estoque registrada.");
      await refreshInventory();
      const detail = await api.merchantInventoryMovements(token, selectedProductId, 12);
      setProductMovements(detail.movements || []);
    } catch (error) {
      setFeedback(getUserErrorMessage(error, "Nao foi possivel registrar a movimentacao."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <MerchantPanelShell
      storeId={storeId}
      store={store}
      eyebrow="PDV PREMIUM / ESTOQUE"
      title="Estoque da loja"
      description="Controle entradas, saidas e ajustes de estoque com historico operacional sem depender da tela de cardapio."
      heroAside={(
        <div className="merchant-dashboard-hero-meta">
          <div className="merchant-dashboard-store-chip">
            <span>Produtos</span>
            <strong>{inventory.summary?.total_products || 0}</strong>
          </div>
          <div className="merchant-dashboard-store-chip">
            <span>Baixo estoque</span>
            <strong>{inventory.summary?.low_stock || 0}</strong>
          </div>
          <div className="merchant-dashboard-store-chip">
            <span>Zerados</span>
            <strong>{inventory.summary?.out_of_stock || 0}</strong>
          </div>
        </div>
      )}
      heroActions={(
        <div className="merchant-customers-hero-actions">
          <button type="button" className="btn btn-outline" onClick={refreshInventory}>Atualizar</button>
          <Link className="btn btn-primary" to={`/admin-loja/${storeId}/cardapio`}>
            <MdInventory2 /> Ir para o cardapio
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
          <p>Itens com alerta</p>
          <strong>{inventory.summary?.low_stock || 0}</strong>
          <small>Produtos no minimo ou abaixo dele</small>
        </article>
        <article className="dashboard-kpi-card">
          <p>Itens zerados</p>
          <strong>{inventory.summary?.out_of_stock || 0}</strong>
          <small>Produtos que exigem reposicao imediata</small>
        </article>
        <article className="dashboard-kpi-card">
          <p>Movimentacoes recentes</p>
          <strong>{inventory.movements?.length || 0}</strong>
          <small>Ultimos registros do estoque</small>
        </article>
      </section>

      <div className="merchant-customers-layout">
        <section className="dashboard-panel merchant-customers-list-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="prompt-card-kicker">PRODUTOS</p>
              <h3>Visao operacional</h3>
            </div>
          </div>

          <div className="menu-v2-filters hide-scrollbar">
            {[
              { id: "TODOS", label: "Todos" },
              { id: "BAIXO", label: "Baixo estoque" },
              { id: "ZERADO", label: "Zerados" },
              { id: "CONTROLADO", label: "Controlados" }
            ].map((entry) => (
              <button key={entry.id} type="button" className={filter === entry.id ? "active" : ""} onClick={() => setFilter(entry.id)}>
                {entry.label}
              </button>
            ))}
          </div>

          <div className="merchant-customers-list">
            {loading ? <p className="muted">Atualizando estoque...</p> : null}
            {!loading && !filteredProducts.length ? <p className="muted">Nenhum produto neste filtro.</p> : null}
            {filteredProducts.map((product) => {
              const lowStock = Number(product.estoque_atual || 0) <= Number(product.estoque_minimo || 0);
              return (
                <button
                  key={product.id}
                  type="button"
                  className={`merchant-customers-list-item ${String(selectedProductId) === String(product.id) ? "active" : ""}`}
                  onClick={() => setSelectedProductId(String(product.id))}
                >
                  <strong>{product.nome}</strong>
                  <span>SKU: {product.sku || "Nao informado"}</span>
                  <small>
                    Atual: {product.estoque_atual} · Minimo: {product.estoque_minimo}
                    {lowStock ? " · Alerta" : ""}
                  </small>
                </button>
              );
            })}
          </div>
        </section>

        <section className="dashboard-panel merchant-customers-detail-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="prompt-card-kicker">MOVIMENTACAO</p>
              <h3>{selectedProduct ? selectedProduct.nome : "Selecione um produto"}</h3>
            </div>
          </div>

          {feedback ? <p className={feedback.includes("registrada") ? "success-text" : "error-text"}>{feedback}</p> : null}

          {selectedProduct ? (
            <div className="merchant-customers-detail">
              <div className="merchant-customers-detail-grid">
                <article className="merchant-customers-stat-card">
                  <span>Estoque atual</span>
                  <strong>{selectedProduct.estoque_atual}</strong>
                </article>
                <article className="merchant-customers-stat-card">
                  <span>Estoque minimo</span>
                  <strong>{selectedProduct.estoque_minimo}</strong>
                </article>
                <article className="merchant-customers-stat-card">
                  <span>Status</span>
                  <strong>{selectedProduct.status_produto}</strong>
                </article>
              </div>

              {Number(selectedProduct.estoque_atual || 0) <= Number(selectedProduct.estoque_minimo || 0) ? (
                <div className="register-v2-note">
                  <strong><MdWarning /> Alerta operacional</strong>
                  <span>Esse item esta no minimo configurado ou abaixo dele.</span>
                </div>
              ) : null}

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
                    <span>Quantidade</span>
                    <input type="number" min="1" value={movementForm.quantidade} onChange={(event) => setMovementForm((prev) => ({ ...prev, quantidade: event.target.value }))} />
                  </label>
                </div>

                <label>
                  <span>Observacoes</span>
                  <textarea rows={3} value={movementForm.observacoes} onChange={(event) => setMovementForm((prev) => ({ ...prev, observacoes: event.target.value }))} />
                </label>

                <button type="submit" className="btn btn-primary" disabled={loading || !movementForm.quantidade}>
                  {movementForm.tipo_movimentacao === "SAIDA" ? <MdRemove /> : <MdAdd />}
                  Registrar movimentacao
                </button>
              </form>

              <div className="merchant-customers-orders">
                <div className="dashboard-panel-head">
                  <div>
                    <p className="prompt-card-kicker">HISTORICO</p>
                    <h3>Ultimas movimentacoes</h3>
                  </div>
                </div>
                {!productMovements.length ? <p className="muted">Nenhuma movimentacao para este produto.</p> : null}
                {productMovements.map((movement) => (
                  <article key={movement.id} className="merchant-customers-order-row">
                    <div>
                      <strong>{movement.tipo_movimentacao}</strong>
                      <p>{movement.observacoes || "Sem observacoes"}</p>
                    </div>
                    <div>
                      <strong>{movement.quantidade}</strong>
                      <small>{movement.estoque_anterior} para {movement.estoque_atual} · {formatDate(movement.created_at)}</small>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <p className="muted">Selecione um produto para movimentar o estoque.</p>
          )}
        </section>
      </div>
    </MerchantPanelShell>
  );
}
