import MerchantDesktopSidebar from "../MerchantDesktopSidebar";

export default function MerchantPanelShell({
  storeId,
  store,
  onLogout,
  eyebrow,
  title,
  description,
  heroActions = null,
  heroAside = null,
  className = "",
  bodyClassName = "",
  children
}) {
  return (
    <main className={`merchant-panel-shell merchant-has-sidebar ${className}`.trim()}>
      <MerchantDesktopSidebar
        storeId={storeId}
        storeName={store.nome}
        storeSlug={store.slug}
        status={store.status}
        onLogout={onLogout}
      />

      <section className={`merchant-panel-main ${bodyClassName}`.trim()}>
        <header className="merchant-panel-hero">
          <div className="merchant-panel-hero-copy">
            {eyebrow ? <p className="merchant-panel-eyebrow">{eyebrow}</p> : null}
            <h1>{title}</h1>
            {description ? <p className="merchant-panel-description">{description}</p> : null}
          </div>

          {heroActions || heroAside ? (
            <div className="merchant-panel-hero-side">
              {heroAside}
              {heroActions}
            </div>
          ) : null}
        </header>

        <section className="merchant-panel-content">
          {children}
        </section>
      </section>
    </main>
  );
}
