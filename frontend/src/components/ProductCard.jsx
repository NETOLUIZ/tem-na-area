import SmartImage from "./SmartImage";
import { formatCurrency } from "../utils/format";

export default function ProductCard({ item, hasCustomization, onAdd }) {
  return (
    <article className="product-card">
      <SmartImage src={item.imagem} alt={item.nome} />
      <div className="product-info">
        <div className="product-top">
          <h4>{item.nome}</h4>
          <div className="product-top-tags">
            {hasCustomization ? <span className="tag">Personalizável</span> : null}
            {item.tags.length ? <span className="tag">{item.tags[0]}</span> : null}
          </div>
        </div>
        <p>{item.descricao}</p>
        <div className="product-footer">
          <div>
            {item.precoAntigo ? <small>{formatCurrency(item.precoAntigo)}</small> : null}
            <strong>{formatCurrency(item.preco)}</strong>
          </div>
          <button className="btn btn-primary" onClick={onAdd}>
            {hasCustomization ? "Personalizar" : "Adicionar"}
          </button>
        </div>
      </div>
    </article>
  );
}
