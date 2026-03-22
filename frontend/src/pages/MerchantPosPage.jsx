import { useEffect, useMemo, useState } from "react";
import { MdAdd, MdDelete, MdLocalPrintshop, MdPersonAdd, MdPointOfSale, MdSearch } from "react-icons/md";
import { Link, useNavigate, useParams } from "react-router-dom";
import ProductCustomizationModal from "../components/ProductCustomizationModal";
import MerchantPanelShell from "../components/merchant/MerchantPanelShell";
import { MerchantPanelMissingState } from "../components/merchant/MerchantPanelState";
import SmartImage from "../components/SmartImage";
import { api } from "../services/api";
import { useApp } from "../store/AppContext";
import { buildSelectionSummary, serializeSelectionSignature, sumOptionPrices } from "../utils/customization";
import { getUserErrorMessage } from "../utils/errors";
import { formatCurrency } from "../utils/format";

const SALE_TYPES = [
  { id: "BALCAO", label: "Balcao", deliveryType: "RETIRADA" },
  { id: "RETIRADA", label: "Retirada", deliveryType: "RETIRADA" },
  { id: "DELIVERY", label: "Delivery", deliveryType: "ENTREGA" },
  { id: "MESA", label: "Mesa", deliveryType: "RETIRADA" }
];

const PAYMENT_METHODS = [
  { id: "DINHEIRO", label: "Dinheiro" },
  { id: "PIX", label: "Pix" },
  { id: "DEBITO", label: "Debito" },
  { id: "CREDITO", label: "Credito" }
];

const PAYMENT_STATUSES = [
  { id: "PAGO", label: "Pago" },
  { id: "PENDENTE", label: "Pendente" },
  { id: "PARCIAL", label: "Parcial" },
  { id: "CANCELADO", label: "Cancelado" },
  { id: "ESTORNADO", label: "Estornado" }
];

const emptyCustomerForm = {
  nome: "",
  telefone: "",
  whatsapp: "",
  email: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  referencia: ""
};

function createPaymentDraft(method = "DINHEIRO", amount = "") {
  return {
    id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    method,
    amount: amount === "" ? "" : String(amount),
    amountReceived: "",
    reference: "",
    notes: ""
  };
}

function buildPosCartItem(item, configuration) {
  const selectedGroups = [];
  const selections = configuration.selections || {};
  const groups = configuration.groups || [];

  groups.forEach((group) => {
    if (group.type === "text") {
      const textValue = String(selections[group.id]?.textValue || "").trim();
      if (textValue) {
        selectedGroups.push({
          groupId: group.id,
          name: group.name,
          type: group.type,
          textValue,
          selectedOptions: []
        });
      }
      return;
    }

    const selectedOptionIds = Array.isArray(selections[group.id]?.selectedOptionIds)
      ? selections[group.id].selectedOptionIds
      : [];

    const selectedOptions = group.options
      .filter((option) => selectedOptionIds.includes(option.id))
      .map((option) => ({
        optionId: option.id,
        name: option.name,
        description: option.description,
        priceDelta: Number(option.priceDelta || 0)
      }));

    if (selectedOptions.length) {
      selectedGroups.push({
        groupId: group.id,
        name: group.name,
        type: group.type,
        textValue: "",
        selectedOptions
      });
    }
  });

  const quantity = Math.max(1, Number(configuration.quantidade || 1));
  const customerNote = String(configuration.customerNote || "").trim();
  const optionExtra = sumOptionPrices(selectedGroups);
  const basePrice = Number(item.preco || 0);

  return {
    id: `${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    itemId: item.id,
    nome: item.nome,
    imagem: item.imagem,
    quantidade: quantity,
    basePrice,
    unitPrice: basePrice + optionExtra,
    selectedGroups,
    customerNote,
    signature: serializeSelectionSignature(selectedGroups, customerNote)
  };
}

export default function MerchantPosPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { state, selectors, actions } = useApp();

  const store = state.stores.find((item) => item.id === storeId);
  const items = selectors.allItemsByStore(storeId).filter((item) => item.ativo);
  const optionGroups = selectors.optionGroupsByStore(storeId);
  const token = state.sessions.merchantToken;

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [saleType, setSaleType] = useState("BALCAO");
  const [cartItems, setCartItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [discountFixed, setDiscountFixed] = useState("0");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [generalNote, setGeneralNote] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("PAGO");
  const [payments, setPayments] = useState([createPaymentDraft()]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  const categories = useMemo(() => ["Todos", ...new Set(items.map((item) => item.categoria || "Outros"))], [items]);

  const filteredItems = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return items.filter((item) => {
      const byCategory = category === "Todos" || (item.categoria || "Outros") === category;
      const bySearch = !normalized || `${item.nome} ${item.descricao}`.toLowerCase().includes(normalized);
      return byCategory && bySearch;
    });
  }, [category, items, search]);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantidade), 0);
  const fixedDiscountValue = Number(discountFixed || 0);
  const percentDiscountValue = subtotal * (Number(discountPercent || 0) / 100);
  const totalDiscount = Math.min(subtotal, fixedDiscountValue + percentDiscountValue);
  const total = Math.max(0, subtotal - totalDiscount);
  const paidAmount = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const remainingAmount = Math.max(0, Number((total - paidAmount).toFixed(2)));
  const projectedChange = payments.reduce((sum, payment) => {
    if (payment.method !== "DINHEIRO") {
      return sum;
    }

    const received = Number(payment.amountReceived || 0);
    const amount = Number(payment.amount || 0);
    return sum + Math.max(0, received - amount);
  }, 0);

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(async () => {
      setLoadingCustomers(true);
      try {
        const result = await api.pdvCustomers(token, customerSearch, 12);
        setCustomers(result.customers || []);
      } catch {
        setCustomers([]);
      } finally {
        setLoadingCustomers(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [customerSearch, token]);

  if (!store) {
    return <MerchantPanelMissingState description="Nao foi possivel carregar a frente de caixa desta operacao." />;
  }

  function addDirectItem(item) {
    const nextItem = {
      id: `${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      itemId: item.id,
      nome: item.nome,
      imagem: item.imagem,
      quantidade: 1,
      basePrice: Number(item.preco || 0),
      unitPrice: Number(item.preco || 0),
      selectedGroups: [],
      customerNote: "",
      signature: "default"
    };
    setCartItems((prev) => [nextItem, ...prev]);
  }

  function addCustomizedItem(configuration) {
    const groups = optionGroups.filter((group) => group.productIds.includes(String(selectedItem.id)) && group.active);
    const nextItem = buildPosCartItem(selectedItem, { ...configuration, groups });
    setCartItems((prev) => [nextItem, ...prev]);
  }

  function updateCartQuantity(id, delta) {
    setCartItems((prev) => prev
      .map((item) => (item.id === id ? { ...item, quantidade: Math.max(1, item.quantidade + delta) } : item))
      .filter(Boolean));
  }

  function removeCartItem(id) {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }

  function addPayment() {
    const remaining = Math.max(0, Number((total - paidAmount).toFixed(2)));
    setPayments((prev) => [...prev, createPaymentDraft("PIX", remaining > 0 ? remaining.toFixed(2) : "")]);
  }

  function updatePayment(paymentId, patch) {
    setPayments((prev) => prev.map((payment) => (payment.id === paymentId ? { ...payment, ...patch } : payment)));
  }

  function removePayment(paymentId) {
    setPayments((prev) => {
      if (prev.length === 1) {
        return [createPaymentDraft()];
      }

      return prev.filter((payment) => payment.id !== paymentId);
    });
  }

  function buildPaymentPayload() {
    const normalizedEntries = payments
      .map((payment) => {
        const amount = Number(payment.amount || 0);
        const amountReceived = payment.amountReceived === "" ? null : Number(payment.amountReceived || 0);
        const change = payment.method === "DINHEIRO" && amountReceived !== null ? Math.max(0, amountReceived - amount) : null;

        return {
          metodo_pagamento: payment.method,
          status_pagamento: paymentStatus,
          valor: Number(amount.toFixed(2)),
          valor_recebido: amountReceived == null ? null : Number(amountReceived.toFixed(2)),
          troco: change == null ? null : Number(change.toFixed(2)),
          referencia_externa: payment.reference.trim() || null,
          observacoes: payment.notes.trim() || null
        };
      })
      .filter((payment) => payment.valor > 0 || ["PENDENTE", "CANCELADO", "ESTORNADO"].includes(payment.status_pagamento));

    if (paymentStatus === "PENDENTE" && normalizedEntries.length === 0) {
      return [{
        metodo_pagamento: payments[0]?.method || "OUTRO",
        status_pagamento: "PENDENTE",
        valor: Number(total.toFixed(2)),
        valor_recebido: null,
        troco: null,
        referencia_externa: null,
        observacoes: "Venda aberta com pagamento pendente."
      }];
    }

    if (["CANCELADO", "ESTORNADO"].includes(paymentStatus) && normalizedEntries.length === 0) {
      return [{
        metodo_pagamento: payments[0]?.method || "OUTRO",
        status_pagamento: paymentStatus,
        valor: Number(total.toFixed(2)),
        valor_recebido: null,
        troco: null,
        referencia_externa: null,
        observacoes: `Venda marcada como ${paymentStatus.toLowerCase()}.`
      }];
    }

    return normalizedEntries;
  }

  async function createCustomer() {
    if (!token) return;
    setCreatingCustomer(true);
    try {
      const result = await api.createPdvCustomer(token, customerForm);
      setSelectedCustomer(result.customer);
      setShowCustomerForm(false);
      setCustomerForm(emptyCustomerForm);
    } finally {
      setCreatingCustomer(false);
    }
  }

  async function finalizeSale() {
    if (!token || !cartItems.length || !selectedCustomer) {
      setFeedback("Selecione um cliente e adicione itens antes de finalizar.");
      return;
    }

    const paymentPayload = buildPaymentPayload();
    if (["PAGO", "PARCIAL"].includes(paymentStatus) && paymentPayload.length === 0) {
      setFeedback("Informe ao menos um pagamento para concluir a venda.");
      return;
    }

    if (paymentStatus === "PAGO" && paidAmount + 0.009 < total) {
      setFeedback("O total pago ainda nao cobre o valor da venda.");
      return;
    }

    if (paymentStatus === "PARCIAL" && (paidAmount <= 0 || paidAmount + 0.009 >= total)) {
      setFeedback("Use o status parcial apenas quando houver pagamento incompleto.");
      return;
    }

    const saleConfig = SALE_TYPES.find((entry) => entry.id === saleType) || SALE_TYPES[0];
    setSubmitting(true);
    setFeedback("");

    try {
      const result = await api.createPdvOrder(token, {
        cliente_id: selectedCustomer.id,
        tipo_entrega: saleConfig.deliveryType,
        status_pagamento: paymentStatus,
        desconto: Number(totalDiscount.toFixed(2)),
        taxa_entrega: 0,
        observacoes_cliente: [generalNote, saleType === "MESA" ? "Venda registrada para mesa." : ""].filter(Boolean).join(" "),
        pagamentos: paymentPayload,
        itens: cartItems.map((item) => ({
          produto_id: Number(item.itemId),
          quantidade: Number(item.quantidade),
          observacoes: buildSelectionSummary(item.selectedGroups, item.customerNote).join(" | ")
        }))
      });

      setCartItems([]);
      setDiscountFixed("0");
      setDiscountPercent("0");
      setGeneralNote("");
      setPaymentStatus("PAGO");
      setPayments([createPaymentDraft()]);
      setFeedback(`Venda registrada com sucesso no pedido #${result.order?.codigo || result.order?.id}.`);
      if (result.order?.id) {
        navigate(`/admin-loja/${storeId}/pedidos/${result.order.id}/imprimir?copy=counter&width=80`);
      }
    } catch (error) {
      setFeedback(getUserErrorMessage(error, "Nao foi possivel finalizar a venda."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MerchantPanelShell
      storeId={storeId}
      store={store}
      className="merchant-panel-shell merchant-pos-shell"
      bodyClassName="merchant-panel-main merchant-pos-main"
      eyebrow="PDV PREMIUM / FRENTE DE CAIXA"
      title="Frente de caixa"
      description="Venda rapida no balcao com busca de produtos, personalizacao, cliente e fechamento em poucos cliques."
      heroAside={(
        <div className="merchant-dashboard-hero-meta">
          <div className="merchant-dashboard-store-chip">
            <span>Itens no carrinho</span>
            <strong>{cartItems.length}</strong>
          </div>
          <div className="merchant-dashboard-store-chip">
            <span>Total</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
        </div>
      )}
      heroActions={(
        <Link className="btn btn-outline" to={`/admin-loja/${storeId}/pedidos`}>
          <MdLocalPrintshop /> Ver pedidos
        </Link>
      )}
      onLogout={() => {
        actions.logoutMerchant();
        navigate("/pdv");
      }}
    >
      <div className="merchant-pos-layout">
        <section className="merchant-pos-catalog">
          <div className="merchant-pos-toolbar">
            <div className="orders-v2-search">
              <span><MdSearch /></span>
              <input
                type="text"
                placeholder="Buscar produto no caixa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="menu-v2-filters hide-scrollbar">
              {categories.map((entry) => (
                <button key={entry} type="button" className={category === entry ? "active" : ""} onClick={() => setCategory(entry)}>
                  {entry}
                </button>
              ))}
            </div>
          </div>

          <div className="merchant-pos-products">
            {filteredItems.map((item) => {
              const hasCustomization = optionGroups.some((group) => group.productIds.includes(String(item.id)) && group.active);
              return (
                <article key={item.id} className="merchant-pos-product-card">
                  <SmartImage src={item.imagem} alt={item.nome} />
                  <div className="merchant-pos-product-main">
                    <h3>{item.nome}</h3>
                    <p>{item.descricao}</p>
                    <strong>{formatCurrency(item.preco)}</strong>
                  </div>
                  <div className="merchant-pos-product-actions">
                    <button type="button" className="btn btn-primary" onClick={() => (hasCustomization ? setSelectedItem(item) : addDirectItem(item))}>
                      <MdPointOfSale /> {hasCustomization ? "Personalizar" : "Adicionar"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="merchant-pos-cart">
          <section className="dashboard-panel">
            <div className="dashboard-panel-head">
              <div>
                <p className="prompt-card-kicker">TIPO DE VENDA</p>
                <h3>Operacao atual</h3>
              </div>
            </div>
            <div className="merchant-pos-sale-types">
              {SALE_TYPES.map((entry) => (
                <button key={entry.id} type="button" className={saleType === entry.id ? "active" : ""} onClick={() => setSaleType(entry.id)}>
                  {entry.label}
                </button>
              ))}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-head">
              <div>
                <p className="prompt-card-kicker">CLIENTE</p>
                <h3>Associar venda</h3>
              </div>
              <button type="button" className="btn btn-outline" onClick={() => setShowCustomerForm((value) => !value)}>
                <MdPersonAdd /> Novo
              </button>
            </div>

            <div className="orders-v2-search">
              <span><MdSearch /></span>
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>

            <div className="merchant-pos-customers">
              {loadingCustomers ? <p className="muted">Buscando clientes...</p> : null}
              {!loadingCustomers && customers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  className={`merchant-pos-customer ${selectedCustomer?.id === customer.id ? "active" : ""}`}
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <strong>{customer.nome}</strong>
                  <span>{customer.whatsapp || customer.telefone || "Sem telefone"}</span>
                </button>
              ))}
            </div>

            {showCustomerForm ? (
              <div className="merchant-pos-customer-form">
                <input placeholder="Nome" value={customerForm.nome} onChange={(e) => setCustomerForm((prev) => ({ ...prev, nome: e.target.value }))} />
                <input placeholder="Telefone" value={customerForm.telefone} onChange={(e) => setCustomerForm((prev) => ({ ...prev, telefone: e.target.value }))} />
                <input placeholder="WhatsApp" value={customerForm.whatsapp} onChange={(e) => setCustomerForm((prev) => ({ ...prev, whatsapp: e.target.value }))} />
                <input placeholder="Email" value={customerForm.email} onChange={(e) => setCustomerForm((prev) => ({ ...prev, email: e.target.value }))} />
                <div className="menu-v2-grid2">
                  <input placeholder="Logradouro" value={customerForm.logradouro} onChange={(e) => setCustomerForm((prev) => ({ ...prev, logradouro: e.target.value }))} />
                  <input placeholder="Numero" value={customerForm.numero} onChange={(e) => setCustomerForm((prev) => ({ ...prev, numero: e.target.value }))} />
                </div>
                <button type="button" className="btn btn-primary" onClick={createCustomer} disabled={creatingCustomer}>
                  {creatingCustomer ? "Salvando..." : "Salvar cliente"}
                </button>
              </div>
            ) : null}
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-head">
              <div>
                <p className="prompt-card-kicker">CARRINHO</p>
                <h3>Venda atual</h3>
              </div>
            </div>

            <div className="merchant-pos-cart-list">
              {cartItems.length ? cartItems.map((item) => (
                <article key={item.id} className="merchant-pos-cart-item">
                  <div className="merchant-pos-cart-head">
                    <div>
                      <strong>{item.quantidade}x {item.nome}</strong>
                      <span>{formatCurrency(item.unitPrice * item.quantidade)}</span>
                    </div>
                    <button type="button" className="merchant-pos-remove" onClick={() => removeCartItem(item.id)}>
                      <MdDelete />
                    </button>
                  </div>
                  {buildSelectionSummary(item.selectedGroups, item.customerNote).map((line) => (
                    <small key={line}>{line}</small>
                  ))}
                  <div className="merchant-pos-qty">
                    <button type="button" onClick={() => updateCartQuantity(item.id, -1)}>-</button>
                    <span>{item.quantidade}</span>
                    <button type="button" onClick={() => updateCartQuantity(item.id, 1)}>+</button>
                  </div>
                </article>
              )) : <p className="muted">Nenhum item adicionado ainda.</p>}
            </div>

            <div className="merchant-pos-discounts">
              <div className="menu-v2-grid2">
                <label>
                  <span>Desconto R$</span>
                  <input type="number" step="0.01" value={discountFixed} onChange={(e) => setDiscountFixed(e.target.value)} />
                </label>
                <label>
                  <span>Desconto %</span>
                  <input type="number" step="0.01" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} />
                </label>
              </div>
              <label>
                <span>Observacao geral</span>
                <textarea rows={3} value={generalNote} onChange={(e) => setGeneralNote(e.target.value)} placeholder="Recado interno ou observacao da venda..." />
              </label>
            </div>

            <div className="merchant-pos-payments">
              <div className="dashboard-panel-head">
                <div>
                  <p className="prompt-card-kicker">PAGAMENTO</p>
                  <h3>Fechamento da venda</h3>
                </div>
                <button type="button" className="btn btn-outline" onClick={addPayment}>
                  <MdAdd /> Adicionar
                </button>
              </div>

              <label>
                <span>Status financeiro</span>
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                  {PAYMENT_STATUSES.map((entry) => (
                    <option key={entry.id} value={entry.id}>{entry.label}</option>
                  ))}
                </select>
              </label>

              <div className="merchant-pos-payment-list">
                {payments.map((payment, index) => (
                  <article key={payment.id} className="merchant-pos-payment-card">
                    <div className="merchant-pos-payment-head">
                      <strong>Pagamento {index + 1}</strong>
                      <button type="button" className="merchant-pos-remove" onClick={() => removePayment(payment.id)}>
                        <MdDelete />
                      </button>
                    </div>

                    <div className="menu-v2-grid2">
                      <label>
                        <span>Metodo</span>
                        <select value={payment.method} onChange={(e) => updatePayment(payment.id, { method: e.target.value })}>
                          {PAYMENT_METHODS.map((entry) => (
                            <option key={entry.id} value={entry.id}>{entry.label}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>Valor</span>
                        <input
                          type="number"
                          step="0.01"
                          value={payment.amount}
                          onChange={(e) => updatePayment(payment.id, { amount: e.target.value })}
                          placeholder="0,00"
                        />
                      </label>
                    </div>

                    {payment.method === "DINHEIRO" ? (
                      <label>
                        <span>Valor recebido</span>
                        <input
                          type="number"
                          step="0.01"
                          value={payment.amountReceived}
                          onChange={(e) => updatePayment(payment.id, { amountReceived: e.target.value })}
                          placeholder="0,00"
                        />
                      </label>
                    ) : null}

                    <label>
                      <span>Referencia</span>
                      <input
                        type="text"
                        value={payment.reference}
                        onChange={(e) => updatePayment(payment.id, { reference: e.target.value })}
                        placeholder="NSU, codigo ou observacao curta"
                      />
                    </label>
                  </article>
                ))}
              </div>
            </div>

            <div className="merchant-pos-summary">
              <div className="list-row"><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
              <div className="list-row"><span>Desconto</span><strong>{formatCurrency(totalDiscount)}</strong></div>
              <div className="list-row"><span>Total em pagamentos</span><strong>{formatCurrency(paidAmount)}</strong></div>
              <div className="list-row"><span>Restante</span><strong>{formatCurrency(remainingAmount)}</strong></div>
              <div className="list-row"><span>Troco previsto</span><strong>{formatCurrency(projectedChange)}</strong></div>
              <div className="list-row total"><span>Total</span><strong>{formatCurrency(total)}</strong></div>
            </div>

            {feedback ? <p className={feedback.includes("sucesso") ? "success-text" : "error-text"}>{feedback}</p> : null}

            <button type="button" className="btn btn-primary merchant-pos-submit" onClick={finalizeSale} disabled={submitting}>
              {submitting ? "Finalizando..." : "Finalizar venda"}
            </button>
          </section>
        </aside>
      </div>

      <ProductCustomizationModal
        item={selectedItem}
        groups={selectedItem ? optionGroups.filter((group) => group.productIds.includes(String(selectedItem.id)) && group.active) : []}
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        onSubmit={(configuration) => {
          addCustomizedItem(configuration);
          return { ok: true };
        }}
      />
    </MerchantPanelShell>
  );
}
