import { useEffect, useState } from "react";
import { MdArrowBack, MdArrowForward } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store/AppContext";

const initial = {
  mode: "paid",
  nome: "",
  categoria: "comida",
  descricaoCurta: "",
  whatsapp: "",
  telefone: "",
  email: "",
  senha: "",
  cep: "",
  rua: "",
  numero: "",
  bairro: "",
  cidade: "",
  horarioFuncionamento: "Seg-Dom 10h às 22h",
  logo: "",
  capa: "",
  observacoes: ""
};

const PLAN_DETAILS = {
  free: {
    label: "Plano grátis",
    price: "R$ 0/mês",
    description: "Card simples na home com clique direto no WhatsApp.",
    benefits: ["Cadastro rápido", "Aprovação pelo super admin", "Publicação como card de WhatsApp"]
  },
  paid: {
    label: "Plano pago",
    price: "R$ 49,90/mês",
    description: "Loja completa com painel, produtos, banner e cardápio.",
    benefits: ["Painel administrativo", "Cadastro de produtos e promoções", "Loja publicada na plataforma"]
  }
};

function getTotalSteps(mode) {
  return mode === "paid" ? 4 : 2;
}

function getStepTitle(mode, step) {
  if (mode === "free") {
    return step === 1 ? "Escolha do plano" : "Dados básicos";
  }

  if (step === 1) return "Escolha do plano";
  if (step === 2) return "Confirmação do pagamento";
  if (step === 3) return "Conta da empresa";
  return "Dados da loja";
}

export default function RegisterStorePage() {
  const navigate = useNavigate();
  const { actions } = useApp();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initial);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");

  const totalSteps = getTotalSteps(form.mode);
  const currentStep = Math.min(step, totalSteps);
  const progressWidth = `${Math.round((currentStep / totalSteps) * 100)}%`;

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    const cepDigits = String(form.cep || "").replace(/\D+/g, "");
    if (!cepDigits) {
      setCepError("");
      setCepLoading(false);
      return undefined;
    }

    if (cepDigits.length < 8) {
      setCepError("");
      setCepLoading(false);
      return undefined;
    }

    if (cepDigits.length !== 8) {
      setCepLoading(false);
      setCepError("CEP invalido.");
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        setCepLoading(true);
        setCepError("");

        const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`, {
          signal: controller.signal
        });
        const payload = await response.json();

        if (!response.ok || payload.erro) {
          throw new Error("CEP nao encontrado.");
        }

        setForm((prev) => ({
          ...prev,
          cep: cepDigits,
          rua: payload.logradouro || prev.rua,
          bairro: payload.bairro || prev.bairro,
          cidade: payload.localidade || prev.cidade
        }));
      } catch (lookupError) {
        if (controller.signal.aborted) {
          return;
        }
        setCepError(lookupError.message || "Nao foi possivel buscar o CEP.");
      } finally {
        if (!controller.signal.aborted) {
          setCepLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [form.cep]);

  function handleModeChange(mode) {
    setForm((prev) => ({ ...prev, mode }));
    setStep(1);
    setPaymentConfirmed(false);
    setSuccess("");
    setError("");
  }

  function handleBack() {
    if (currentStep > 1) {
      setStep((prev) => prev - 1);
      return;
    }

    navigate("/");
  }

  function handleAdvance() {
    if (form.mode === "paid" && currentStep === 2 && !paymentConfirmed) return;
    setStep((prev) => Math.min(totalSteps, prev + 1));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (form.mode === "free") {
        await actions.registerContactLead({
          nome: form.nome,
          whatsapp: form.whatsapp,
          cep: form.cep,
          rua: form.rua,
          numero: form.numero,
          bairro: form.bairro,
          cidade: form.cidade,
          categoria: form.categoria,
          observacoes: form.observacoes
        });

        setSuccess("Solicitação enviada com sucesso. Aguarde autorização para publicação do card na home.");
        return;
      }

      const store = await actions.registerStore({
        nome: form.nome,
        categoria: form.categoria,
        descricaoCurta: form.descricaoCurta,
        whatsapp: form.whatsapp,
        telefone: form.telefone,
        senha: form.senha,
        endereco: {
          cep: form.cep,
          rua: form.rua,
          numero: form.numero,
          bairro: form.bairro,
          cidade: form.cidade
        },
        horarioFuncionamento: form.horarioFuncionamento,
        logo:
          form.logo ||
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30auto=format&fit=crop&w=700&q=80",
        capa:
          form.capa ||
          "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17auto=format&fit=crop&w=1200&q=80",
        planType: "paid",
        paymentStatus: "approved"
      });

      setSuccess(`Solicitação enviada com sucesso. Protocolo interno: ${store.id}.`);
    } catch (submitError) {
      setError(submitError.message || "Não foi possível enviar o cadastro agora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-v2-page">
      <header className="register-v2-topbar">
        <button type="button" className="register-v2-back" onClick={handleBack} aria-label="Voltar">
          <MdArrowBack />
        </button>
        <h1>Cadastrar minha empresa</h1>
        <div className="register-v2-empty" />
      </header>

      <section className="register-v2-progress-box">
        <div className="register-v2-progress-head">
          <p>Passo {currentStep}: {getStepTitle(form.mode, currentStep)}</p>
          <span>{currentStep}/{totalSteps}</span>
        </div>
        <div className="register-v2-progress-track">
          <div className="register-v2-progress-fill" style={{ width: progressWidth }} />
        </div>
      </section>

      <main className="register-v2-main">
        <h2>{form.mode === "paid" ? "Escolha um plano" : "Plano grátis"}</h2>
        <p>
          {form.mode === "paid"
            ? "No plano pago a empresa confirma o pagamento, cria a conta e depois configura a loja completa no painel."
            : "No plano grátis a empresa envia uma solicitação simples. Depois da aprovação, o sistema publica um card com clique direto no WhatsApp."}
        </p>

        {success ? (
          <div className="stack">
            <p className="success-text">{success}</p>
            <div className="register-v2-actions">
              <button type="button" className="btn btn-outline" onClick={() => navigate("/")}>
                Ir para a home
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate(form.mode === "paid" ? "/login-loja" : "/")}
              >
                {form.mode === "paid" ? "Ir para o login da loja" : "Concluir"}
              </button>
            </div>
          </div>
        ) : null}

        {error ? <p className="error-text">{error}</p> : null}

        <form className="register-v2-form" onSubmit={handleSubmit}>
          {currentStep === 1 ? (
            <div className="register-v2-mode-grid">
              {Object.entries(PLAN_DETAILS).map(([mode, plan]) => (
                <button
                  key={mode}
                  type="button"
                  className={`register-v2-mode-card ${form.mode === mode ? "active" : ""}`}
                  onClick={() => handleModeChange(mode)}
                >
                  <strong>{plan.label}</strong>
                  <span>{plan.description}</span>
                  <small className="register-v2-plan-price">{plan.price}</small>
                </button>
              ))}
            </div>
          ) : null}

          {form.mode === "free" && currentStep === 2 ? (
            <>
              <label>
                <span>Nome do negócio</span>
                <input value={form.nome} onChange={(event) => updateField("nome", event.target.value)} required />
              </label>

              <div className="register-v2-two">
                <label>
                  <span>Categoria</span>
                  <select value={form.categoria} onChange={(event) => updateField("categoria", event.target.value)}>
                    <option value="comida">Comida</option>
                    <option value="servico">Serviço</option>
                    <option value="loja">Loja</option>
                  </select>
                </label>
                <label>
                  <span>WhatsApp</span>
                  <input value={form.whatsapp} onChange={(event) => updateField("whatsapp", event.target.value)} required />
                </label>
              </div>

              <div className="register-v2-two">
                <label>
                  <span>CEP</span>
                  <input value={form.cep} onChange={(event) => updateField("cep", event.target.value)} />
                </label>
                <label>
                  <span>Bairro</span>
                  <input value={form.bairro} onChange={(event) => updateField("bairro", event.target.value)} />
                </label>
              </div>

              {cepLoading ? <p className="register-v2-helper">Buscando CEP...</p> : null}
              {cepError ? <p className="error-text">{cepError}</p> : null}

              <div className="register-v2-two">
                <label>
                  <span>Rua</span>
                  <input value={form.rua} onChange={(event) => updateField("rua", event.target.value)} />
                </label>
                <label>
                  <span>Número</span>
                  <input value={form.numero} onChange={(event) => updateField("numero", event.target.value)} />
                </label>
              </div>

              <div className="register-v2-two">
                <label>
                  <span>Cidade</span>
                  <input value={form.cidade} onChange={(event) => updateField("cidade", event.target.value)} />
                </label>
                <label>
                  <span>Descrição rápida</span>
                  <input value={form.observacoes} onChange={(event) => updateField("observacoes", event.target.value)} />
                </label>
              </div>

              <div className="register-v2-note">
                <strong>Fluxo do plano grátis:</strong>
                <span>O super admin aprova o pedido e o sistema cria automaticamente um card simples na home. O clique nesse card abre o WhatsApp.</span>
              </div>
            </>
          ) : null}

          {form.mode === "paid" && currentStep === 2 ? (
            <>
              <div className="register-v2-plan-box register-v2-plan-box-paid">
                <div>
                  <strong>{PLAN_DETAILS.paid.label}</strong>
                  <span>{PLAN_DETAILS.paid.price}</span>
                </div>
                <p>Com o pagamento aprovado, o cadastro da conta e da loja é liberado imediatamente.</p>
                <ul className="register-v2-benefits">
                  <li>Banner da loja</li>
                  <li>Produtos e cardápio</li>
                  <li>Painel administrativo da empresa</li>
                </ul>
              </div>

              <label className="register-v2-check">
                <input
                  type="checkbox"
                  checked={paymentConfirmed}
                  onChange={(event) => setPaymentConfirmed(event.target.checked)}
                />
                <span>Simular pagamento aprovado para liberar o cadastro</span>
              </label>
            </>
          ) : null}

          {form.mode === "paid" && currentStep === 3 ? (
            <>
              <label>
                <span>Nome da loja</span>
                <input value={form.nome} onChange={(event) => updateField("nome", event.target.value)} required />
              </label>

              <div className="register-v2-two">
                <label>
                  <span>E-mail</span>
                  <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
                </label>
                <label>
                  <span>Senha</span>
                  <input type="password" value={form.senha} onChange={(event) => updateField("senha", event.target.value)} required />
                </label>
              </div>

              <div className="register-v2-two">
                <label>
                  <span>Telefone para login</span>
                  <input value={form.telefone} onChange={(event) => updateField("telefone", event.target.value)} required />
                </label>
                <label>
                  <span>WhatsApp</span>
                  <input value={form.whatsapp} onChange={(event) => updateField("whatsapp", event.target.value)} required />
                </label>
              </div>

              <label>
                <span>Descrição curta</span>
                <textarea value={form.descricaoCurta} onChange={(event) => updateField("descricaoCurta", event.target.value)} required />
              </label>
            </>
          ) : null}

          {form.mode === "paid" && currentStep === 4 ? (
            <>
              <div className="register-v2-two">
                <label>
                  <span>CEP</span>
                  <input value={form.cep} onChange={(event) => updateField("cep", event.target.value)} required />
                </label>
                <div />
              </div>

              {cepLoading ? <p className="register-v2-helper">Buscando CEP...</p> : null}
              {cepError ? <p className="error-text">{cepError}</p> : null}

              <div className="register-v2-two">
                <label>
                  <span>Categoria</span>
                  <select value={form.categoria} onChange={(event) => updateField("categoria", event.target.value)}>
                    <option value="comida">Comida</option>
                    <option value="servico">Serviço</option>
                    <option value="loja">Loja</option>
                  </select>
                </label>
                <label>
                  <span>Cidade</span>
                  <input value={form.cidade} onChange={(event) => updateField("cidade", event.target.value)} required />
                </label>
              </div>

              <div className="register-v2-two">
                <label>
                  <span>Rua</span>
                  <input value={form.rua} onChange={(event) => updateField("rua", event.target.value)} required />
                </label>
                <label>
                  <span>Número</span>
                  <input value={form.numero} onChange={(event) => updateField("numero", event.target.value)} required />
                </label>
              </div>

              <div className="register-v2-two">
                <label>
                  <span>Bairro</span>
                  <input value={form.bairro} onChange={(event) => updateField("bairro", event.target.value)} required />
                </label>
                <label>
                  <span>Cidade</span>
                  <input value={form.cidade} onChange={(event) => updateField("cidade", event.target.value)} required />
                </label>
              </div>

              <label>
                <span>Horário de funcionamento</span>
                <input value={form.horarioFuncionamento} onChange={(event) => updateField("horarioFuncionamento", event.target.value)} />
              </label>

              <div className="register-v2-two">
                <label>
                  <span>URL da logo</span>
                  <input value={form.logo} onChange={(event) => updateField("logo", event.target.value)} />
                </label>
                <label>
                  <span>URL da capa</span>
                  <input value={form.capa} onChange={(event) => updateField("capa", event.target.value)} />
                </label>
              </div>
            </>
          ) : null}

          <div className="register-v2-actions">
            <button type="button" className="btn btn-outline" onClick={handleBack}>
              {currentStep > 1 ? "Voltar" : "Cancelar"}
            </button>
            {currentStep < totalSteps ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAdvance}
                disabled={loading || (form.mode === "paid" && currentStep === 2 && !paymentConfirmed)}
              >
                Avançar <MdArrowForward />
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Enviando..." : form.mode === "free" ? "Enviar solicitação" : "Criar conta da empresa"}
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
