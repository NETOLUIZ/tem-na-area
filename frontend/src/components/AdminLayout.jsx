import { Link, NavLink } from "react-router-dom";
import { MdCircle } from "react-icons/md";

function SidebarItem({ to, label }) {
  if (!to) {
    return (
      <span className="prompt-sidebar-link prompt-sidebar-link-muted">
        <MdCircle />
        {label}
      </span>
    );
  }

  return (
    <NavLink to={to} className={({ isActive }) => `prompt-sidebar-link${isActive ? " active" : ""}`}>
      <MdCircle />
      {label}
    </NavLink>
  );
}

export default function AdminLayout({ title, subtitle, links, onLogout, children }) {
  const getLink = (label, fallback = null) => links.find((item) => item.label === label)?.to || fallback;
  const primaryLinks = [
    { label: "Dashboard", to: getLink("Dashboard", links[0]?.to || "/admin-temnaarea") },
    { label: "Lojas", to: getLink("Lojas", getLink("Dashboard", "/admin-temnaarea")) },
    { label: "Logs", to: getLink("Logs", getLink("Dashboard", "/admin-temnaarea")) }
  ];

  return (
    <div className="prompt-admin-shell super-admin-shell">
      <aside className="prompt-sidebar">
        <div className="prompt-sidebar-brand">
          <div className="prompt-brand-mark" aria-hidden="true">T</div>
          <div>
            <h2>Tem na Área</h2>
            <p>{subtitle}</p>
          </div>
        </div>

        <nav className="prompt-sidebar-nav">
          {primaryLinks.map((item) => (
            <SidebarItem key={item.label} to={item.to} label={item.label} />
          ))}
        </nav>

        <div className="prompt-sidebar-footer">
          <Link className="prompt-ghost-button" to="/">Início</Link>
          {onLogout ? <button className="prompt-ghost-button" onClick={onLogout}>Sair</button> : null}
        </div>
      </aside>

      <main className="prompt-admin-main super-admin-main">
        <header className="prompt-topbar super-admin-topbar">
          <div>
            <p className="prompt-breadcrumb">CENTRAL TEM NA ÁREA / VISÃO GERAL</p>
            <h1>{title}</h1>
          </div>
        </header>

        <section className="prompt-stage super-admin-stage">{children}</section>
      </main>
    </div>
  );
}
