import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import StoreCard from "../components/StoreCard";
import heroImage from "../img/hero-temnaarea.png";
import { useApp } from "../store/AppContext";
import { formatCurrency } from "../utils/format";

const CATEGORIES = ["todas", "comida", "serviço", "loja"];

export default function HomePage() {
  const { selectors, actions } = useApp();
  const cardsSectionRef = useRef(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("todas");
  const [activePromoIndex, setActivePromoIndex] = useState(0);

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

  return (
    <div>
      <header className="topbar sticky">
        <div className="topbar-content">
          <h1>Tem na Área</h1>
          <input
            placeholder="Buscar loja, serviço ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <main className="container page-space">
        <section className="hero-card" style={{ "--hero-image": `url(${heroImage})` }}>
          <div className="hero-card-text">
            <h2>O comércio local com presença forte, simples e profissional.</h2>
            <p>Descubra negócios da sua região, faça pedidos com agilidade e acompanhe tudo em uma experiência única da Tem na Área.</p>
            <div style={{ marginTop: "1rem" }}>
              <Link className="btn btn-primary" to="/cadastrar-loja">
                Quero minha marca na rede
              </Link>
            </div>
          </div>
        </section>

        {promotions.length ? (
          <section className="home-promo-shell">
            <div className="section-title">
              <h3>Campanhas em destaque</h3>
              <span>{promotions.length} ativa(s) agora</span>
            </div>

            <div className="home-promo-carousel">
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
            <div className="section-title">
              <h3>Campanhas em destaque</h3>
              <span>0 ativa(s)</span>
            </div>
            <div className="empty-state">
              <h4>Nenhuma campanha ativa no momento</h4>
              <p>As campanhas publicadas pelas lojas parceiras aparecem aqui automaticamente.</p>
            </div>
          </section>
        )}

        <section className="chips-row">
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
          <div className="section-title">
            <h3>Vitrines em destaque</h3>
            <span>{stores.length} resultado(s)</span>
          </div>

          {!stores.length ? (
            <div className="empty-state">
              <h4>Nenhum negócio encontrado</h4>
              <p>Ajuste a busca ou troque o filtro para encontrar mais opções na sua área.</p>
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
