import { useMemo, useState } from "react";
import {
  MdArrowBack,
  MdRestaurantMenu,
  MdTune
} from "react-icons/md";
import { Link, useNavigate, useParams } from "react-router-dom";
import MerchantDesktopSidebar from "../components/MerchantDesktopSidebar";
import MerchantOptionGroupManager from "../components/MerchantOptionGroupManager";
import SmartImage from "../components/SmartImage";
import { useApp } from "../store/AppContext";
import { formatCurrency, formatDate } from "../utils/format";

const CATEGORIAS = ["Massas", "Bebidas", "Sobremesas", "Outros"];

const emptyItem = {
  nome: "",
  categoria: "Outros",
  descricao: "",
  preco: "",
  precoAntigo: "",
  imagem: "",
  tags: "",
  ativo: true
};

const emptyPromotion = {
  itemId: "",
  title: "",
  subtitle: "",
  badge: "Destaque",
  active: true
};

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
    if (activeFilter === "Todos") return items;
    return items.filter((item) => (item.categoria || "Outros") === activeFilter);
  }, [activeFilter, items]);

  function resetForm() {
    setForm(emptyItem);
    setEditingId(null);
  }

  function resetPromotionForm() {
    setPromotionForm(emptyPromotion);
    setEditingPromotionId(null);
  }

  async function submit(e) {
    e.preventDefault();
    setSavingItem(true);
    await actions.upsertMenuItem(
      storeId,
      {
        ...form,
        categoria: form.categoria,
        preco: Number(form.preco),
        precoAntigo: form.precoAntigo ? Number(form.precoAntigo) : null,
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        ativo: form.ativo
      },
      editingId
    );
    setSavingItem(false);

    resetForm();
    setActiveTab("list");
  }

  function edit(item) {
    setEditingId(item.id);
    setForm({
      nome: item.nome,
      categoria: item.categoria || "Outros",
      descricao: item.descricao,
      preco: String(item.preco),
      precoAntigo: item.precoAntigo ? String(item.precoAntigo) : "",
      imagem: item.imagem,
      tags: (item.tags || []).join(", "),
      ativo: item.ativo
    });
    setActiveTab("form");
  }

  async function submitPromotion(e) {
    e.preventDefault();
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
    return (
      <main className="container page-space">
        <div className="empty-state">
          <h3>Loja não encontrada</h3>
          <p>Não foi possível carregar o cardápio dessa loja.</p>
          <Link className="btn btn-primary" to="/">Voltar para Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="menu-v2-page merchant-has-sidebar">
      <MerchantDesktopSidebar
        storeId={storeId}
        storeName={store.nome}
        storeSlug={store.slug}
        status={store.status}
        onLogout={() => {
          actions.logoutMerchant();
          navigate("/login-loja");
        }}
      />

      <header className="menu-v2-header">
        <div className="menu-v2-header-top">
          <button type="button" onClick={() => navigate(`/admin-loja/${storeId}`)} aria-label="Voltar">
            <MdArrowBack />
          </button>
          <h1>Gerenciar cardápio</h1>
        </div>
        <div className="menu-v2-tabs">
          <button type="button" className={activeTab === "form" ? "active" : ""} onClick={() => setActiveTab("form")}>
            Novo item
          </button>
          <button type="button" className={activeTab === "list" ? "active" : ""} onClick={() => setActiveTab("list")}>
            Itens cadastrados
          </button>
          <button type="button" className={activeTab === "montagem" ? "active" : ""} onClick={() => setActiveTab("montagem")}>
            <MdTune /> Montagem
          </button>
          <button type="button" className={activeTab === "promo" ? "active" : ""} onClick={() => setActiveTab("promo")}>
            Propaganda Home
          </button>
        </div>
      </header>

      <section className="menu-v2-body">
        {activeTab === "form" ? (
          <form className="menu-v2-card menu-v2-form" onSubmit={submit}>
            <input placeholder="Nome do item" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />

            <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <textarea
              placeholder="Descrição"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              rows={4}
              required
            />

            <div className="menu-v2-grid2">
              <input type="number" step="0.01" placeholder="Preco (R$)" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} required />
              <input type="number" step="0.01" placeholder="Preco antigo" value={form.precoAntigo} onChange={(e) => setForm({ ...form, precoAntigo: e.target.value })} />
            </div>

            <input type="url" placeholder="URL da imagem" value={form.imagem} onChange={(e) => setForm({ ...form, imagem: e.target.value })} required />
            <input placeholder="Tags (separadas por virgula)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />

            <label className="menu-v2-toggle">
              <span>Item ativo</span>
              <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />
              <small />
            </label>

            <button className="menu-v2-submit" type="submit">
              {savingItem ? "Salvando..." : editingId ? "Salvar item" : "Cadastrar item"}
            </button>

            {editingId ? (
              <button className="menu-v2-cancel" type="button" onClick={resetForm}>Cancelar edição</button>
            ) : null}
          </form>
        ) : activeTab === "list" ? (
          <section className="menu-v2-list-wrap">
            <div className="menu-v2-filters hide-scrollbar">
              {["Todos", ...CATEGORIAS].map((cat) => (
                <button key={cat} type="button" className={activeFilter === cat ? "active" : ""} onClick={() => setActiveFilter(cat)}>
                  {cat}
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
                      <h3>{item.nome}</h3>
                      <p>{item.descricao}</p>
                      <div className="menu-v2-prices">
                        <strong>{formatCurrency(item.preco)}</strong>
                        {item.precoAntigo ? <small>{formatCurrency(item.precoAntigo)}</small> : null}
                      </div>
                      <div className="menu-builder-linked-groups">
                        {linkedGroups.length ? (
                          linkedGroups.map((group) => <span key={group.id} className="tag">{group.name}</span>)
                        ) : (
                          <span className="muted">Sem montagem configurada</span>
                        )}
                      </div>
                    </div>
                    <div className="menu-v2-item-actions">
                      <button type="button" onClick={() => edit(item)}>Editar</button>
                      <button type="button" onClick={() => setActiveTab("montagem")}>Montagem</button>
                      <button type="button" onClick={async () => actions.deleteMenuItem(item.id)}>Excluir</button>
                    </div>
                  </article>
                );
              })}

              {!filteredItems.length ? (
                <div className="menu-v2-empty">
                  <span><MdRestaurantMenu /></span>
                  <p>Nenhum item cadastrado nesta categoria.</p>
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
                <strong>Regras da propaganda:</strong>
                <span>Cada loja pode publicar no máximo 2 propagandas por dia. Cada campanha fica ativa por 48 horas e já está incluída no plano.</span>
              </div>

              {promotionMessage ? <p className="success-text">{promotionMessage}</p> : null}

              <select value={promotionForm.itemId} onChange={(e) => setPromotionForm({ ...promotionForm, itemId: e.target.value })} required>
                <option value="">Escolha um produto da loja</option>
                {items.filter((item) => item.ativo).map((item) => (
                  <option key={item.id} value={item.id}>{item.nome}</option>
                ))}
              </select>

              <input placeholder="Título da propaganda" value={promotionForm.title} onChange={(e) => setPromotionForm({ ...promotionForm, title: e.target.value })} required />
              <textarea
                rows={4}
                placeholder="Subtítulo curto para aparecer no carrossel"
                value={promotionForm.subtitle}
                onChange={(e) => setPromotionForm({ ...promotionForm, subtitle: e.target.value })}
                required
              />

              <div className="menu-v2-grid2">
                <input placeholder="Selo da campanha, ex: Oferta local" value={promotionForm.badge} onChange={(e) => setPromotionForm({ ...promotionForm, badge: e.target.value })} required />
                <label className="menu-v2-toggle">
                  <span>Campanha ativa</span>
                  <input type="checkbox" checked={promotionForm.active} onChange={(e) => setPromotionForm({ ...promotionForm, active: e.target.checked })} />
                  <small />
                </label>
              </div>

              <button className="menu-v2-submit" type="submit">
                {editingPromotionId ? "Salvar propaganda" : "Publicar na home"}
              </button>

              {editingPromotionId ? (
                <button className="menu-v2-cancel" type="button" onClick={resetPromotionForm}>Cancelar edição</button>
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
                      <strong>{promotion.item?.nome || "Produto removido"}</strong>
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
                  <p>Nenhuma propaganda publicada por esta loja.</p>
                </div>
              ) : null}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
