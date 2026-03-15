import { Link, NavLink } from "react-router-dom";
import { MdCircle, MdNotificationsNone, MdSearch } from "react-icons/md";

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
  const primaryLinks = [
    { label: "Dashboard", to: links[0].to },
    { label: "Lojas", to: links[1].to || links[0].to },
    { label: "Logs", to: links[2].to || links[0].to },
    { label: "Campanhas", to: null },
    { label: "Financeiro", to: null },
    { label: "Ajustes", to: null }
  ];

  return (
    <div className="prompt-admin-shell">
      <aside className="prompt-sidebar">
        <div className="prompt-sidebar-brand">
          <div className="prompt-brand-mark" aria-hidden="true">T</div>
          <div>
            <h2>Tem na Area</h2>
            <p>{subtitle}</p>
          </div>
        </div>

        <nav className="prompt-sidebar-nav">
          {primaryLinks.map((item) => (
            <SidebarItem key={item.label} to={item.to} label={item.label} />
          ))}
        </nav>

        <div className="prompt-sidebar-projects">
          <p>AREAS</p>
          <span>Operacao</span>
          <span>Compliance</span>
          <span>Expansao</span>
        </div>

        <div className="prompt-sidebar-footer">
          <Link className="prompt-ghost-button" to="/">HOME</Link>
          {onLogout ? <button className="prompt-ghost-button" onClick={onLogout}>LOGOUT</button> : null}
        </div>
      </aside>

      <main className="prompt-admin-main">
        <header className="prompt-topbar">
          <div>
            <p className="prompt-breadcrumb">PAINEL GLOBAL / TEM NA ÁREA</p>
            <h1>{title}</h1>
          </div>

          <div className="prompt-topbar-right">
            <label className="prompt-search">
              <MdSearch />
              <input type="text" placeholder="Buscar no painel" readOnly />
            </label>
            <button type="button" className="prompt-icon-button" aria-label="Notificações">
              <MdNotificationsNone />
            </button>
            <div className="prompt-avatar" aria-hidden="true">A</div>
          </div>
        </header>

        <section className="prompt-stage">{children}</section>
      </main>
    </div>
  );
}
