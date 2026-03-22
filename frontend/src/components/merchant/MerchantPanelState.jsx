import { Link } from "react-router-dom";

export function MerchantPanelMissingState({
  title = "Loja nao encontrada",
  description = "Nao foi possivel carregar esta operacao."
}) {
  return (
    <main className="container page-space">
      <div className="empty-state">
        <h3>{title}</h3>
        <p>{description}</p>
        <Link className="btn btn-primary" to="/">Voltar para o inicio</Link>
      </div>
    </main>
  );
}
