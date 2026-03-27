import SmartImage from "./SmartImage";
import { formatCurrency } from "../utils/format";

export default function ProductCard({ item, hasCustomization, onAdd }) {
  return (
    <article className="product-card">
      <div className="product-card-media">
        <SmartImage src={item.imagem} alt={item.nome} />
      </div>

      <div className="product-info">
        <div className="product-card-kicker-row">
          <span className="product-card-kicker">{item.tipoProduto || "Produto"}</span>
          {item.precoAntigo ? <span className="product-card-offer">Oferta</span> : null}
        </div>

        <div className="product-top">
          <div className="product-top-copy">
            <h4>{item.nome}</h4>
            {item.categoria ? <small className="product-category">{item.categoria}</small> : null}
          </div>

          <div className="product-top-tags">
            {hasCustomization ? <span className="tag">Personalizavel</span> : null}
            {item.tags.length ? <span className="tag">{item.tags[0]}</span> : null}
          </div>
        </div>

        <p>{item.descricao}</p>

        <div className="product-footer">
          <div className="product-price-block">
            {item.precoAntigo ? <small>{formatCurrency(item.precoAntigo)}</small> : null}
            <strong>{formatCurrency(item.preco)}</strong>
          </div>

          <button className="btn btn-primary product-card-action" onClick={onAdd}>
            {hasCustomization ? "Personalizar" : "Adicionar"}
          </button>
        </div>
      </div>
    </article>
  );
}
