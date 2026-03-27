import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  StarIcon,
  MapPinIcon,
  FireIcon,
  SparklesIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import SmartImage from "../components/SmartImage";
import StoreCard from "../components/StoreCard";
import Navigation, { BottomNav } from "../components/Navigation";
import Button from "../components/Button";
import { useApp } from "../store/AppContext";

const CATEGORIES = ["todas", "comida", "servico", "loja"];
const CATEGORY_FEATURES = [
  { id: "restaurantes", label: "Restaurantes", icon: FireIcon, filter: "comida" },
  { id: "farmacias", label: "Farmácias", icon: SparklesIcon, filter: "servico" },
  { id: "vestuario", label: "Vestuário", icon: ShoppingBagIcon, filter: "loja" },
  { id: "pet", label: "Pet Shop", icon: UserGroupIcon, filter: "servico" },
  { id: "servicos", label: "Serviços", icon: CheckIcon, filter: "servico" },
  { id: "mercados", label: "Mercados", icon: ShoppingBagIcon, filter: "loja" },
];
const HOW_IT_WORKS = [
  {
    id: "search",
    title: "Busque",
    description: "Filtre por categoria, distancia ou recomendacao da nossa curadoria."
  },
  {
    id: "explore",
    title: "Explore",
    description: "Veja fotos, campanhas e avaliacoes reais de outros vizinhos."
  },
  {
    id: "connect",
    title: "Conecte-se",
    description: "Fale diretamente com o lojista pelo WhatsApp ou visite a loja fisica."
  }
];
const HERO_SLIDES = [
  {
    id: "discover",
    eyebrow: "Marketplace local",
    title: "Descubra o que tem de melhor no seu bairro.",
    description: "Uma vitrine mais limpa, moderna e organizada para encontrar empresas, servicos e campanhas com rapidez.",
    primary: "Explorar agora",
    secondary: "Ver categorias"
  },
  {
    id: "offers",
    eyebrow: "Ofertas em destaque",
    title: "Promocoes, vitrines e empresas em um unico lugar.",
    description: "Navegue por destaques da cidade com uma interface clara, responsiva e pensada primeiro para o celular.",
    primary: "Ver destaques",
    secondary: "Como funciona"
  },
  {
    id: "business",
    eyebrow: "Para empresas",
    title: "Sua empresa pronta para aparecer com mais qualidade visual.",
    description: "Apresente sua marca, fale com clientes e organize sua presenca local sem alterar o fluxo atual do sistema.",
    primary: "Cadastrar empresa",
    secondary: "Entrar como empresa"
  }
];

export default function HomePage() {
  const { selectors, actions } = useApp();
  const cardsSectionRef = useRef(null);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("todas");
  const [activeSlide, setActiveSlide] = useState(0);

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
      { id: "stores", icon: StarIcon, value: selectors.activeStores.length, label: "lojas ativas" },
      { id: "promotions", icon: FireIcon, value: promotions.length, label: "campanhas no ar" },
      { id: "city", icon: MapPinIcon, value: "local", label: "comercios da sua area" }
    ],
    [promotions.length, selectors.activeStores.length]
  );

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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % HERO_SLIDES.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  const featuredStores = stores.slice(0, 4);
  const heroVisualItems = promotions.length
    ? promotions.slice(0, HERO_SLIDES.length).map((promotion) => ({
        id: promotion.id,
        title: promotion.title,
        subtitle: promotion.subtitle,
        image: promotion.item.imagem
      }))
    : featuredStores.slice(0, HERO_SLIDES.length).map((store) => ({
        id: store.id,
        title: store.nome,
        subtitle: store.descricaoCurta,
        image: store.imagens.capa
      }));
  const categoryCards = CATEGORY_FEATURES.map((item) => ({
    ...item,
    count:
      item.filter === "todas"
        ? selectors.activeStores.length
        : selectors.activeStores.filter((store) => store.categoria === item.filter).length
  }));

  function handleSearchSubmit(event) {
    event.preventDefault();
    setSearch(searchDraft);
  }

  function handleHeroSecondary(slide) {
    if (slide.id === "discover") {
      document.getElementById("categorias")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (slide.id === "offers") {
      document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    window.location.href = "/pdv";
  }

  const currentSlide = HERO_SLIDES[activeSlide];
  const currentVisual = heroVisualItems[activeSlide] || heroVisualItems[0] || null;

  return (
    <>
      <Navigation userRole="customer" cartCount={0} />

      <div className="home-shell">
        <main className="home-main">
          {/* Hero Section */}
          <section className="home-hero" id="explorar">
            <div className="home-hero-carousel">
              <div className="home-hero-copy">
                <span className="home-hero-kicker">{currentSlide.eyebrow}</span>
                <h1>{currentSlide.title}</h1>
                <p>{currentSlide.description}</p>

                <form className="home-hero-search" onSubmit={handleSearchSubmit}>
                  <div className="home-hero-search-input">
                    <MagnifyingGlassIcon width={20} height={20} />
                    <input
                      placeholder="Buscar loja, servico ou categoria..."
                      value={searchDraft}
                      onChange={(e) => setSearchDraft(e.target.value)}
                    />
                  </div>
                  <Button variant="primary">{currentSlide.primary}</Button>
                  <Button variant="secondary" onClick={() => handleHeroSecondary(currentSlide)}>
                    {currentSlide.secondary}
                  </Button>
                </form>

                <div className="home-hero-highlights" aria-label="Resumo da plataforma">
                  {highlightStats.map((item) => {
                    const Icon = item.icon;
                    return (
                      <article key={item.id} className="home-hero-stat">
                        <div className="home-hero-stat-icon">
                          <Icon width={24} height={24} />
                        </div>
                        <div>
                          <strong>{item.value}</strong>
                          <span>{item.label}</span>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="home-hero-controls">
                  <button
                    type="button"
                    className="home-hero-arrow"
                    onClick={() => setActiveSlide((current) => (current - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
                    aria-label="Slide anterior"
                  >
                    <ChevronLeftIcon width={24} height={24} />
                  </button>
                  <div className="home-hero-dots" aria-label="Navegacao do carrossel">
                    {HERO_SLIDES.map((slide, index) => (
                      <button
                        key={slide.id}
                        type="button"
                        className={`home-hero-dot ${index === activeSlide ? "is-active" : ""}`}
                        onClick={() => setActiveSlide(index)}
                        aria-label={`Ir para slide ${index + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="home-hero-arrow"
                    onClick={() => setActiveSlide((current) => (current + 1) % HERO_SLIDES.length)}
                    aria-label="Proximo slide"
                  >
                    <ChevronRightIcon width={24} height={24} />
                  </button>
                </div>
              </div>

              <div className="home-hero-visual" aria-hidden="true">
                <div className="home-hero-visual-card">
                  <div className="home-hero-visual-glow" />
                  {currentVisual?.image ? (
                    <SmartImage src={currentVisual.image} alt="" className="home-hero-visual-image" />
                  ) : (
                    <div className="home-hero-visual-orb" />
                  )}

                  <div className="home-hero-floating-panel">
                    <small>Destaque atual</small>
                    <strong>{currentVisual?.title || "Explore empresas em destaque"}</strong>
                    <span>{currentVisual?.subtitle || "Veja ofertas, vitrines e categorias com um visual mais limpo."}</span>
                  </div>
                </div>
                <div className="home-hero-visual-mini-grid">
                  <article>
                    <strong>{featuredStores.length}</strong>
                  <span>Featured stores</span>
                    <span>Featured stores</span>
                  </article>
                  <article>
                    <strong>{promotions.length}</strong>
                    <span>Live promotions</span>
                  </article>
                </div>
              </div>
            </div>
          </section>

          {/* Destaques */}
          <section className="home-editorial" id="destaques">
            <div className="home-section-head">
              <div>
                <span>Curadoria</span>
                <h2>Anuncios em Destaque</h2>
              </div>
              <button type="button" className="home-link-button" onClick={() => document.getElementById("empresas")?.scrollIntoView({ behavior: "smooth" })}>
                Ver todos
              </button>
            </div>

            <div className="home-editorial-grid">
              {promotions.length ? promotions.slice(0, 2).map((promotion, index) => (
                <article key={promotion.id} className={`home-editorial-card tone-${index + 1}`}>
                  <img src={promotion.item.imagem} alt={promotion.item.nome} />
                  <div className="home-editorial-overlay" />
                  <div className="home-editorial-content">
                    <span>{promotion.badge}</span>
                    <strong>{promotion.title}</strong>
                    <p>{promotion.subtitle}</p>
                  </div>
                </article>
              )) : (
                <div className="empty-state">
                  <h4>Nenhuma campanha ativa no momento</h4>
                  <p>As campanhas publicadas pelas lojas parceiras aparecem aqui automaticamente.</p>
                </div>
              )}
            </div>
          </section>

          {/* Categorias */}
          <section className="home-categories-section" id="categorias">
            <div className="home-section-head home-section-head-center">
              <h2>Navegue por Categorias</h2>
              <p>Escolha uma categoria e encontre opcoes com mais rapidez.</p>
            </div>

            <div className="home-categories-grid">
              {categoryCards.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="home-category-card"
                    onClick={() => setCategory(item.filter)}
                  >
                    <span className="home-category-icon">
                      <Icon width={32} height={32} strokeWidth={1.5} aria-hidden="true" />
                    </span>
                    <strong>{item.label}</strong>
                    <small>{item.count} opcao(oes)</small>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Empresas */}
          <section className="home-businesses" id="empresas">
            <div className="home-section-head">
              <div>
                <h2>Empresas perto de voce</h2>
                <p>Os melhores estabelecimentos do bairro selecionados para voce.</p>
              </div>
            </div>

            {!stores.length ? (
              <div className="empty-state">
                <h4>Nenhum negocio encontrado</h4>
                <p>Ajuste a busca ou troque o filtro para encontrar mais opcoes na sua area.</p>
              </div>
            ) : (
              <div className="store-grid home-business-grid" ref={cardsSectionRef}>
                {stores.slice(0, 12).map((store, index) => (
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

          {/* Como Funciona */}
          <section className="home-how-it-works" id="como-funciona">
            <div className="home-section-head home-section-head-center">
              <h2>Como Funciona</h2>
              <p>Encontrar o que voce precisa no seu bairro nunca foi tao sofisticado e simples.</p>
            </div>

            <div className="home-how-grid">
              {HOW_IT_WORKS.map((item) => (
                <article key={item.id} className="home-how-card">
                  <div className="home-how-icon">
                    {item.id === "search" ? (
                      <MagnifyingGlassIcon width={32} height={32} strokeWidth={1.5} />
                    ) : item.id === "explore" ? (
                      <StarIcon width={32} height={32} strokeWidth={1.5} />
                    ) : (
                      <MapPinIcon width={32} height={32} strokeWidth={1.5} />
                    )}
                  </div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </section>

          {/* CTA Banner */}
          <section className="home-cta-banner">
            <div className="home-cta-copy">
              <h2>Sua empresa merece destaque no bairro.</h2>
              <p>Entre para a rede com uma vitrine mais organizada, moderna e pronta para receber clientes.</p>
              <div className="home-cta-actions">
                <Link className="btn btn-secondary" to="/cadastrar-loja">
                  Cadastrar Gratis
                </Link>
                <Link className="btn btn-outline home-cta-outline" to="/pdv">
                  Conhecer Planos
                </Link>
              </div>
            </div>
            <div className="home-cta-visual" aria-hidden="true">
              <div className="home-cta-visual-card">
                <span>Tem na Area</span>
                <strong>Presenca local com imagem mais profissional, catalogo mais claro e contato direto.</strong>
                <div>
                  <small>Cadastro guiado</small>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="home-footer">
          <div className="home-footer-grid">
            <div className="home-footer-brand">
              <strong>Tem na Area</strong>
              <p>Redescubra o prazer de comprar perto de casa. O marketplace definitivo para o comercio de bairro.</p>
            </div>

            <div>
              <span>Marketplace</span>
              <a href="#explorar">Explorar</a>
              <a href="#categorias">Categorias</a>
              <a href="#destaques">Destaques</a>
            </div>

            <div>
              <span>Lojistas</span>
              <Link to="/cadastrar-loja">Cadastrar Empresa</Link>
              <Link to="/pdv">Painel do Parceiro</Link>
            </div>

            <div>
              <span>Institucional</span>
              <a href="#como-funciona">Como Funciona</a>
              <Link to="/admin-temnaarea/login">Central Admin</Link>
            </div>
          </div>
        </footer>
      </div>

      <BottomNav userRole="customer" activeRoute="/" />
    </>
  );
}
