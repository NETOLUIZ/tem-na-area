import { useState } from "react";
import { MdArrowForward } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../store/AppContext";
import { getUserErrorMessage } from "../utils/errors";

function HubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" />
      <circle cx="12" cy="4.5" r="2.2" />
      <circle cx="19.5" cy="12" r="2.2" />
      <circle cx="12" cy="19.5" r="2.2" />
      <circle cx="4.5" cy="12" r="2.2" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17 9h-1V7a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4Z" />
    </svg>
  );
}

function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5c-6 0-10 7-10 7s4 7 10 7 10-7 10-7-4-7-10-7Zm0 11a4 4 0 1 1 4-4 4 4 0 0 1-4 4Z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 5.3 3.3 4 20 20.7 18.7 22l-3.3-3.3A11.74 11.74 0 0 1 12 19c-6 0-10-7-10-7a19.88 19.88 0 0 1 5.1-5.7ZM12 8a4 4 0 0 1 4 4 3.9 3.9 0 0 1-.4 1.8l-5.4-5.4A4 4 0 0 1 12 8Zm10 4s-1.1 1.9-3.2 3.8L17.4 14A13.61 13.61 0 0 0 20 12a13.76 13.76 0 0 0-8-5 8.35 8.35 0 0 0-2 .2L8.4 5.6A11.9 11.9 0 0 1 12 5c6 0 10 7 10 7Z" />
    </svg>
  );
}

export default function LoginStorePage() {
  const navigate = useNavigate();
  const { actions } = useApp();
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    const result = await actions.loginMerchant(telefone, senha);
    setLoading(false);
    if (!result.ok) {
      setError(getUserErrorMessage(result.message, "Nao foi possivel entrar no painel agora."));
      return;
    }

    navigate(`/admin-loja/${result.store.id}`);
  }

  return (
    <main className="login-v2-page merchant-login-page">
      <section className="login-v2-card">
        <div className="merchant-login-layout">
          <div className="merchant-login-main">
            <div className="login-v2-brand">
              <div className="login-v2-brand-icon" aria-hidden="true">
                <HubIcon />
              </div>
              <div>
                <h1>Tem na Area</h1>
                <p className="merchant-login-brand-copy">Painel de operacao para comercios locais</p>
              </div>
            </div>

            <div className="login-v2-hero" aria-hidden="true">
              <div className="login-v2-hero-copy">
                <span className="login-v2-hero-kicker">Painel do parceiro</span>
                <strong>Sua operacao local com padrao premium e resposta rapida.</strong>
                <p>Pedidos, catalogo, vitrine e gestao em um fluxo unico, direto e profissional.</p>
              </div>
              <div className="login-v2-hero-stack">
                <span>Operacao ativa</span>
                <span>Vitrine online</span>
                <span>Gestao diaria</span>
              </div>
            </div>

            <h2>Bem-vindo de volta</h2>
            <p>Acesse sua area para atualizar a vitrine, atender pedidos e acompanhar a performance da loja.</p>

            {error ? (
              <div className="login-v2-inline-alert error-text" role="alert">
                <strong>Falha no acesso</strong>
                <span>{error}</span>
              </div>
            ) : null}

            <form className="login-v2-form" onSubmit={submit}>
              <label>Telefone ou e-mail</label>
              <div className="login-v2-input-wrap">
                <span className="login-v2-input-icon" aria-hidden="true">
                  <UserIcon />
                </span>
                <input
                  placeholder="Digite seu e-mail ou telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  required
                />
              </div>

              <div className="login-v2-pass-row">
                <label>Senha</label>
                <Link to="/pdv" className="login-v2-link">Esqueci minha senha</Link>
              </div>

              <div className="login-v2-input-wrap">
                <span className="login-v2-input-icon" aria-hidden="true">
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
                <button type="button" className="login-v2-eye" onClick={() => setShowPassword((v) => !v)}>
                  <EyeIcon open={showPassword} />
                </button>
              </div>

              <button className="btn btn-primary login-v2-submit" type="submit">
                {loading ? "Entrando..." : "Entrar no painel"}
                <span className="login-v2-submit-arrow" aria-hidden="true"><MdArrowForward /></span>
              </button>
            </form>

            <div className="login-v2-divider"><span>ou continue com</span></div>

            <div className="login-v2-social">
              <button type="button" className="btn btn-outline">Google</button>
              <button type="button" className="btn btn-outline">Facebook</button>
            </div>

            <p className="login-v2-foot">
              Ainda nao faz parte da rede? <Link to="/cadastrar-loja" className="login-v2-link">Cadastrar empresa</Link>
            </p>
          </div>

          <aside className="merchant-login-aside" aria-hidden="true">
            <div className="merchant-login-aside-panel">
              <span className="merchant-login-aside-kicker">Sua rotina em um painel</span>
              <strong>Controle a vitrine, acompanhe pedidos e mantenha sua operacao com cara de produto premium.</strong>
              <p>Uma interface pensada para transmitir confianca, velocidade e organizacao desde o primeiro acesso.</p>
            </div>

            <div className="merchant-login-metrics">
              <article>
                <small>Operacao</small>
                <strong>Pedidos, catalogo e clientes</strong>
              </article>
              <article>
                <small>Experiencia</small>
                <strong>Fluxo direto para o parceiro</strong>
              </article>
              <article>
                <small>Presenca</small>
                <strong>Vitrine publica integrada</strong>
              </article>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
