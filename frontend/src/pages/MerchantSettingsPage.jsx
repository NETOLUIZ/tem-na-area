import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import MerchantDesktopSidebar from "../components/MerchantDesktopSidebar";
import SmartImage from "../components/SmartImage";
import { useApp } from "../store/AppContext";

export default function MerchantSettingsPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { state, actions } = useApp();
  const [form, setForm] = useState({ whatsapp: "", capa: "", descricaoCurta: "", horarioFuncionamento: "" });
  const [savedMessage, setSavedMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const store = state.stores.find((item) => item.id === storeId);

  useEffect(() => {
    if (!store) return;
    setForm({
      whatsapp: store.whatsapp || "",
      capa: store.imagens.capa || "",
      descricaoCurta: store.descricaoCurta || "",
      horarioFuncionamento: store.horarioFuncionamento || ""
    });
  }, [store]);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    await actions.updateMerchantStoreProfile(storeId, {
      whatsapp: form.whatsapp.trim(),
      capa: form.capa.trim(),
      descricaoCurta: form.descricaoCurta.trim(),
      horarioFuncionamento: form.horarioFuncionamento.trim()
    });
    setLoading(false);
    setSavedMessage("Dados da vitrine atualizados.");
  }

  if (!store) {
    return (
      <main className="container page-space">
        <div className="empty-state">
          <h3>Loja nao encontrada</h3>
          <p>Nao foi possivel carregar os ajustes dessa loja.</p>
          <Link className="btn btn-primary" to="/">Voltar para Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="store-settings-page merchant-has-sidebar merchant-ui-shell">
      <MerchantDesktopSidebar
        storeId={storeId}
        storeName={store.nome}
        storeSlug={store.slug}
        status={store.status}
        onLogout={() => {
          actions.logoutMerchant();
          navigate("/login-loja");
        }}
      />

      <section className="merchant-ui-main merchant-settings-main">
        <header className="store-panel-header merchant-ui-hero">
          <div className="merchant-ui-hero-copy">
            <small>PAINEL DA LOJA / AJUSTES</small>
            <h1>Ajustes da Loja</h1>
            <p>Atualize a vitrine publica, o canal de contato e a capa exibida para o cliente.</p>
          </div>

          <div className="merchant-ui-hero-actions">
            {store.slug ? <Link to={`/loja/${store.slug}`} className="store-panel-pill">Ver loja</Link> : null}
          </div>
        </header>

        <section className="store-panel-body merchant-ui-body">
          <div className="store-panel-profile merchant-settings-card">
            <div className="store-panel-section-head merchant-ui-section-head">
              <div>
                <h3>Vitrine e contato</h3>
                <p>Esses dados aparecem para o cliente na pagina da loja.</p>
              </div>
            </div>

            <form className="store-panel-profile-form merchant-settings-form" onSubmit={submit}>
              <div className="merchant-settings-grid">
                <label>
                  <span>WhatsApp da loja</span>
                  <input
                    type="text"
                    placeholder="11999999999"
                    value={form.whatsapp}
                    onChange={(e) => {
                      setSavedMessage("");
                      setForm((prev) => ({ ...prev, whatsapp: e.target.value }));
                    }}
                    required
                  />
                </label>

                <label>
                  <span>URL da foto de capa</span>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={form.capa}
                    onChange={(e) => {
                      setSavedMessage("");
                      setForm((prev) => ({ ...prev, capa: e.target.value }));
                    }}
                  />
                </label>

                <label>
                  <span>Descricao curta</span>
                  <input
                    type="text"
                    placeholder="Resumo da loja"
                    value={form.descricaoCurta}
                    onChange={(e) => {
                      setSavedMessage("");
                      setForm((prev) => ({ ...prev, descricaoCurta: e.target.value }));
                    }}
                  />
                </label>

                <label>
                  <span>Horario de funcionamento</span>
                  <input
                    type="text"
                    placeholder="Seg-Dom 10h as 22h"
                    value={form.horarioFuncionamento}
                    onChange={(e) => {
                      setSavedMessage("");
                      setForm((prev) => ({ ...prev, horarioFuncionamento: e.target.value }));
                    }}
                  />
                </label>
              </div>

              <div className="merchant-settings-preview">
                <SmartImage src={form.capa || store.imagens.capa} alt={store.nome} />
              </div>

              {savedMessage ? <p className="success-text">{savedMessage}</p> : null}

              <button className="btn btn-primary" type="submit">
                {loading ? "Salvando..." : "Salvar ajustes"}
              </button>
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}
