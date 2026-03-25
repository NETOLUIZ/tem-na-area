import { useEffect, useMemo, useRef, useState } from "react";
import { MdArrowBack, MdArrowForward, MdLocationOn, MdSearch, MdStorefront, MdTrendingUp } from "react-icons/md";
import { Link } from "react-router-dom";
import StoreCard from "../components/StoreCard";
import heroImage from "../img/hero-temnaarea.png";
import { useApp } from "../store/AppContext";
import { formatCurrency } from "../utils/format";

const CATEGORIES = ["todas", "comida", "servico", "loja"];

export default function HomePage() {
  const { selectors, actions } = useApp();
  const cardsSectionRef = useRef(null);
  const promoTouchStartRef = useRef(null);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("todas");
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const [isMobilePromo, setIsMobilePromo] = useState(() => window.innerWidth <= 760);

  const stores = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return selectors.activeStores.filter((store) => {
      const okCategory = category === "todas" || store.categoria === category;
      const okSearch =
        !normalized ||
        store.nome.toLowerCase().includes(normalized) ||
        store.descricaoCurta.toLowerCase().includes(normalized) ||
        store.endereco.bairro.toLowerCase().includes(normalized);
      return okCategory && okSearch;
    });
  }, [selectors.activeStores, search, category]);

  const promotions = useMemo(() => selectors.activeHomePromotions(), [selectors]);
  const highlightStats = useMemo(
    () => [
      { id: "stores", icon: MdStorefront, value: selectors.activeStores.length, label: "lojas ativas" },
      { id: "promotions", icon: MdTrendingUp, value: promotions.length, label: "campanhas no ar" },
      { id: "city", icon: MdLocationOn, value: "local", label: "comercios da sua area" }
    ],
    [promotions.length, selectors.activeStores.length]
  );

  useEffect(() => {
    function syncViewport() {
      setIsMobilePromo(window.innerWidth <= 760);
    }

    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    if (promotions.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setActivePromoIndex((current) => (current + 1) % promotions.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [promotions.length]);

  useEffect(() => {
    if (!promotions.length) {
      setActivePromoIndex(0);
      return;
    }

    if (activePromoIndex >= promotions.length) {
      setActivePromoIndex(0);
    }
  }, [activePromoIndex, promotions.length]);

  useEffect(() => {
    if (window.innerWidth > 768) return undefined;

    const root = cardsSectionRef.current;
    if (!root) return undefined;

    const cards = root.querySelectorAll(".js-home-mobile-card");
    if (!cards.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -30px 0px"
      }
    );

    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [stores.length]);

  const activePromotion = promotions[activePromoIndex] || promotions[0] || null;

  function handleSearchSubmit(event) {
    event.preventDefault();
    setSearch(searchDraft);
  }

  function goToPromo(direction) {
    if (!promotions.length) return;

    setActivePromoIndex((current) => {
      const total = promotions.length;
      return (current + direction + total) % total;
    });
  }

  function handlePromoTouchStart(event) {
    promoTouchStartRef.current = event.touches[0]?.clientX ?? null;
  }

  function handlePromoTouchEnd(event) {
    const startX = promoTouchStartRef.current;
    const endX = event.changedTouches[0]?.clientX ?? null;
    promoTouchStartRef.current = null;

    if (startX === null || endX === null) return;

    const deltaX = endX - startX;
    if (Math.abs(deltaX) < 40) return;

    goToPromo(deltaX < 0 ? 1 : -1);
  }

  return (
    <div className="home-page">
      <header className="topbar sticky">
        <div className="topbar-content">
          <div className="home-topbar-brand">
            <span className="home-topbar-badge">Marketplace local</span>
            <h1>Tem na Area</h1>
          </div>
          <form className="topbar-search" onSubmit={handleSearchSubmit}>
            <input
              placeholder="Buscar loja, servico ou categoria..."
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
            />
            <button type="submit" className="btn btn-primary topbar-search-button" aria-label="Confirmar busca">
              <MdSearch aria-hidden="true" />
              <span>Buscar</span>
            </button>
          </form>
        </div>
      </header>

      <main className="container page-space">
        <section className="hero-card" style={{ "--hero-image": `url(${heroImage})` }}>
          <div className="hero-card-text">
            <span className="hero-card-kicker">Descubra, compare e compre perto de voce</span>
            <h2>O comercio local com presenca forte, simples e profissional.</h2>
            <p>Descubra negocios da sua regiao, faca pedidos com agilidade e acompanhe tudo em uma experiencia unica da Tem na Area.</p>
            <div className="hero-card-actions">
              <Link className="btn btn-primary" to="/cadastrar-loja">
                Quero minha marca na rede
              </Link>
            </div>
            <div className="hero-card-highlights" aria-label="Destaques da plataforma">
              {highlightStats.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.id} className="hero-highlight-card">
                    <div className="hero-highlight-icon">
                      <Icon aria-hidden="true" />
                    </div>
                    <div>
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="hero-card-visual" aria-hidden="true">
            <div className="hero-visual-panel">
              <span className="hero-visual-pill">Entrega, vitrine e contato direto</span>
              <strong>Mais descoberta para quem vende. Mais praticidade para quem compra.</strong>
              <p>Uma home pensada para promover negocios locais com cara de plataforma comercial de verdade.</p>
            </div>
          </div>
        </section>

        {promotions.length ? (
          <section className="home-promo-shell">
            <div className="section-title home-section-title">
              <div>
                <p>Ofertas do momento</p>
                <h3>Campanhas em destaque</h3>
              </div>
              <span>{promotions.length} ativa(s) agora</span>
            </div>

            <div
              className="home-promo-carousel"
              onTouchStart={handlePromoTouchStart}
              onTouchEnd={handlePromoTouchEnd}
            >
              {isMobilePromo ? (
                activePromotion ? (
                  <article key={activePromotion.id} className="home-promo-slide home-promo-slide-mobile">
                    <div className="home-promo-copy">
                      <span className="home-promo-badge">{activePromotion.badge}</span>
                      <h3>{activePromotion.title}</h3>
                      <p>{activePromotion.subtitle}</p>
                      <div className="home-promo-meta">
                        <strong>{activePromotion.item.nome}</strong>
                        <span>{activePromotion.store.nome}</span>
                      </div>
                      <div className="home-promo-price">
                        <strong>{formatCurrency(activePromotion.item.preco)}</strong>
                        {activePromotion.item.precoAntigo ? <small>{formatCurrency(activePromotion.item.precoAntigo)}</small> : null}
                      </div>
                      <Link
                        className="btn btn-primary"
                        to={`/loja/${activePromotion.store.slug}`}
                        onClick={() => actions.incrementMetric(activePromotion.store.id, "cliquesSite")}
                      >
                        Ver na vitrine
                      </Link>
                    </div>

                    <div className="home-promo-visual">
                      <img src={activePromotion.item.imagem} alt={activePromotion.item.nome} />
                    </div>
                  </article>
                ) : null
              ) : (
                <div className="home-promo-track" style={{ transform: `translateX(-${activePromoIndex * 100}%)` }}>
                  {promotions.map((promotion) => (
                    <article key={promotion.id} className="home-promo-slide">
                      <div className="home-promo-copy">
                        <span className="home-promo-badge">{promotion.badge}</span>
                        <h3>{promotion.title}</h3>
                        <p>{promotion.subtitle}</p>
                        <div className="home-promo-meta">
                          <strong>{promotion.item.nome}</strong>
                          <span>{promotion.store.nome}</span>
                        </div>
                        <div className="home-promo-price">
                          <strong>{formatCurrency(promotion.item.preco)}</strong>
                          {promotion.item.precoAntigo ? <small>{formatCurrency(promotion.item.precoAntigo)}</small> : null}
                        </div>
                        <Link
                          className="btn btn-primary"
                          to={`/loja/${promotion.store.slug}`}
                          onClick={() => actions.incrementMetric(promotion.store.id, "cliquesSite")}
                        >
                          Ver na vitrine
                        </Link>
                      </div>

                      <div className="home-promo-visual">
                        <img src={promotion.item.imagem} alt={promotion.item.nome} />
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {promotions.length > 1 ? (
                <div className="home-promo-nav">
                  <button type="button" className="home-promo-arrow" aria-label="Campanha anterior" onClick={() => goToPromo(-1)}>
                    <MdArrowBack aria-hidden="true" />
                  </button>
                  <button type="button" className="home-promo-arrow" aria-label="Proxima campanha" onClick={() => goToPromo(1)}>
                    <MdArrowForward aria-hidden="true" />
                  </button>
                </div>
              ) : null}

              <div className="home-promo-dots">
                {promotions.map((promotion, index) => (
                  <button
                    key={promotion.id}
                    type="button"
                    className={index === activePromoIndex ? "active" : ""}
                    aria-label={`Ir para campanha ${index + 1}`}
                    onClick={() => setActivePromoIndex(index)}
                  />
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="home-promo-shell">
            <div className="section-title home-section-title">
              <div>
                <p>Ofertas do momento</p>
                <h3>Campanhas em destaque</h3>
              </div>
              <span>0 ativa(s)</span>
            </div>
            <div className="empty-state">
              <h4>Nenhuma campanha ativa no momento</h4>
              <p>As campanhas publicadas pelas lojas parceiras aparecem aqui automaticamente.</p>
            </div>
          </section>
        )}

        <section className="chips-row home-chips-row">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`chip ${category === cat ? "active" : ""}`}
              onClick={() => setCategory(cat)}
            >
              {cat === "todas" ? "Todas" : cat}
            </button>
          ))}
        </section>

        <section>
          <div className="section-title home-section-title">
            <div>
              <p>Comercios recomendados</p>
              <h3>Vitrines em destaque</h3>
            </div>
            <span>{stores.length} resultado(s)</span>
          </div>

          {!stores.length ? (
            <div className="empty-state">
              <h4>Nenhum negocio encontrado</h4>
              <p>Ajuste a busca ou troque o filtro para encontrar mais opcoes na sua area.</p>
            </div>
          ) : (
            <div className="store-grid" ref={cardsSectionRef}>
              {stores.map((store, index) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  className="js-home-mobile-card"
                  style={{ "--card-index": index }}
                  onOpen={() => actions.incrementMetric(store.id, "cliquesSite")}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
