import { useMemo, useState } from "react";
import { MdArrowForward } from "react-icons/md";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
      setError("Nao foi possivel finalizar. Verifique sua sacola.");
      return;
    }

    navigate("/pedido/sucesso", { state: { orderId: order.id } });
  }

  if (!cart.items.length) {
    return (
      <div className="container page-space">
        <div className="empty-state">
          <h3>Sacola vazia</h3>
          <p>Voce precisa adicionar itens antes de finalizar.</p>
          <Link className="btn btn-primary" to="/">Voltar para a Home</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="checkout-v2-page">
      <header className="checkout-v2-header">
        <div className="checkout-v2-title-block">
          <p className="checkout-v2-kicker">Confirmacao final no Tem na Area</p>
          <h1>Finalizar pedido</h1>
          <p>{cart.store?.nome}</p>
        </div>
      </header>

      <section className="checkout-v2-body">
        <form className="checkout-v2-form" onSubmit={submit} id="checkout-form">
          <div className="checkout-v2-card">
            <h2>Dados para entrega</h2>

            <input placeholder="Nome completo" value={form.nome} onChange={(e) => updateField("nome", e.target.value)} />
            <input placeholder="Telefone" value={form.telefone} onChange={(e) => updateField("telefone", e.target.value)} />
            <input placeholder="CEP" value={form.cep} onChange={(e) => updateField("cep", e.target.value)} />
            <input placeholder="Rua" value={form.rua} onChange={(e) => updateField("rua", e.target.value)} />
            <input placeholder="Casa / numero" value={form.numero} onChange={(e) => updateField("numero", e.target.value)} />
            <input placeholder="Bairro" value={form.bairro} onChange={(e) => updateField("bairro", e.target.value)} />
            <input placeholder="Cidade" value={form.cidade} onChange={(e) => updateField("cidade", e.target.value)} />
            <textarea
              placeholder="Observacoes do pedido (opcional)"
              value={form.observacoes}
              onChange={(e) => updateField("observacoes", e.target.value)}
              rows={3}
            />

            {error ? <p className="error-text">{error}</p> : null}
          </div>

          <div className="checkout-v2-card summary">
            <div className="checkout-v2-summary-head">
              <h3>Resumo do pedido</h3>
              <span>{totalItems} itens</span>
            </div>

            <div className="checkout-v2-summary-list">
              {cart.items.map((row) => (
                <div key={row.id} className="checkout-v2-summary-row checkout-v2-summary-row-stack">
                  <div>
                    <span>{row.quantidade}x {row.item.nome}</span>
                    {row.summaryLines?.length ? (
                      <div className="cart-line-summary">
                        {row.summaryLines.map((line) => <small key={line}>{line}</small>)}
                      </div>
                    ) : null}
                  </div>
                  <strong>{formatCurrency(row.subtotal)}</strong>
                </div>
              ))}
            </div>
          </div>
        </form>
      </section>

      <footer className="checkout-v2-footer">
        <div className="checkout-v2-total">
          <span>Total do pedido</span>
          <strong>{formatCurrency(cart.total)}</strong>
        </div>
        <button className="checkout-v2-submit" type="submit" form="checkout-form">
          {loading ? "Enviando..." : "Confirmar pedido"} <span aria-hidden="true"><MdArrowForward /></span>
        </button>
        <div className="checkout-v2-handle" />
      </footer>
    </main>
  );
}
