import { useEffect, useMemo, useState } from "react";
import { MdClose } from "react-icons/md";
import { GROUP_TYPE_LABEL } from "../utils/customization";
import { formatCurrency } from "../utils/format";
import SmartImage from "./SmartImage";

function createInitialSelections(groups) {
  return groups.reduce((acc, group) => {
    acc[group.id] = {
      selectedOptionIds: [],
      textValue: ""
    };
    return acc;
  }, {});
}

export default function ProductCustomizationModal({ item, groups, open, onClose, onSubmit }) {
  const [selections, setSelections] = useState({});
  const [customerNote, setCustomerNote] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelections(createInitialSelections(groups));
    setCustomerNote("");
    setQuantidade(1);
    setError("");
  }, [groups, item?.id, open]);

  const optionExtra = useMemo(() => groups.reduce((sum, group) => {
    if (group.type === "text") return sum;
    const ids = selections[group.id]?.selectedOptionIds || [];
    return sum + group.options
      .filter((option) => ids.includes(option.id))
      .reduce((acc, option) => acc + Number(option.priceDelta || 0), 0);
  }, 0), [groups, selections]);

  if (!open || !item) return null;

  const unitPrice = Number(item.preco || 0) + optionExtra;
  const total = unitPrice * quantidade;

  function toggleOption(group, optionId) {
    setSelections((prev) => {
      const current = prev[group.id] || { selectedOptionIds: [], textValue: "" };
      const ids = current.selectedOptionIds || [];

      if (group.type === "single") {
        return {
          ...prev,
          [group.id]: {
            ...current,
            selectedOptionIds: [optionId]
          }
        };
      }

      const exists = ids.includes(optionId);
      const nextIds = exists ? ids.filter((id) => id !== optionId) : [...ids, optionId];
      return {
        ...prev,
        [group.id]: {
          ...current,
          selectedOptionIds: nextIds
        }
      };
    });
  }

  function submit() {
    const result = onSubmit({
      quantidade,
      customerNote,
      selections
    });

    if (!result?.ok) {
      setError(result?.message || "Revise a montagem do pedido.");
      return;
    }

    onClose();
  }

  return (
    <div className="customization-modal-overlay" role="dialog" aria-modal="true" aria-label={`Montar pedido de ${item.nome}`}>
      <button type="button" className="customization-modal-backdrop" onClick={onClose} aria-label="Fechar montagem" />

      <section className="customization-modal-panel">
        <header className="customization-modal-header">
          <div className="customization-modal-product">
            <SmartImage src={item.imagem} alt={item.nome} className="customization-modal-thumb" />
            <div>
              <small>Monte seu pedido</small>
              <h2>{item.nome}</h2>
              <p>{item.descricao}</p>
              <strong>{formatCurrency(item.preco)}</strong>
            </div>
          </div>
          <button type="button" className="customization-modal-close" onClick={onClose} aria-label="Fechar">
            <MdClose />
          </button>
        </header>

        <div className="customization-modal-body">
          {groups.length ? groups.map((group) => (
            <section key={group.id} className="customization-group-card">
              <div className="customization-group-head">
                <div>
                  <h3>{group.name}</h3>
                  <p>{GROUP_TYPE_LABEL[group.type]} {group.required ? "· Obrigatório" : "· Opcional"}</p>
                </div>
                {group.type !== "text" ? (
                  <span>
                    {group.minSelect || 0} min / {group.maxSelect || (group.type === "single" ? 1 : group.options.length)} max
                  </span>
                ) : null}
              </div>

              {group.description ? <p className="customization-group-description">{group.description}</p> : null}

              {group.type === "text" ? (
                <textarea
                  rows={3}
                  placeholder="Digite aqui"
                  value={selections[group.id]?.textValue || ""}
                  onChange={(e) => setSelections((prev) => ({
                    ...prev,
                    [group.id]: {
                      ...(prev[group.id] || { selectedOptionIds: [] }),
                      textValue: e.target.value
                    }
                  }))}
                />
              ) : (
                <div className="customization-options-list">
                  {group.options.map((option) => {
                    const checked = (selections[group.id]?.selectedOptionIds || []).includes(option.id);
                    return (
                      <label key={option.id} className={`customization-option ${checked ? "active" : ""}`}>
                        <input
                          type={group.type === "single" ? "radio" : "checkbox"}
                          name={`group-${group.id}`}
                          checked={checked}
                          onChange={() => toggleOption(group, option.id)}
                        />
                        <div>
                          <strong>{option.name}</strong>
                          {option.description ? <p>{option.description}</p> : null}
                        </div>
                        <span>{Number(option.priceDelta || 0) > 0 ? `+${formatCurrency(option.priceDelta)}` : "Incluso"}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </section>
          )) : (
            <div className="customization-empty">
              <p>Este produto não possui grupos de montagem. Ajuste a quantidade e adicione ao carrinho.</p>
            </div>
          )}

          <section className="customization-group-card">
            <div className="customization-group-head">
              <div>
                <h3>Observação do cliente</h3>
                <p>Campo adicional para recados ao estabelecimento</p>
              </div>
            </div>
            <textarea
              rows={3}
              placeholder="Ex: sem cebola, entregar separado..."
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
            />
          </section>

          {error ? <p className="error-text">{error}</p> : null}
        </div>

        <footer className="customization-modal-footer">
          <div className="customization-price-box">
            <small>Total do item</small>
            <strong>{formatCurrency(total)}</strong>
          </div>

          <div className="customization-qty">
            <button type="button" onClick={() => setQuantidade((value) => Math.max(1, value - 1))}>-</button>
            <span>{quantidade}</span>
            <button type="button" onClick={() => setQuantidade((value) => value + 1)}>+</button>
          </div>

          <button type="button" className="btn btn-primary customization-submit" onClick={submit}>
            Adicionar ao carrinho
          </button>
        </footer>
      </section>
    </div>
  );
}
