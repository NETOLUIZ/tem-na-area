import { useMemo, useState } from "react";
import { MdAdd, MdDelete, MdEdit, MdPlaylistAddCheck } from "react-icons/md";
import { GROUP_TYPE_OPTIONS, GROUP_TYPE_LABEL } from "../utils/customization";
import { formatCurrency } from "../utils/format";

const emptyOption = () => ({
  id: "",
  name: "",
  description: "",
  priceDelta: "0",
  sortOrder: 1,
  active: true
});

const emptyGroupForm = {
  name: "",
  description: "",
  type: "single",
  required: false,
  minSelect: 0,
  maxSelect: 1,
  sortOrder: 1,
  active: true,
  productIds: [],
  options: [emptyOption()]
};

export default function MerchantOptionGroupManager({ storeId, items, groups, actions }) {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyGroupForm);
  const [filterProductId, setFilterProductId] = useState("todos");

  const filteredGroups = useMemo(() => {
    if (filterProductId === "todos") return groups;
    return groups.filter((group) => group.productIds.includes(filterProductId));
  }, [filterProductId, groups]);

  function resetForm() {
    setEditingId(null);
    setForm(emptyGroupForm);
  }

  function editGroup(group) {
    setEditingId(group.id);
    setForm({
      name: group.name,
      description: group.description || "",
      type: group.type,
      required: group.required,
      minSelect: group.minSelect,
      maxSelect: group.maxSelect,
      sortOrder: group.sortOrder,
      active: group.active,
      productIds: group.productIds || [],
      options: group.options.length
        ? group.options.map((option) => ({
            id: option.id,
            name: option.name,
            description: option.description || "",
            priceDelta: String(option.priceDelta || 0),
            sortOrder: option.sortOrder,
            active: option.active !== false
          }))
        : [emptyOption()]
    });
  }

  function submit(e) {
    e.preventDefault();
    actions.upsertOptionGroup(storeId, {
      ...form,
      minSelect: Number(form.minSelect || 0),
      maxSelect: form.type === "text" ? 1 : Number(form.maxSelect || 1),
      sortOrder: Number(form.sortOrder || 0),
      options: form.type === "text"
        ? []
        : form.options.map((option, index) => ({
            ...option,
            sortOrder: Number(option.sortOrder || index + 1),
            priceDelta: Number(option.priceDelta || 0)
          }))
    }, editingId);
    resetForm();
  }

  function toggleProduct(productId) {
    setForm((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter((id) => id !== productId)
        : [...prev.productIds, productId]
    }));
  }

  function updateOption(index, nextOption) {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((option, currentIndex) => (currentIndex === index ? nextOption : option))
    }));
  }

  function addOption() {
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, { ...emptyOption(), sortOrder: prev.options.length + 1 }]
    }));
  }

  function removeOption(index) {
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, currentIndex) => currentIndex !== index)
    }));
  }

  return (
    <div className="menu-builder-layout">
      <form className="menu-v2-card menu-v2-form menu-builder-form" onSubmit={submit}>
        <div className="menu-builder-form-head">
          <div>
            <small>Configuracao por produto</small>
            <h3>{editingId ? "Editar grupo de montagem" : "Novo grupo de montagem"}</h3>
          </div>
          {editingId ? (
            <button type="button" className="menu-v2-cancel" onClick={resetForm}>
              Cancelar
            </button>
          ) : null}
        </div>

        <label className="menu-builder-field">
          <span>Nome do grupo</span>
          <input
            placeholder="Ex: Escolha o tamanho"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
        </label>

        <label className="menu-builder-field">
          <span>Descricao para o cliente</span>
          <textarea
            rows={3}
            placeholder="Ex: selecione uma opcao"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
        </label>

        <div className="menu-v2-grid2">
          <label className="menu-builder-field">
            <span>Tipo do grupo</span>
            <select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}>
              {GROUP_TYPE_OPTIONS.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </label>

          <label className="menu-builder-field">
            <span>Ordem de exibicao</span>
            <input
              type="number"
              min="0"
              placeholder="Ex: 1"
              value={form.sortOrder}
              onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
            />
          </label>
        </div>

        {form.type !== "text" ? (
          <div className="menu-v2-grid2">
            <label className="menu-builder-field">
              <span>Quantidade minima</span>
              <input
                type="number"
                min="0"
                placeholder="Minimo de escolhas"
                value={form.minSelect}
                onChange={(e) => setForm((prev) => ({ ...prev, minSelect: e.target.value }))}
              />
            </label>
            <label className="menu-builder-field">
              <span>Quantidade maxima</span>
              <input
                type="number"
                min="1"
                placeholder="Maximo de escolhas"
                value={form.maxSelect}
                onChange={(e) => setForm((prev) => ({ ...prev, maxSelect: e.target.value }))}
              />
            </label>
          </div>
        ) : null}

        <div className="menu-builder-toggles">
          <label className="menu-v2-toggle">
            <span>Obrigatorio</span>
            <input type="checkbox" checked={form.required} onChange={(e) => setForm((prev) => ({ ...prev, required: e.target.checked }))} />
            <small />
          </label>

          <label className="menu-v2-toggle">
            <span>Ativo</span>
            <input type="checkbox" checked={form.active} onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))} />
            <small />
          </label>
        </div>

        <div className="menu-builder-products">
          <strong>Vincular aos produtos</strong>
          <div className="menu-builder-product-list">
            {items.filter((item) => item.ativo).map((item) => (
              <label key={item.id} className={`menu-builder-product-chip ${form.productIds.includes(item.id) ? "active" : ""}`}>
                <input
                  type="checkbox"
                  checked={form.productIds.includes(item.id)}
                  onChange={() => toggleProduct(item.id)}
                />
                <span>{item.nome}</span>
              </label>
            ))}
          </div>
        </div>

        {form.type !== "text" ? (
          <div className="menu-builder-options">
            <div className="menu-builder-options-head">
              <strong>Opcoes do grupo</strong>
              <button type="button" className="btn btn-outline" onClick={addOption}>
                <MdAdd /> Adicionar opcao
              </button>
            </div>

            {form.options.map((option, index) => (
              <div key={`${option.id || "new"}-${index}`} className="menu-builder-option-card">
                <div className="menu-v2-grid2">
                  <label className="menu-builder-field">
                    <span>Nome da opcao</span>
                    <input
                      placeholder="Ex: Grande"
                      value={option.name}
                      onChange={(e) => updateOption(index, { ...option, name: e.target.value })}
                      required
                    />
                  </label>
                  <label className="menu-builder-field">
                    <span>Preco adicional</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 4.50"
                      value={option.priceDelta}
                      onChange={(e) => updateOption(index, { ...option, priceDelta: e.target.value })}
                    />
                  </label>
                </div>

                <label className="menu-builder-field">
                  <span>Descricao curta da opcao</span>
                  <input
                    placeholder="Ex: serve 2 pessoas"
                    value={option.description}
                    onChange={(e) => updateOption(index, { ...option, description: e.target.value })}
                  />
                </label>

                <div className="menu-v2-grid2">
                  <label className="menu-builder-field">
                    <span>Ordem da opcao</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="Ex: 1"
                      value={option.sortOrder}
                      onChange={(e) => updateOption(index, { ...option, sortOrder: e.target.value })}
                    />
                  </label>
                  <label className="menu-v2-toggle">
                    <span>Ativa</span>
                    <input
                      type="checkbox"
                      checked={option.active}
                      onChange={(e) => updateOption(index, { ...option, active: e.target.checked })}
                    />
                    <small />
                  </label>
                </div>

                {form.options.length > 1 ? (
                  <button type="button" className="menu-builder-remove-option" onClick={() => removeOption(index)}>
                    <MdDelete /> Remover opcao
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <button className="menu-v2-submit" type="submit">
          {editingId ? "Salvar grupo" : "Cadastrar grupo"}
        </button>
      </form>

      <section className="menu-v2-list-wrap menu-builder-list">
        <div className="menu-builder-list-head">
          <div>
            <small>Grupos cadastrados</small>
            <h3>Montagem do pedido</h3>
          </div>

          <select value={filterProductId} onChange={(e) => setFilterProductId(e.target.value)}>
            <option value="todos">Todos os produtos</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>{item.nome}</option>
            ))}
          </select>
        </div>

        <div className="menu-v2-list">
          {filteredGroups.length ? filteredGroups.map((group) => (
            <article key={group.id} className={`menu-v2-item menu-builder-group-card ${group.active ? "" : "inactive"}`}>
              <div className="menu-v2-item-main">
                <div className="menu-builder-group-headline">
                  <div>
                    <h3>{group.name}</h3>
                    <p>{GROUP_TYPE_LABEL[group.type]} · {group.required ? "Obrigatorio" : "Opcional"}</p>
                  </div>
                  <span className="tag">{group.productIds.length} produto(s)</span>
                </div>

                {group.description ? <p>{group.description}</p> : null}

                <div className="menu-builder-group-meta">
                  <span>Min: {group.minSelect || 0}</span>
                  <span>Max: {group.maxSelect || (group.type === "single" ? 1 : group.options.length)}</span>
                  <span>Ordem: {group.sortOrder}</span>
                </div>

                {group.type !== "text" ? (
                  <div className="menu-builder-options-preview">
                    {group.options.map((option) => (
                      <div key={option.id} className="menu-builder-options-preview-row">
                        <span>{option.name}</span>
                        <strong>{Number(option.priceDelta || 0) > 0 ? `+${formatCurrency(option.priceDelta)}` : "Incluso"}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="menu-builder-text-badge">
                    <MdPlaylistAddCheck />
                    <span>Campo livre para o cliente digitar</span>
                  </div>
                )}
              </div>

              <div className="menu-v2-item-actions">
                <button type="button" onClick={() => editGroup(group)}><MdEdit /> Editar</button>
                <button type="button" onClick={() => actions.deleteOptionGroup(group.id)}><MdDelete /> Excluir</button>
              </div>
            </article>
          )) : (
            <div className="menu-v2-empty">
              <span><MdPlaylistAddCheck /></span>
              <p>Nenhum grupo de montagem encontrado para este filtro.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
