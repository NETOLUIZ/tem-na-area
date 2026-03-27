import { useMemo, useState } from "react";
import { UserIcon, MapPinIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navigation, { BottomNav } from "../components/Navigation";
import Button from "../components/Button";
import { useApp } from "../store/AppContext";
import { formatCurrency } from "../utils/format";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectors, actions } = useApp();
  const cart = selectors.cartDetailed();
  const [street = "", number = "", district = "", city = ""] = String(location.state?.enderecoEntrega || "")
    .split(",")
    .map((item) => item.trim());

  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    cep: "",
    rua: street,
    numero: number,
    bairro: district,
    cidade: city,
    observacoes: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const totalItems = useMemo(() => cart.items.reduce((sum, row) => sum + row.quantidade, 0), [cart.items]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    if (form.nome.trim().length < 3) return "Informe o nome completo.";
    if (form.telefone.replace(/\D/g, "").length < 10) return "Telefone invalido.";
    if (form.cep.replace(/\D/g, "").length !== 8) return "Informe um CEP valido.";
    if (form.rua.trim().length < 3) return "Informe a rua de entrega.";
    if (form.numero.trim().length < 1) return "Informe o numero da entrega.";
    if (form.bairro.trim().length < 2) return "Informe o bairro da entrega.";
    if (form.cidade.trim().length < 2) return "Informe a cidade da entrega.";
    return "";
  }

  async function submit(e) {
    e.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      return;
    }

    setLoading(true);
    const order = await actions.createOrder(form);
    setLoading(false);

    if (!order) {
      setError("Nao foi possivel finalizar agora. Revise a sacola e tente novamente.");
      return;
    }

    navigate("/pedido/sucesso", { state: { orderId: order.id } });
  }

  if (!cart.items.length) {
    return (
      <>
        <Navigation userRole="customer" cartCount={0} />
        <div className="checkout-page-v2">
          <div className="empty-state" style={{ padding: "80px 20px", minHeight: "60vh", display: "grid", placeItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <h3>Sacola vazia</h3>
              <p>Você precisa adicionar itens antes de concluir o pedido.</p>
              <Link className="btn btn-primary" to="/">Voltar para o início</Link>
            </div>
          </div>
        </div>
        <BottomNav userRole="customer" />
      </>
    );
  }

  return (
    <>
      <Navigation userRole="customer" cartCount={cart.items.length} />

      <main className="checkout-page-v2">
        {/* Header com Steps */}
        <header className="checkout-header">
          <div className="checkout-header-content">
            <p className="checkout-kicker">Checkout seguro</p>
            <h1>Finalizar pedido</h1>
            <p className="checkout-subtitle">Revise seus dados e confirme o envio para <strong>{cart.store?.nome}</strong>.</p>
          </div>

          {/* Steps Progress */}
          <div className="checkout-steps">
            <div className="checkout-step completed">
              <div className="checkout-step-circle">
                <CheckCircleIcon width={20} height={20} strokeWidth={2} />
              </div>
              <small>Sacola pronta</small>
            </div>
            <div className="checkout-step-connector" />
            <div className="checkout-step active">
              <div className="checkout-step-circle">2</div>
              <small>Confirmação</small>
            </div>
            <div className="checkout-step-connector" />
            <div className="checkout-step">
              <div className="checkout-step-circle">3</div>
              <small>Enviado</small>
            </div>
          </div>
        </header>

        {/* Body */}
        <section className="checkout-body">
          {/* Form */}
          <form className="checkout-form" onSubmit={submit} id="checkout-form">
            <div className="checkout-card checkout-card-form">
              <div className="checkout-section-head">
                <div className="checkout-section-icon">
                  <UserIcon width={28} height={28} strokeWidth={1.5} />
                </div>
                <div>
                  <h2>Dados de Entrega</h2>
                  <p>Preencha os dados para concluir o pedido com rapidez.</p>
                </div>
              </div>

              <div className="checkout-form-grid">
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={form.nome}
                  onChange={(e) => updateField("nome", e.target.value)}
                  required
                />
                <input
                  type="tel"
                  placeholder="Telefone (11) 98765-4321"
                  value={form.telefone}
                  onChange={(e) => updateField("telefone", e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="CEP (ex: 01234567)"
                  value={form.cep}
                  onChange={(e) => updateField("cep", e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Rua"
                  value={form.rua}
                  onChange={(e) => updateField("rua", e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Nº"
                  value={form.numero}
                  onChange={(e) => updateField("numero", e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Bairro"
                  value={form.bairro}
                  onChange={(e) => updateField("bairro", e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Cidade"
                  value={form.cidade}
                  onChange={(e) => updateField("cidade", e.target.value)}
                  required
                />
              </div>

              <textarea
                placeholder="Observações (ex: interfone 123, portão aberto)"
                value={form.observacoes}
                onChange={(e) => updateField("observacoes", e.target.value)}
                rows={3}
              />

              {error && <p className="error-text">{error}</p>}
            </div>

            {/* Summary Card */}
            <div className="checkout-card checkout-summary-card">
              <div className="checkout-section-head">
                <div className="checkout-section-icon">
                  <MapPinIcon width={28} height={28} strokeWidth={1.5} />
                </div>
                <div className="checkout-summary-head">
                  <h2>Resumo do Pedido</h2>
                  <span className="checkout-item-count">{totalItems} item(ns)</span>
                </div>
              </div>

              <div className="checkout-summary-list">
                {cart.items.map((row) => (
                  <div key={row.id} className="checkout-summary-row">
                    <div>
                      <span className="checkout-summary-qty">{row.quantidade}x</span>
                      <strong>{row.item.nome}</strong>
                      {row.summaryLines?.length ? (
                        <div className="checkout-summary-notes">
                          {row.summaryLines.map((line) => (
                            <small key={line}>{line}</small>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <strong className="checkout-summary-price">{formatCurrency(row.subtotal)}</strong>
                  </div>
                ))}
              </div>

              <div className="checkout-summary-divider" />

              <div className="checkout-total">
                <span>Total do Pedido</span>
                <strong>{formatCurrency(cart.total)}</strong>
              </div>
            </div>
          </form>
        </section>

        {/* Footer */}
        <footer className="checkout-footer">
          <div className="checkout-footer-total">
            <small>Total</small>
            <strong>{formatCurrency(cart.total)}</strong>
          </div>
          <Button
            variant="primary"
            size="lg"
            type="submit"
            form="checkout-form"
            disabled={loading}
            style={{ width: "auto", minWidth: "200px" }}
          >
            {loading ? "Processando..." : "Confirmar Pedido"}
          </Button>
        </footer>
      </main>

      <BottomNav userRole="customer" activeRoute="/checkout" />
    </>
  );
}
