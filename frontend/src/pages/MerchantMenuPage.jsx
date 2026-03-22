import { useMemo, useState } from "react";
import { MdArrowBack, MdInventory2, MdRestaurantMenu, MdStar, MdTune } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import MerchantOptionGroupManager from "../components/MerchantOptionGroupManager";
import MerchantPanelShell from "../components/merchant/MerchantPanelShell";
import { MerchantPanelMissingState } from "../components/merchant/MerchantPanelState";
import SmartImage from "../components/SmartImage";
import { useApp } from "../store/AppContext";
import { formatCurrency, formatDate } from "../utils/format";

const CATEGORIAS = ["Destaques", "Combos", "Bebidas", "Outros"];
const PRODUCT_TYPES = [
  { id: "PADRAO", label: "Padrao" },
  { id: "COMBO", label: "Combo" },
  { id: "PROMOCIONAL", label: "Promocional" },
  { id: "VARIACAO", label: "Variacao" }
];

const emptyItem = {
  nome: "",
  categoria: "Outros",
  descricao: "",
  descricaoCurta: "",
  sku: "",
  preco: "",
  precoAntigo: "",
  custo: "",
  imagem: "",
  ordemExibicao: "0",
  estoqueAtual: "0",
  estoqueMinimo: "0",
  pesoGramas: "",
  disponivelInicio: "",
  disponivelFim: "",
  tipoProduto: "PADRAO",
  controlaEstoque: true,
  permiteVendaSemEstoque: false,
  destaqueHome: false,
  destaqueCardapio: false,
  ativo: true,
  esgotado: false
};

const emptyPromotion = {
  itemId: "",
  title: "",
  subtitle: "",
  badge: "Destaque",
  active: true
};

function toForm(item) {
  if (!item) {
    return emptyItem;
  }

  return {
    nome: item.nome,
    categoria: item.categoria || "Outros",
    descricao: item.descricao || "",
    descricaoCurta: item.descricaoCurta || "",
    sku: item.sku || "",
    preco: String(item.preco),
    precoAntigo: item.precoAntigo ? String(item.precoAntigo) : "",
    custo: item.custo != null ? String(item.custo) : "",
    imagem: item.imagem || "",
    ordemExibicao: String(item.ordemExibicao || 0),
    estoqueAtual: String(item.estoqueAtual || 0),
    estoqueMinimo: String(item.estoqueMinimo || 0),
    pesoGramas: item.pesoGramas != null ? String(item.pesoGramas) : "",
    disponivelInicio: item.disponivelInicio || "",
    disponivelFim: item.disponivelFim || "",
    tipoProduto: item.tipoProduto || "PADRAO",
    controlaEstoque: item.controlaEstoque !== false,
    permiteVendaSemEstoque: Boolean(item.permiteVendaSemEstoque),
    destaqueHome: Boolean(item.destaqueHome),
    destaqueCardapio: Boolean(item.destaqueCardapio),
    ativo: Boolean(item.ativo),
    esgotado: Boolean(item.esgotado)
  };
}

export default function MerchantMenuPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { state, selectors, actions } = useApp();

  const store = state.stores.find((item) => item.id === storeId);
  const [editingId, setEditingId] = useState(null);
  const [editingPromotionId, setEditingPromotionId] = useState(null);
  const [activeTab, setActiveTab] = useState("form");
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [form, setForm] = useState(emptyItem);
  const [promotionForm, setPromotionForm] = useState(emptyPromotion);
  const [promotionMessage, setPromotionMessage] = useState("");
  const [savingItem, setSavingItem] = useState(false);

  const items = selectors.allItemsByStore(storeId);
  const promotions = selectors.homePromotionsByStore(storeId);
  const optionGroups = selectors.optionGroupsByStore(storeId);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeFilter === "Todos") return true;
      if (activeFilter === "Destaque") return item.destaqueCardapio || item.destaqueHome;
      if (activeFilter === "Promocional") return Boolean(item.precoAntigo) || item.tipoProduto === "PROMOCIONAL";
      if (activeFilter === "Esgotado") return item.esgotado;
      return (item.categoria || "Outros") === activeFilter;
    });
  }, [activeFilter, items]);

  const menuSummary = useMemo(() => ({
    total: items.length,
    ativos: items.filter((item) => item.ativo).length,
    esgotados: items.filter((item) => item.esgotado).length,
    destaques: items.filter((item) => item.destaqueCardapio || item.destaqueHome).length
  }), [items]);

  function resetForm() {
    setForm(emptyItem);
    setEditingId(null);
  }

  function resetPromotionForm() {
    setPromotionForm(emptyPromotion);
    setEditingPromotionId(null);
  }

  async function submit(event) {
    event.preventDefault();
    setSavingItem(true);
    await actions.upsertMenuItem(
      storeId,
      {
        ...form,
        preco: Number(form.preco),
        precoAntigo: form.precoAntigo ? Number(form.precoAntigo) : null,
        custo: form.custo ? Number(form.custo) : null,
        ordemExibicao: Number(form.ordemExibicao || 0),
        estoqueAtual: Number(form.estoqueAtual || 0),
        estoqueMinimo: Number(form.estoqueMinimo || 0),
        pesoGramas: form.pesoGramas ? Number(form.pesoGramas) : null
      },
      editingId
    );
    setSavingItem(false);
    resetForm();
    setActiveTab("list");
  }

  function edit(item) {
    setEditingId(item.id);
    setForm(toForm(item));
    setActiveTab("form");
  }

  async function submitPromotion(event) {
    event.preventDefault();
    const result = await actions.upsertHomePromotion(storeId, promotionForm, editingPromotionId);
    setPromotionMessage(result.message);
    if (result.ok) resetPromotionForm();
  }

  function editPromotion(promotion) {
    setEditingPromotionId(promotion.id);
    setPromotionForm({
      itemId: promotion.itemId,
      title: promotion.title,
      subtitle: promotion.subtitle,
      badge: promotion.badge,
      active: promotion.active
    });
    setActiveTab("promo");
  }

  if (!store) {
    return <MerchantPanelMissingState description="Nao foi possivel carregar o catalogo desta operacao." />;
  }

  return (
    <MerchantPanelShell
      storeId={storeId}
      store={store}
      className="menu-v2-page merchant-menu-shell"
      bodyClassName="merchant-panel-main merchant-menu-main"
      eyebrow="PDV PREMIUM / CARDAPIO"
      title="Gerenciar catalogo"
      description="Mantenha produtos, campanhas e personalizacoes da loja com destaque, disponibilidade, estoque e ordenacao sem perder o fluxo atual."
      heroAside={(
        <div className="merchant-dashboard-hero-meta">
          <div className="merchant-dashboard-store-chip">
            <span>Itens ativos</span>
            <strong>{menuSummary.ativos}</strong>
          </div>
          <div className="merchant-dashboard-store-chip">
            <span>Esgotados</span>
            <strong>{menuSummary.esgotados}</strong>
          </div>
          <div className="merchant-dashboard-store-chip">
            <span>Destaques</span>
            <strong>{menuSummary.destaques}</strong>
          </div>
        </div>
      )}
      heroActions={(
        <button type="button" onClick={() => navigate(`/admin-loja/${storeId}`)} aria-label="Voltar" className="menu-v2-back">
          <MdArrowBack />
        </button>
      )}
      onLogout={() => {
        actions.logoutMerchant();
        navigate("/pdv");
      }}
    >
      <div className="menu-v2-tabs">
        <button type="button" className={activeTab === "form" ? "active" : ""} onClick={() => setActiveTab("form")}>
          Produto
        </button>
        <button type="button" className={activeTab === "list" ? "active" : ""} onClick={() => setActiveTab("list")}>
          Catalogo
        </button>
        <button type="button" className={activeTab === "montagem" ? "active" : ""} onClick={() => setActiveTab("montagem")}>
          <MdTune /> Personalizacao
        </button>
        <button type="button" className={activeTab === "promo" ? "active" : ""} onClick={() => setActiveTab("promo")}>
          Campanhas
        </button>
      </div>

      <section className="menu-v2-body">
        {activeTab === "form" ? (
          <form className="menu-v2-card menu-v2-form menu-v2-form-rich" onSubmit={submit}>
            <div className="menu-v2-grid2">
              <input placeholder="Nome do item" value={form.nome} onChange={(event) => setForm((prev) => ({ ...prev, nome: event.target.value }))} required />
              <input placeholder="SKU interno" value={form.sku} onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value }))} />
            </div>

            <div className="menu-v2-grid3">
              <select value={form.categoria} onChange={(event) => setForm((prev) => ({ ...prev, categoria: event.target.value }))}>
                {CATEGORIAS.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select value={form.tipoProduto} onChange={(event) => setForm((prev) => ({ ...prev, tipoProduto: event.target.value }))}>
                {PRODUCT_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
              <input type="number" min="0" placeholder="Ordem de exibicao" value={form.ordemExibicao} onChange={(event) => setForm((prev) => ({ ...prev, ordemExibicao: event.target.value }))} />
            </div>

            <textarea
              placeholder="Descricao principal"
              value={form.descricao}
              onChange={(event) => setForm((prev) => ({ ...prev, descricao: event.target.value }))}
              rows={4}
              required
            />

            <input placeholder="Descricao curta para listagens" value={form.descricaoCurta} onChange={(event) => setForm((prev) => ({ ...prev, descricaoCurta: event.target.value }))} />

            <div className="menu-v2-grid3">
              <input type="number" step="0.01" placeholder="Preco atual (R$)" value={form.preco} onChange={(event) => setForm((prev) => ({ ...prev, preco: event.target.value }))} required />
              <input type="number" step="0.01" placeholder="Preco anterior (opcional)" value={form.precoAntigo} onChange={(event) => setForm((prev) => ({ ...prev, precoAntigo: event.target.value }))} />
              <input type="number" step="0.01" placeholder="Custo interno" value={form.custo} onChange={(event) => setForm((prev) => ({ ...prev, custo: event.target.value }))} />
            </div>

            <input type="url" placeholder="URL da imagem" value={form.imagem} onChange={(event) => setForm((prev) => ({ ...prev, imagem: event.target.value }))} required />

            <div className="menu-v2-grid3">
              <input type="number" placeholder="Estoque atual" value={form.estoqueAtual} onChange={(event) => setForm((prev) => ({ ...prev, estoqueAtual: event.target.value }))} />
              <input type="number" placeholder="Estoque minimo" value={form.estoqueMinimo} onChange={(event) => setForm((prev) => ({ ...prev, estoqueMinimo: event.target.value }))} />
              <input type="number" placeholder="Peso em gramas" value={form.pesoGramas} onChange={(event) => setForm((prev) => ({ ...prev, pesoGramas: event.target.value }))} />
            </div>

            <div className="menu-v2-grid2">
              <label>
                <span>Disponivel a partir de</span>
                <input type="time" value={form.disponivelInicio} onChange={(event) => setForm((prev) => ({ ...prev, disponivelInicio: event.target.value }))} />
              </label>
              <label>
                <span>Disponivel ate</span>
                <input type="time" value={form.disponivelFim} onChange={(event) => setForm((prev) => ({ ...prev, disponivelFim: event.target.value }))} />
              </label>
            </div>

            <div className="menu-v2-toggle-grid">
              <label className="menu-v2-toggle">
                <span>Item ativo</span>
                <input type="checkbox" checked={form.ativo} onChange={(event) => setForm((prev) => ({ ...prev, ativo: event.target.checked }))} />
                <small />
              </label>
              <label className="menu-v2-toggle">
                <span>Marcado como esgotado</span>
                <input type="checkbox" checked={form.esgotado} onChange={(event) => setForm((prev) => ({ ...prev, esgotado: event.target.checked }))} />
                <small />
              </label>
              <label className="menu-v2-toggle">
                <span>Controla estoque</span>
                <input type="checkbox" checked={form.controlaEstoque} onChange={(event) => setForm((prev) => ({ ...prev, controlaEstoque: event.target.checked }))} />
                <small />
              </label>
              <label className="menu-v2-toggle">
                <span>Permite vender sem estoque</span>
                <input type="checkbox" checked={form.permiteVendaSemEstoque} onChange={(event) => setForm((prev) => ({ ...prev, permiteVendaSemEstoque: event.target.checked }))} />
                <small />
              </label>
              <label className="menu-v2-toggle">
                <span>Destaque na home</span>
                <input type="checkbox" checked={form.destaqueHome} onChange={(event) => setForm((prev) => ({ ...prev, destaqueHome: event.target.checked }))} />
                <small />
              </label>
              <label className="menu-v2-toggle">
                <span>Destaque no cardapio</span>
                <input type="checkbox" checked={form.destaqueCardapio} onChange={(event) => setForm((prev) => ({ ...prev, destaqueCardapio: event.target.checked }))} />
                <small />
              </label>
            </div>

            <button className="menu-v2-submit" type="submit">
              {savingItem ? "Salvando..." : editingId ? "Salvar item" : "Cadastrar item"}
            </button>

            {editingId ? (
              <button className="menu-v2-cancel" type="button" onClick={resetForm}>Cancelar edicao</button>
            ) : null}
          </form>
        ) : activeTab === "list" ? (
          <section className="menu-v2-list-wrap">
            <div className="menu-v2-filters hide-scrollbar">
              {["Todos", "Destaque", "Promocional", "Esgotado", ...CATEGORIAS].map((category) => (
                <button key={category} type="button" className={activeFilter === category ? "active" : ""} onClick={() => setActiveFilter(category)}>
                  {category}
                </button>
              ))}
            </div>

            <div className="menu-v2-list">
              {filteredItems.map((item) => {
                const linkedGroups = optionGroups.filter((group) => group.productIds.includes(item.id));
                return (
                  <article key={item.id} className={`menu-v2-item ${item.ativo ? "" : "inactive"}`}>
                    <SmartImage src={item.imagem} alt={item.nome} />
                    <div className="menu-v2-item-main">
                      <div className="menu-v2-item-topline">
                        <h3>{item.nome}</h3>
                        <div className="menu-v2-tags">
                          {item.destaqueCardapio ? <span className="tag"><MdStar /> Destaque</span> : null}
                          {item.tipoProduto !== "PADRAO" ? <span className="tag">{item.tipoProduto}</span> : null}
                          {item.esgotado ? <span className="tag tag-danger">Esgotado</span> : null}
                        </div>
                      </div>
                      <p>{item.descricao}</p>
                      <div className="menu-v2-prices">
                        <strong>{formatCurrency(item.preco)}</strong>
                        {item.precoAntigo ? <small>{formatCurrency(item.precoAntigo)}</small> : null}
                      </div>
                      <div className="menu-v2-meta-grid">
                        <span><MdInventory2 /> Estoque: {item.estoqueAtual}</span>
                        <span>Minimo: {item.estoqueMinimo}</span>
                        <span>Ordem: {item.ordemExibicao}</span>
                        <span>{item.disponivelInicio || item.disponivelFim ? `${item.disponivelInicio || "--:--"} ate ${item.disponivelFim || "--:--"}` : "Disponivel o dia todo"}</span>
                      </div>
                      <div className="menu-builder-linked-groups">
                        {linkedGroups.length ? linkedGroups.map((group) => <span key={group.id} className="tag">{group.name}</span>) : (
                          <span className="muted">Sem personalizacao configurada</span>
                        )}
                      </div>
                    </div>
                    <div className="menu-v2-item-actions">
                      <button type="button" onClick={() => edit(item)}>Editar</button>
                      <button type="button" onClick={() => setActiveTab("montagem")}>Personalizacao</button>
                      <button type="button" onClick={async () => actions.deleteMenuItem(item.id)}>Excluir</button>
                    </div>
                  </article>
                );
              })}

              {!filteredItems.length ? (
                <div className="menu-v2-empty">
                  <span><MdRestaurantMenu /></span>
                  <p>Nenhum item encontrado para este filtro.</p>
                </div>
              ) : null}
            </div>
          </section>
        ) : activeTab === "montagem" ? (
          <MerchantOptionGroupManager
            storeId={storeId}
            items={items}
            groups={optionGroups}
            actions={actions}
          />
        ) : (
          <section className="menu-v2-promo-wrap">
            <form className="menu-v2-card menu-v2-form" onSubmit={submitPromotion}>
              <div className="register-v2-note">
                <strong>Regras da campanha:</strong>
                <span>Cada loja pode publicar ate 2 campanhas por dia. Cada acao fica ativa por 48 horas e ja esta incluida no plano.</span>
              </div>

              {promotionMessage ? <p className="success-text">{promotionMessage}</p> : null}

              <select value={promotionForm.itemId} onChange={(event) => setPromotionForm({ ...promotionForm, itemId: event.target.value })} required>
                <option value="">Escolha um item ativo da loja</option>
                {items.filter((item) => item.ativo).map((item) => (
                  <option key={item.id} value={item.id}>{item.nome}</option>
                ))}
              </select>

              <input placeholder="Titulo da campanha" value={promotionForm.title} onChange={(event) => setPromotionForm({ ...promotionForm, title: event.target.value })} required />
              <textarea
                rows={4}
                placeholder="Subtitulo curto para o carrossel"
                value={promotionForm.subtitle}
                onChange={(event) => setPromotionForm({ ...promotionForm, subtitle: event.target.value })}
                required
              />

              <div className="menu-v2-grid2">
                <input placeholder="Selo da campanha" value={promotionForm.badge} onChange={(event) => setPromotionForm({ ...promotionForm, badge: event.target.value })} required />
                <label className="menu-v2-toggle">
                  <span>Campanha ativa</span>
                  <input type="checkbox" checked={promotionForm.active} onChange={(event) => setPromotionForm({ ...promotionForm, active: event.target.checked })} />
                  <small />
                </label>
              </div>

              <button className="menu-v2-submit" type="submit">
                {editingPromotionId ? "Salvar campanha" : "Publicar campanha"}
              </button>

              {editingPromotionId ? (
                <button className="menu-v2-cancel" type="button" onClick={resetPromotionForm}>Cancelar edicao</button>
              ) : null}
            </form>

            <div className="menu-v2-list">
              {promotions.map((promotion) => (
                <article key={promotion.id} className={`menu-v2-item ${promotion.active ? "" : "inactive"}`}>
                  <SmartImage src={promotion.item?.imagem || store.imagens.capa} alt={promotion.title} />
                  <div className="menu-v2-item-main">
                    <h3>{promotion.title}</h3>
                    <p>{promotion.subtitle}</p>
                    <div className="menu-v2-promo-meta">
                      <strong>{promotion.item?.nome || "Item removido"}</strong>
                      <small>{promotion.badge}</small>
                      <small>Expira em {formatDate(promotion.expiresAt)}</small>
                    </div>
                  </div>
                  <div className="menu-v2-item-actions">
                    <button type="button" onClick={() => editPromotion(promotion)}>Editar</button>
                    <button type="button" onClick={async () => actions.deleteHomePromotion(promotion.id)}>Excluir</button>
                  </div>
                </article>
              ))}

              {!promotions.length ? (
                <div className="menu-v2-empty">
                  <span><MdRestaurantMenu /></span>
                  <p>Nenhuma campanha publicada por esta loja.</p>
                </div>
              ) : null}
            </div>
          </section>
        )}
      </section>
    </MerchantPanelShell>
  );
}
