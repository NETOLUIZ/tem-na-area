import { MdOutlineStorefront, MdStar, MdStarBorder } from "react-icons/md";
import { Link } from "react-router-dom";
import SmartImage from "./SmartImage";
import { useApp } from "../store/AppContext";
import { buildWhatsAppUrl } from "../utils/contacts";

export default function StoreCard({ store, onOpen, className = "", style }) {
  const { actions } = useApp();
  const averageRating = store.rating.average || 0;
  const ratingCount = store.rating.count || 0;
  const isWhatsappOnly = store.cardMode === "WHATSAPP_ONLY";
  const whatsappUrl = buildWhatsAppUrl(store.whatsapp);

  function handleOpenWhatsapp() {
    if (!whatsappUrl) return;
    actions.incrementMetric(store.id, "cliquesWhatsapp");
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <article className={`store-card ${className}`.trim()} style={style}>
      <SmartImage src={store.imagens.capa} alt={store.nome} className="store-cover" />
      <div className="store-body">
        <div className="store-head">
          <SmartImage src={store.imagens.logo} alt={store.nome} className="store-logo" />
          <div>
            <h3>{store.nome}</h3>
            <p>{store.categoria}</p>
          </div>
        </div>

        <p className="store-description">{store.descricaoCurta}</p>

        <div className="store-rating">
          <div className="store-rating-stars" aria-label={`Avaliação média de ${averageRating.toFixed(1)} estrelas`}>
            {[1, 2, 3, 4, 5].map((star) => {
              const filled = star <= Math.round(averageRating);
              const Icon = filled ? MdStar : MdStarBorder;

              return (
                <button
                  key={star}
                  type="button"
                  className={`rating-star ${filled ? "filled" : ""}`}
                  aria-label={`Avaliar ${store.nome} com ${star} estrela${star > 1 ? "s" : ""}`}
                  onClick={() => actions.rateStore(store.id, star)}
                >
                  <Icon />
                </button>
              );
            })}
          </div>

          <span className="store-rating-text">
            {ratingCount ? `${averageRating.toFixed(1)} (${ratingCount} avaliações)` : "Seja a primeira pessoa a avaliar"}
          </span>
        </div>

        <div className="store-meta">
          <span>{store.endereco.bairro}, {store.endereco.cidade}</span>
          <span>{isWhatsappOnly ? "Contato direto" : `${store.metrics.visitasPagina} visitas`}</span>
        </div>

        {isWhatsappOnly ? (
          <button type="button" className="btn btn-primary" onClick={handleOpenWhatsapp} disabled={!whatsappUrl}>
            Chamar no WhatsApp
          </button>
        ) : (
          <Link to={`/loja/${store.slug}`} className="btn btn-primary" onClick={onOpen}>
            <MdOutlineStorefront aria-hidden="true" />
            Abrir vitrine
          </Link>
        )}
      </div>
    </article>
  );
}
