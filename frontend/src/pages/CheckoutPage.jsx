import { useMemo, useState } from "react";
import { MdArrowForward, MdBatteryStd, MdSignalCellularAlt, MdWifi } from "react-icons/md";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../store/AppContext";
import { formatCurrency } from "../utils/format";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectors, actions } = useApp();
  const cart = selectors.cartDetailed();

  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    enderecoEntrega: location.state?.enderecoEntrega || "",
    observacoes: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const totalItems = useMemo(() => cart.items.reduce((sum, row) => sum + row.quantidade, 0), [cart.items]);

  function validate() {
    if (form.nome.trim().length < 3) return "Informe o nome completo.";
    if (form.telefone.replace(/\D/g, "").length < 10) return "Telefone inválido.";
    if (form.enderecoEntrega.trim().length < 8) return "Informe o endereço de entrega.";
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
      setError("Não foi possível finalizar. Verifique sua sacola.");
      return;
    }

    navigate("/pedido/sucesso", { state: { orderId: order.id } });
  }

  if (!cart.items.length) {
    return (
      <div className="container page-space">
        <div className="empty-state">
          <h3>Sacola vazia</h3>
          <p>Você precisa adicionar itens antes de finalizar.</p>
          <Link className="btn btn-primary" to="/">Voltar para a Home</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="checkout-v2-page">
      <div className="checkout-v2-statusbar">
        <span>9:41</span>
        <div><MdSignalCellularAlt /><MdWifi /><MdBatteryStd /></div>
      </div>

      <header className="checkout-v2-header">
        <div className="checkout-v2-title-block">
          <p className="checkout-v2-kicker">Confirmação final no Tem na Área</p>
          <h1>Finalizar pedido</h1>
          <p>{cart.store?.nome}</p>
        </div>
      </header>

      <section className="checkout-v2-body">
        <form className="checkout-v2-form" onSubmit={submit} id="checkout-form">
          <div className="checkout-v2-card">
            <h2>Dados para entrega</h2>

            <input placeholder="Nome completo" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <input placeholder="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            <input
              placeholder="Endereço de entrega"
              value={form.enderecoEntrega}
              onChange={(e) => setForm({ ...form, enderecoEntrega: e.target.value })}
            />
            <textarea
              placeholder="Observações do pedido (opcional)"
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
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
