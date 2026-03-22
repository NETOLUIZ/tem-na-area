import { useEffect, useState } from "react";
import { MdArrowBack, MdArrowForward } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store/AppContext";
import { getUserErrorMessage } from "../utils/errors";

const initialForm = {
  mode: "free",
  nome: "",
  categoria: "",
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
  horarioFuncionamento: "",
  logo: "",
  capa: "",
  observacoes: "",
};

const PLAN_DETAILS = {
  free: {
    title: "Plano vitrine",
    price: "R$ 0/mes",
    description: "Presenca basica na home com clique direto no WhatsApp.",
  },
  paid: {
    title: "Plano operacao",
    price: "R$ 49,90/mes",
    description: "Operacao completa com painel, produtos, campanhas e catalogo.",
  },
};

function getTotalSteps(mode) {
  return mode === "paid" ? 4 : 3;
}

function getStepTitle(mode, step) {
  if (step === 1) return "Escolha seu formato de entrada";
  if (step === 2) return "Dados da empresa";
  if (step === 3) return mode === "paid" ? "Endereco e operacao" : "Material de vitrine";
  return "Revisao da solicitacao";
}

function sanitizePhone(value) {
  return value.replace(/\D/g, "");
}

async function loadLocalImage(file) {
  if (!file) return "";

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Nao foi possivel ler a imagem selecionada."));
    reader.readAsDataURL(file);
  });
}

export default function RegisterStorePage() {
  const navigate = useNavigate();
  const { actions } = useApp();

  const [form, setForm] = useState(initialForm);
  const [currentStep, setCurrentStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);

  const totalSteps = getTotalSteps(form.mode);

  useEffect(() => {
    setCurrentStep((prev) => Math.min(prev, getTotalSteps(form.mode)));
  }, [form.mode]);

  useEffect(() => {
    const cep = sanitizePhone(form.cep);
    if (cep.length !== 8) return undefined;

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        setLoadingCep(true);
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!data || data.erro) return;

        setForm((prev) => ({
          ...prev,
          rua: prev.rua || data.logradouro || "",
          bairro: prev.bairro || data.bairro || "",
          cidade: prev.cidade || data.localidade || "",
        }));
      } catch {
        // silent fallback for CEP lookup
      } finally {
        setLoadingCep(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
      setLoadingCep(false);
    };
  }, [form.cep]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleModeChange(mode) {
    setError("");
    setSuccess("");
    setForm((prev) => ({ ...prev, mode }));
  }

  function handleBack() {
    setError("");
    setSuccess("");

    if (currentStep === 1) {
      navigate("/");
      return;
    }

    setCurrentStep((prev) => Math.max(1, prev - 1));
  }

  function validateCurrentStep() {
    if (currentStep === 1 && !form.mode) {
      return "Selecione o tipo de entrada antes de continuar.";
    }

    if (currentStep === 2) {
      if (!form.nome.trim()) return "Informe o nome da empresa.";
      if (!form.categoria.trim()) return "Informe a categoria principal.";
      if (!form.whatsapp.trim()) return "Informe o WhatsApp principal.";
    }

    if (currentStep === 3 && form.mode === "paid") {
      if (!form.email.trim()) return "Informe o e-mail de acesso.";
      if (!form.senha.trim()) return "Informe a senha inicial.";
      if (!form.cidade.trim()) return "Informe a cidade da empresa.";
    }

    return "";
  }

  function handleAdvance() {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSuccess("");
    setCurrentStep((prev) => Math.min(totalSteps, prev + 1));
  }

  async function handleImageChange(field, event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const image = await loadLocalImage(file);
      updateField(field, image);
    } catch (imageError) {
      setError(getUserErrorMessage(imageError));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      if (form.mode === "free") {
        await actions.registerContactLead({
          nome: form.nome.trim(),
          categoria: form.categoria.trim(),
          descricaoCurta: form.descricaoCurta.trim(),
          whatsapp: sanitizePhone(form.whatsapp),
          telefone: sanitizePhone(form.telefone),
          observacoes: form.observacoes.trim(),
          logo: form.logo,
          capa: form.capa,
        });

        setSuccess("Cadastro enviado. A vitrine sera analisada pela central.");
      } else {
        await actions.registerStore({
          nome: form.nome.trim(),
          categoria: form.categoria.trim(),
          descricaoCurta: form.descricaoCurta.trim(),
          whatsapp: sanitizePhone(form.whatsapp),
          telefone: sanitizePhone(form.telefone),
          email: form.email.trim(),
          senha: form.senha,
          cep: sanitizePhone(form.cep),
          rua: form.rua.trim(),
          numero: form.numero.trim(),
          bairro: form.bairro.trim(),
          cidade: form.cidade.trim(),
          horarioFuncionamento: form.horarioFuncionamento.trim(),
          logo: form.logo,
          capa: form.capa,
          observacoes: form.observacoes.trim(),
        });

        setSuccess("Solicitacao enviada. Depois da aprovacao e do pagamento, a area da empresa sera liberada.");
      }

      setCurrentStep(1);
      setForm(initialForm);
    } catch (submitError) {
      setError(getUserErrorMessage(submitError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="register-v2-page">
      <header className="register-v2-topbar">
        <button type="button" className="btn btn-ghost" onClick={() => navigate("/")}>
          Voltar para home
        </button>
      </header>

      <main className="register-v2-main">
        <section className="register-v2-progress-box">
          <p className="eyebrow">Entrada da rede</p>
          <h1>{getStepTitle(form.mode, currentStep)}</h1>
          <p className="muted">
            No plano operacao, a empresa envia a solicitacao para analise. Depois da
            confirmacao do pagamento e da aprovacao da central, o painel e liberado.
          </p>

          <div className="register-v2-steps" aria-label="Etapas do cadastro">
            {Array.from({ length: totalSteps }).map((_, index) => {
              const step = index + 1;
              const active = step === currentStep;
              const done = step < currentStep;

              return (
                <span
                  key={step}
                  className={`register-v2-step ${active ? "is-active" : ""} ${done ? "is-done" : ""}`}
                >
                  {step}
                </span>
              );
            })}
          </div>
        </section>

        <form className="register-v2-form" onSubmit={handleSubmit}>
          {currentStep === 1 && (
            <section className="register-v2-card">
              <div className="register-v2-mode-grid">
                {Object.entries(PLAN_DETAILS).map(([key, plan]) => {
                  const selected = form.mode === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`register-v2-mode ${selected ? "is-selected" : ""}`}
                      onClick={() => handleModeChange(key)}
                    >
                      <strong>{plan.title}</strong>
                      <span>{plan.description}</span>
                      <em>{plan.price}</em>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {currentStep === 2 && (
            <section className="register-v2-card register-v2-grid">
              <label>
                <span>Nome da empresa</span>
                <input value={form.nome} onChange={(e) => updateField("nome", e.target.value)} />
              </label>

              <label>
                <span>Categoria</span>
                <input
                  value={form.categoria}
                  onChange={(e) => updateField("categoria", e.target.value)}
                  placeholder="Hamburgueria, pizzaria, acai..."
                />
              </label>

              <label className="full">
                <span>Descricao curta</span>
                <textarea
                  rows={3}
                  value={form.descricaoCurta}
                  onChange={(e) => updateField("descricaoCurta", e.target.value)}
                />
              </label>

              <label>
                <span>WhatsApp</span>
                <input
                  value={form.whatsapp}
                  onChange={(e) => updateField("whatsapp", e.target.value)}
                />
              </label>

              <label>
                <span>Telefone</span>
                <input value={form.telefone} onChange={(e) => updateField("telefone", e.target.value)} />
              </label>
            </section>
          )}

          {currentStep === 3 && form.mode === "free" && (
            <section className="register-v2-card register-v2-grid">
              <label className="full">
                <span>Logo</span>
                <input type="file" accept="image/*" onChange={(e) => handleImageChange("logo", e)} />
              </label>

              <label className="full">
                <span>Capa</span>
                <input type="file" accept="image/*" onChange={(e) => handleImageChange("capa", e)} />
              </label>

              <label className="full">
                <span>Observacoes</span>
                <textarea
                  rows={4}
                  value={form.observacoes}
                  onChange={(e) => updateField("observacoes", e.target.value)}
                />
              </label>
            </section>
          )}

          {currentStep === 3 && form.mode === "paid" && (
            <section className="register-v2-card register-v2-grid">
              <label>
                <span>E-mail de acesso</span>
                <input value={form.email} onChange={(e) => updateField("email", e.target.value)} />
              </label>

              <label>
                <span>Senha inicial</span>
                <input
                  type="password"
                  value={form.senha}
                  onChange={(e) => updateField("senha", e.target.value)}
                />
              </label>

              <label>
                <span>CEP</span>
                <input value={form.cep} onChange={(e) => updateField("cep", e.target.value)} />
                {loadingCep && <small>Buscando endereco...</small>}
              </label>

              <label>
                <span>Rua</span>
                <input value={form.rua} onChange={(e) => updateField("rua", e.target.value)} />
              </label>

              <label>
                <span>Numero</span>
                <input value={form.numero} onChange={(e) => updateField("numero", e.target.value)} />
              </label>

              <label>
                <span>Bairro</span>
                <input value={form.bairro} onChange={(e) => updateField("bairro", e.target.value)} />
              </label>

              <label>
                <span>Cidade</span>
                <input value={form.cidade} onChange={(e) => updateField("cidade", e.target.value)} />
              </label>

              <label>
                <span>Horario de funcionamento</span>
                <input
                  value={form.horarioFuncionamento}
                  onChange={(e) => updateField("horarioFuncionamento", e.target.value)}
                />
              </label>
            </section>
          )}

          {currentStep === 4 && form.mode === "paid" && (
            <section className="register-v2-card register-v2-grid">
              <label className="full">
                <span>Logo</span>
                <input type="file" accept="image/*" onChange={(e) => handleImageChange("logo", e)} />
              </label>

              <label className="full">
                <span>Capa</span>
                <input type="file" accept="image/*" onChange={(e) => handleImageChange("capa", e)} />
              </label>

              <label className="full">
                <span>Observacoes</span>
                <textarea
                  rows={4}
                  value={form.observacoes}
                  onChange={(e) => updateField("observacoes", e.target.value)}
                />
              </label>
            </section>
          )}

          {error ? <p className="error-text">{error}</p> : null}
          {success ? <p className="success-text">{success}</p> : null}

          <div className="register-v2-actions">
            <button type="button" className="btn btn-outline" onClick={handleBack} disabled={busy}>
              {currentStep === 1 ? "Cancelar" : "Voltar"}
            </button>

            {currentStep === 1 && form.mode === "paid" ? (
              <button type="button" className="btn btn-outline" onClick={() => navigate("/pdv")}>
                Area da empresa
              </button>
            ) : null}

            {currentStep < totalSteps ? (
              <button type="button" className="btn btn-primary" onClick={handleAdvance} disabled={busy}>
                Avancar <MdArrowForward />
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? "Enviando..." : "Enviar solicitacao"}
              </button>
            )}
          </div>

          {form.mode === "paid" && currentStep === 1 ? (
            <p className="muted register-v2-login-tip">
              Ja tem plano pago liberado? Use <strong>Area da empresa</strong> para entrar no painel.
            </p>
          ) : null}
        </form>
      </main>
    </div>
  );
}
