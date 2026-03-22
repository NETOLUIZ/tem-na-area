import { useEffect, useState } from "react";
import { MdArrowBack, MdArrowForward, MdCampaign, MdCheckCircle, MdDashboardCustomize, MdImage, MdPlace, MdRocketLaunch, MdSchedule, MdStorefront, MdVerifiedUser } from "react-icons/md";
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
    eyebrow: "Entrada rapida",
    features: [
      "Presenca simples na vitrine da plataforma",
      "Clique direto para WhatsApp",
      "Ideal para testar a demanda local",
    ],
  },
  paid: {
    title: "Plano operacao",
    price: "Falar com suporte",
    description: "Operacao completa com painel, produtos, campanhas e catalogo.",
    eyebrow: "Plano recomendado",
    features: [
      "Painel da empresa liberado apos aprovacao",
      "Cadastro de produtos, campanhas e catalogo",
      "Mais controle para vender e crescer na rede",
    ],
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

  const summaryRows = [
    { label: "Empresa", value: form.nome || "Nao informado" },
    { label: "Categoria", value: form.categoria || "Nao informado" },
    { label: "WhatsApp", value: form.whatsapp || "Nao informado" },
    { label: "Cidade", value: form.cidade || "Nao informado" },
  ];

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
              <div className="register-v2-entry-layout">
                <div className="register-v2-mode-grid">
                  {Object.entries(PLAN_DETAILS).map(([key, plan]) => {
                    const selected = form.mode === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`register-v2-mode ${selected ? "is-selected" : ""} ${key === "paid" ? "is-paid" : ""}`}
                        onClick={() => handleModeChange(key)}
                      >
                        <span className="register-v2-mode-eyebrow">{plan.eyebrow}</span>
                        <div className="register-v2-mode-head">
                          <strong>{plan.title}</strong>
                          <em>{plan.price}</em>
                        </div>
                        <span>{plan.description}</span>
                        <div className="register-v2-mode-list">
                          {plan.features.map((feature) => (
                            <small key={feature}>
                              <MdCheckCircle aria-hidden="true" />
                              {feature}
                            </small>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <aside className="register-v2-paid-promo">
                  <div className="register-v2-paid-kicker">
                    <MdRocketLaunch aria-hidden="true" />
                    Plano pago em destaque
                  </div>
                  <h3>Transforme sua pagina em uma operacao de verdade dentro do Tem na Area.</h3>
                  <p>
                    Em vez de aparecer so como contato, sua marca ganha estrutura para publicar produtos,
                    rodar campanhas e organizar melhor o atendimento.
                  </p>

                  <div className="register-v2-paid-highlights">
                    <article>
                      <MdDashboardCustomize aria-hidden="true" />
                      <strong>Painel proprio</strong>
                      <span>Controle sua empresa, produtos e campanhas em um so lugar.</span>
                    </article>
                    <article>
                      <MdCampaign aria-hidden="true" />
                      <strong>Mais destaque</strong>
                      <span>Publique promocoes e apareca com mais forca na home.</span>
                    </article>
                    <article>
                      <MdStorefront aria-hidden="true" />
                      <strong>Catalogo profissional</strong>
                      <span>Mostre itens, imagem, preco e organizacao para vender melhor.</span>
                    </article>
                  </div>

                  <div className="register-v2-paid-offer">
                    <div>
                      <span>Plano operacao</span>
                      <strong>Falar com suporte</strong>
                    </div>
                    <p>Escolha este plano para liberar uma presenca mais forte e comercial dentro da plataforma.</p>
                  </div>
                </aside>
              </div>
            </section>
          )}

          {currentStep === 2 && (
            <section className="register-v2-card">
              <div className="register-v2-section-head">
                <div>
                  <span className="register-v2-mini-kicker">Base da sua marca</span>
                  <h3>Conte quem voce e e como quer aparecer na rede</h3>
                </div>
                <p>Essas informacoes alimentam sua apresentacao inicial dentro da plataforma.</p>
              </div>

              <div className="register-v2-stage-layout">
                <div className="register-v2-grid">
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
                      placeholder="Descreva em poucas linhas o que torna sua empresa interessante."
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
                </div>

                <aside className="register-v2-sidecard">
                  <div className="register-v2-sidecard-icon"><MdStorefront /></div>
                  <h4>O que gera mais clique</h4>
                  <ul className="register-v2-sidecard-list">
                    <li>Nome claro e facil de lembrar</li>
                    <li>Categoria objetiva para aparecer melhor nas buscas</li>
                    <li>Descricao curta com diferencial real da empresa</li>
                    <li>WhatsApp principal pronto para atendimento</li>
                  </ul>
                </aside>
              </div>
            </section>
          )}

          {currentStep === 3 && form.mode === "free" && (
            <section className="register-v2-card">
              <div className="register-v2-section-head">
                <div>
                  <span className="register-v2-mini-kicker">Vitrine visual</span>
                  <h3>Envie os materiais que vao representar sua marca</h3>
                </div>
                <p>Uma capa forte e uma logo bem escolhida deixam sua vitrine mais profissional.</p>
              </div>

              <div className="register-v2-stage-layout">
                <div className="register-v2-grid">
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
                      placeholder="Passe instrucoes, contexto da marca ou detalhes importantes para a analise."
                    />
                  </label>
                </div>

                <aside className="register-v2-sidecard register-v2-sidecard-accent">
                  <div className="register-v2-sidecard-icon"><MdImage /></div>
                  <h4>Para sua vitrine performar melhor</h4>
                  <ul className="register-v2-sidecard-list">
                    <li>Use uma logo legivel mesmo em tamanho pequeno</li>
                    <li>Prefira capa horizontal com boa iluminacao</li>
                    <li>Evite imagens poluidas com muito texto</li>
                  </ul>
                </aside>
              </div>
            </section>
          )}

          {currentStep === 3 && form.mode === "paid" && (
            <section className="register-v2-card">
              <div className="register-v2-section-head">
                <div>
                  <span className="register-v2-mini-kicker">Acesso e operacao</span>
                  <h3>Prepare a estrutura que vai liberar seu painel</h3>
                </div>
                <p>Esses dados ajudam a central a validar sua empresa e configurar a operacao inicial.</p>
              </div>

              <div className="register-v2-stage-layout">
                <div className="register-v2-grid">
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
                </div>

                <aside className="register-v2-side-stack">
                  <div className="register-v2-sidecard">
                    <div className="register-v2-sidecard-icon"><MdVerifiedUser /></div>
                    <h4>Liberacao do plano</h4>
                    <ul className="register-v2-sidecard-list">
                      <li>Cadastro enviado para analise da central</li>
                      <li>Confirmacao do pagamento do plano</li>
                      <li>Painel liberado para operacao</li>
                    </ul>
                  </div>

                  <div className="register-v2-sidecard register-v2-sidecard-accent">
                    <div className="register-v2-sidecard-icon"><MdPlace /></div>
                    <h4>Dados que ajudam na aprovacao</h4>
                    <ul className="register-v2-sidecard-list">
                      <li>Endereco completo e sem abreviacoes confusas</li>
                      <li>E-mail valido para acesso ao painel</li>
                      <li>Horario preenchido do jeito que o cliente entende</li>
                    </ul>
                  </div>
                </aside>
              </div>
            </section>
          )}

          {currentStep === 4 && form.mode === "paid" && (
            <section className="register-v2-card">
              <div className="register-v2-section-head">
                <div>
                  <span className="register-v2-mini-kicker">Revisao final</span>
                  <h3>Feche sua apresentacao com imagem forte e contexto claro</h3>
                </div>
                <p>Antes de enviar, deixe os materiais visuais e as observacoes alinhados para a central.</p>
              </div>

              <div className="register-v2-stage-layout">
                <div className="register-v2-grid">
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
                      placeholder="Informe detalhes adicionais sobre atendimento, produtos ou operacao."
                    />
                  </label>
                </div>

                <aside className="register-v2-side-stack">
                  <div className="register-v2-summary-card">
                    <div className="register-v2-sidecard-icon"><MdSchedule /></div>
                    <h4>Resumo rapido</h4>
                    <div className="register-v2-summary-list">
                      {summaryRows.map((row) => (
                        <div key={row.label}>
                          <span>{row.label}</span>
                          <strong>{row.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="register-v2-sidecard register-v2-sidecard-accent">
                    <div className="register-v2-sidecard-icon"><MdCampaign /></div>
                    <h4>Depois da liberacao</h4>
                    <ul className="register-v2-sidecard-list">
                      <li>Cadastre produtos e organize seu catalogo</li>
                      <li>Crie campanhas para aparecer na home</li>
                      <li>Use o painel para evoluir sua presenca comercial</li>
                    </ul>
                  </div>
                </aside>
              </div>
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
