import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { MdChat, MdDeliveryDining, MdLocationOn, MdSchedule, MdStorefront } from "react-icons/md";
import { Link, useParams } from "react-router-dom";
import CartBar from "../components/CartBar";
import CartDrawer from "../components/CartDrawer";
import ProductCard from "../components/ProductCard";
import ProductCustomizationModal from "../components/ProductCustomizationModal";
import SmartImage from "../components/SmartImage";
import { useApp } from "../store/AppContext";
import { buildWhatsAppUrl } from "../utils/contacts";
import { getUserErrorMessage } from "../utils/errors";

export default function StorePage() {
  const { slug } = useParams();
  const { selectors, actions } = useApp();
  const lastTrackedStoreId = useRef(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [highlightedCartItemId, setHighlightedCartItemId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const store = selectors.storeBySlug(slug);
  const items = store ? selectors.itemsByStore(store.id) : [];
  const cart = selectors.cartDetailed();
  const whatsappUrl = buildWhatsAppUrl(store?.whatsapp);
  const loadStore = useEffectEvent((nextSlug) => actions.fetchStoreBySlug(nextSlug));
  const trackStoreVisit = useEffectEvent((storeId) => actions.incrementMetric(storeId, "visitasPagina"));
  const storeHighlights = useMemo(() => {
    if (!store) return [];

    const highlights = [
      {
        id: "category",
        icon: MdStorefront,
        label: "Categoria",
        value: store.categoria || "Loja local"
      }
    ];

    if (store.horarioFuncionamento) {
      highlights.push({
        id: "hours",
        icon: MdSchedule,
        label: "Funcionamento",
        value: store.horarioFuncionamento
      });
    }

    if (store.config.aceitaEntrega || store.config.aceitaRetirada) {
      highlights.push({
        id: "operation",
        icon: MdDeliveryDining,
        label: "Operacao",
        value: [store.config.aceitaEntrega ? "Entrega" : null, store.config.aceitaRetirada ? "Retirada" : null].filter(Boolean).join(" e ")
      });
    }

    if (store.endereco.bairro || store.endereco.cidade) {
      highlights.push({
        id: "region",
        icon: MdLocationOn,
        label: "Regiao",
        value: [store.endereco.bairro, store.endereco.cidade].filter(Boolean).join(", ")
      });
    }

    return highlights.slice(0, 4);
  }, [store]);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");
    loadStore(slug)
      .catch((err) => {
        if (active) setError(getUserErrorMessage(err, "Nao foi possivel carregar a vitrine agora."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!store || store.status !== "ATIVA") return;
    if (lastTrackedStoreId.current === store.id) return;

    lastTrackedStoreId.current = store.id;
    trackStoreVisit(store.id);
  }, [store]);

  useEffect(() => {
    if (cart.storeId !== store?.id) {
      setIsCartOpen(false);
      setHighlightedCartItemId(null);
    }
  }, [cart.storeId, store?.id]);

  if (loading) {
    return (
      <div className="container page-space">
        <div className="empty-state">
          <h3>Carregando vitrine</h3>
          <p>Buscando dados atualizados do catalogo no servidor.</p>
        </div>
      </div>
    );
  }

  if (error || !store || store.status !== "ATIVA") {
    return (
      <div className="container page-space">
        <div className="empty-state">
          <h3>Vitrine indisponivel</h3>
          <p>{error || "Esta operacao esta temporariamente inacessivel na Tem na Area."}</p>
          <Link className="btn btn-primary" to="/">Voltar para o inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="store-page-v2">
      <header className="store-hero" style={{ backgroundImage: `url(${store.imagens.capa})` }}>
        <div className="overlay" />
        <div className="store-hero-content container">
          <div className="store-hero-main">
            <SmartImage src={store.imagens.logo} alt={store.nome} className="hero-logo" />
            <div className="store-hero-copy">
              <span className="store-hero-kicker">Vitrine oficial</span>
              <h1>{store.nome}</h1>
              <p>{store.descricaoCurta}</p>
              {store.horarioFuncionamento ? <small>{store.horarioFuncionamento}</small> : null}
            </div>
          </div>

          <div className="store-hero-side">
            <button
              className="btn btn-outline-light"
              disabled={!whatsappUrl}
              onClick={() => {
                if (!whatsappUrl) return;
                actions.incrementMetric(store.id, "cliquesWhatsapp");
                window.open(whatsappUrl, "_blank", "noopener,noreferrer");
              }}
            >
              <MdChat aria-hidden="true" />
              Atendimento no WhatsApp
            </button>
          </div>
        </div>
      </header>

      <main className="container page-space">
        <section className="store-hero-highlights" aria-label="Informacoes da loja">
          {storeHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.id} className="store-highlight-card">
                <div className="store-highlight-icon">
                  <Icon aria-hidden="true" />
                </div>
                <div>
                  <small>{item.label}</small>
                  <strong>{item.value}</strong>
                </div>
              </article>
            );
          })}
        </section>

        <div className="section-title store-catalog-title">
          <div>
            <p>Cardapio e produtos</p>
            <h3>Catalogo da loja</h3>
          </div>
          <span>{items.length} item(ns)</span>
        </div>

        {!items.length ? (
          <div className="empty-state">
            <h4>Catalogo em atualizacao</h4>
            <p>Esta loja ainda nao publicou produtos na vitrine.</p>
          </div>
        ) : (
          <div className="menu-grid store-menu-grid">
            {items.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                hasCustomization={selectors.optionGroupsByProduct(item.id).length > 0}
                onAdd={() => {
                  if (selectors.optionGroupsByProduct(item.id).length > 0) {
                    setSelectedItem(item);
                    return;
                  }

                  const result = actions.addToCart(store.id, item.id, {});
                  if (result.ok) {
                    setHighlightedCartItemId(result.cartItemId);
                    setIsCartOpen(true);
                  }
                }}
              />
            ))}
          </div>
        )}
      </main>

      <ProductCustomizationModal
        item={selectedItem}
        groups={selectedItem ? selectors.optionGroupsByProduct(selectedItem.id) : []}
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        onSubmit={(configuration) => {
          if (!selectedItem || !store) return { ok: false };
          const result = actions.addToCart(store.id, selectedItem.id, configuration);
          if (result.ok) {
            setHighlightedCartItemId(result.cartItemId);
            setIsCartOpen(true);
          }
          return result;
        }}
      />

      {cart.storeId === store.id ? (
        <>
          <CartBar
            count={cart.items.length}
            total={cart.total}
            onOpen={() => {
              setHighlightedCartItemId(null);
              setIsCartOpen(true);
            }}
          />
          <CartDrawer
            cart={{ ...cart, highlightedCartItemId }}
            open={isCartOpen}
            onClose={() => {
              setIsCartOpen(false);
              setHighlightedCartItemId(null);
            }}
            onDecrease={(itemId, quantity) => actions.setCartQuantity(itemId, quantity)}
            onIncrease={(itemId, quantity) => actions.setCartQuantity(itemId, quantity)}
          />
        </>
      ) : null}
    </div>
  );
}
