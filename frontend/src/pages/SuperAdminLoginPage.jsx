import { useState } from "react";
import { MdArrowForward } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store/AppContext";

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

export default function SuperAdminLoginPage() {
  const navigate = useNavigate();
  const { actions } = useApp();
  const [user, setUser] = useState("admin@temnaarea.com");
  const [pass, setPass] = useState("admin123");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const ok = await actions.loginSuperAdmin(user, pass);
    setLoading(false);

    if (!ok) {
      setError("Credenciais inválidas.");
      return;
    }

    navigate("/admin-temnaarea");
  }

  return (
    <main className="login-v2-page super-admin-login-page">
      <section className="login-v2-card super-admin-login-card">
        <div className="login-v2-brand">
          <div className="login-v2-brand-icon" aria-hidden="true">
            <HubIcon />
          </div>
          <div className="super-admin-brand-copy">
            <h1>Tem na Área</h1>
            <small>Central administrativa</small>
          </div>
        </div>

        <div className="login-v2-hero super-admin-login-hero">
          <span>Central estratégica</span>
          <strong>Controle total da rede, da marca e da operação.</strong>
        </div>

        <h2>Acesso administrativo</h2>
        <p>Gerencie aprovações, pagamentos, bloqueios e visibilidade da plataforma em um painel unificado.</p>

        <div className="super-admin-login-grid">
          <div className="super-admin-login-hint">
            <strong>Acesso padrão</strong>
            <span>Login: admin@temnaarea.com</span>
            <span>Senha: admin123</span>
          </div>

          <div className="super-admin-login-hint super-admin-login-hint-alt">
            <strong>Escopo</strong>
            <span>Aprovar entradas e pagamentos</span>
            <span>Monitorar a saúde operacional da rede</span>
          </div>
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        <form className="login-v2-form" onSubmit={submit}>
          <label>Usuário</label>
          <div className="login-v2-input-wrap">
            <span className="login-v2-input-icon" aria-hidden="true">
              <UserIcon />
            </span>
            <input
              type="email"
              placeholder="admin@temnaarea.com"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              required
            />
          </div>

          <label>Senha</label>
          <div className="login-v2-input-wrap">
            <span className="login-v2-input-icon" aria-hidden="true">
              <LockIcon />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Digite sua senha"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              required
            />
            <button type="button" className="login-v2-eye" onClick={() => setShowPassword((v) => !v)}>
              <EyeIcon open={showPassword} />
            </button>
          </div>

          <button className="btn btn-primary login-v2-submit" type="submit">
            {loading ? "Entrando..." : "Entrar na central"}
            <span className="login-v2-submit-arrow" aria-hidden="true"><MdArrowForward /></span>
          </button>
        </form>
      </section>
    </main>
  );
}
