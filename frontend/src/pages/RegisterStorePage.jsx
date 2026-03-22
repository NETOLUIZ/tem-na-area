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
  horarioFuncionamento: "Seg-Dom 10h as 22h",
  logo: "",
  capa: "",
  observacoes: ""
};

const PLAN_DETAILS = {
  free: {
    label: "Plano vitrine",
    price: "R$ 0/mes",
    description: "Presença básica na home com clique direto no WhatsApp."
  },
  paid: {
    label: "Plano operação",
    price: "R$ 49,90/mes",
    description: "Operação completa com painel, produtos, campanhas e catálogo."
  }
};

function getTotalSteps(mode) {
  return mode === "paid" ? 3 : 2;
}

function getStepTitle(mode, step) {
  if (mode === "free") {
    return step === 1 ? "Escolha do plano" : "Dados básicos";
  }

  if (step === 1) return "Escolha do plano";
  if (step === 2) return "Conta da empresa";
  return "Dados da loja";
}

export default function RegisterStorePage() {
  const navigate = useNavigate();
  const { actions } = useApp();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initial);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");
  const [localLogoName, setLocalLogoName] = useState("");
  const [localCapaName, setLocalCapaName] = useState("");

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
      setCepError("CEP inválido.");
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
          throw new Error("CEP não encontrado.");
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
        setCepError(lookupError.message || "Não foi possível buscar o CEP.");
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
    if (form.mode === "paid" && currentStep === 2) {
      const missing = [];
      if (!String(form.nome || "").trim()) missing.push("nome da loja");
      if (!String(form.telefone || "").trim()) missing.push("telefone para login");
      if (!String(form.whatsapp || "").trim()) missing.push("WhatsApp");
      if (!String(form.senha || "").trim()) missing.push("senha");
      if (!String(form.descricaoCurta || "").trim()) missing.push("descrição curta");

      if (missing.length > 0) {
        setError(`Preencha antes de avançar: ${missing.join(", ")}.`);
        return;
      }
    }

    if ((form.mode === "paid" || form.mode === "free") && currentStep === totalSteps) {
      return;
    }

    if (form.mode === "paid" && currentStep === 3) {
      const missing = [];
      if (!String(form.cep || "").trim()) missing.push("CEP");
      if (!String(form.rua || "").trim()) missing.push("rua");
      if (!String(form.numero || "").trim()) missing.push("número");
      if (!String(form.bairro || "").trim()) missing.push("bairro");
      if (!String(form.cidade || "").trim()) missing.push("cidade");

      if (missing.length > 0) {
        setError(`Preencha antes de concluir: ${missing.join(", ")}.`);
        return;
      }
    }

    setError("");
    setStep((prev) => Math.min(totalSteps, prev + 1));
  }

  function loadLocalImage(file, setFileName) {
    if (!file) {
      setFileName("");
      return;
    }
    setFileName(file.name);
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

        setSuccess("Solicitação enviada com sucesso. Aguarde a aprovação para publicar sua vitrine na home.");
        return;
      }

      const store = await actions.registerStore({
        nome: form.nome,
        email: form.email,
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
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80",
        capa:
          form.capa ||
          "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80",
        planType: "paid",
        paymentStatus: "pending"
      });

      setSuccess(`Solicitação enviada com sucesso. Aguarde confirmação do pagamento e aprovação da central. Protocolo: ${store.id}.`);
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
        <h1>Entrar para a rede</h1>
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
        <h2>{form.mode === "paid" ? "Escolha seu formato de entrada" : "Plano vitrine"}</h2>
        <p>
          {form.mode === "paid"
            ? "No plano operação, a empresa envia a solicitação para análise. Depois da confirmação do pagamento e da aprovação da central, o painel é liberado."
            : "No plano vitrine, a empresa envia uma solicitação simples. Depois da aprovação, a plataforma publica uma vitrine com clique direto no WhatsApp."}
        </p>

        {success ? (
          <div className="stack">
            <p className="success-text">{success}</p>
            <div className="register-v2-actions">
              <button type="button" className="btn btn-outline" onClick={() => navigate("/")}>
                Ir para o início
              </button>
              <button type="button" className="btn btn-primary" onClick={() => navigate("/")}>
                Concluir
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
                  <span>Resumo rápido</span>
                  <input value={form.observacoes} onChange={(event) => updateField("observacoes", event.target.value)} />
                </label>
              </div>

              <div className="register-v2-note">
                <strong>Fluxo do plano vitrine:</strong>
                <span>A central aprova o pedido e o sistema cria automaticamente uma vitrine simples na home. O clique leva direto para o WhatsApp.</span>
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
                <p>Seu cadastro segue para a central. Lá o pagamento pode ser confirmado e a operação aprovada manualmente.</p>
                <ul className="register-v2-benefits">
                  <li>Solicitação enviada para análise</li>
                  <li>Confirmação manual do pagamento</li>
                  <li>Aprovação manual da conta e da loja</li>
                </ul>
              </div>

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

          {form.mode === "paid" && currentStep === 3 ? (
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
                  <span>Arquivo local da logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => loadLocalImage(event.target.files?.[0], setLocalLogoName)}
                  />
                  {localLogoName ? <small className="register-v2-helper">{localLogoName}</small> : null}
                </label>
              </div>

              <div className="register-v2-two">
                <label>
                  <span>URL da capa</span>
                  <input value={form.capa} onChange={(event) => updateField("capa", event.target.value)} />
                </label>
                <label>
                  <span>Arquivo local da capa</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => loadLocalImage(event.target.files?.[0], setLocalCapaName)}
                  />
                  {localCapaName ? <small className="register-v2-helper">{localCapaName}</small> : null}
                </label>
              </div>
            </>
          ) : null}

          <div className="register-v2-actions">
            <button type="button" className="btn btn-outline" onClick={handleBack}>
              {currentStep > 1 ? "Voltar" : "Cancelar"}
            </button>
            {currentStep < totalSteps ? (
              <button type="button" className="btn btn-primary" onClick={handleAdvance} disabled={loading}>
                Avançar <MdArrowForward />
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Enviando..." : "Enviar solicitação"}
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
