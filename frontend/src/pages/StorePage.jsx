import { useEffect, useRef, useState } from "react";
import { MdChat } from "react-icons/md";
import { Link, useParams } from "react-router-dom";
import CartBar from "../components/CartBar";
import CartDrawer from "../components/CartDrawer";
import ProductCard from "../components/ProductCard";
import ProductCustomizationModal from "../components/ProductCustomizationModal";
import SmartImage from "../components/SmartImage";
import { useApp } from "../store/AppContext";
import { buildWhatsAppUrl } from "../utils/contacts";

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

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");
    actions.fetchStoreBySlug(slug)
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [actions, slug]);

  useEffect(() => {
    if (!store || store.status !== "ATIVA") return;
    if (lastTrackedStoreId.current === store.id) return;

    lastTrackedStoreId.current = store.id;
    actions.incrementMetric(store.id, "visitasPagina");
  }, [actions, store]);

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
          <p>Buscando dados atualizados do catálogo no servidor.</p>
        </div>
      </div>
    );
  }

  if (error || !store || store.status !== "ATIVA") {
    return (
      <div className="container page-space">
        <div className="empty-state">
          <h3>Vitrine indisponível</h3>
          <p>{error || "Esta operação está temporariamente inacessível na Tem na Área."}</p>
          <Link className="btn btn-primary" to="/">Voltar para o início</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="store-hero" style={{ backgroundImage: `url(${store.imagens.capa})` }}>
        <div className="overlay" />
        <div className="store-hero-content container">
          <SmartImage src={store.imagens.logo} alt={store.nome} className="hero-logo" />
          <div>
            <h1>{store.nome}</h1>
            <p>{store.descricaoCurta}</p>
            <small>{store.horarioFuncionamento}</small>
          </div>
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
      </header>

      <main className="container page-space">
        <div className="section-title">
          <h3>Catálogo da loja</h3>
          <span>{items.length} item(ns)</span>
        </div>

        {!items.length ? (
          <div className="empty-state">
            <h4>Catálogo em atualização</h4>
            <p>Esta loja ainda não publicou produtos na vitrine.</p>
          </div>
        ) : (
          <div className="menu-grid">
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
