import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import MerchantPanelShell from "../components/merchant/MerchantPanelShell";
import { MerchantPanelMissingState } from "../components/merchant/MerchantPanelState";
import SmartImage from "../components/SmartImage";
import { useApp } from "../store/AppContext";

function createForm(store) {
  return {
    nome: store?.nome || "",
    categoria: store?.categoria || "",
    status: store?.status || "ATIVA",
    telefone: store?.telefone || "",
    whatsapp: store?.whatsapp || "",
    email: store?.email || "",
    descricaoCurta: store?.descricaoCurta || "",
    descricaoCompleta: store?.descricaoCompleta || "",
    horarioFuncionamento: store?.horarioFuncionamento || "",
    logo: store?.imagens?.logo || "",
    capa: store?.imagens?.capa || "",
    cep: store?.endereco?.cep || "",
    logradouro: store?.endereco?.logradouro || "",
    numero: store?.endereco?.numero || "",
    complemento: store?.endereco?.complemento || "",
    bairro: store?.endereco?.bairro || "",
    cidade: store?.endereco?.cidade || "",
    estado: store?.endereco?.estado || "",
    website: store?.links?.website || "",
    instagram: store?.links?.instagram || "",
    facebook: store?.links?.facebook || "",
    aceitaPedidos: Boolean(store?.aceitaPedidos ?? true),
    taxaEntregaPadrao: String(store?.config?.taxaEntregaPadrao ?? 0),
    pedidoMinimo: String(store?.config?.pedidoMinimo ?? 0),
    tempoMedioPreparoMinutos: String(store?.config?.tempoMedioPreparoMinutos ?? 0),
    tempoMedioEntregaMinutos: String(store?.config?.tempoMedioEntregaMinutos ?? 0),
    aceitaRetirada: Boolean(store?.config?.aceitaRetirada ?? true),
    aceitaEntrega: Boolean(store?.config?.aceitaEntrega ?? true),
    exibirProdutosEsgotados: Boolean(store?.config?.exibirProdutosEsgotados ?? false),
    exibirWhatsapp: Boolean(store?.config?.exibirWhatsapp ?? true),
    bairrosAtendidos: (store?.config?.bairrosAtendidos || []).join("\n"),
    formasPagamentoAceitas: (store?.config?.formasPagamentoAceitas || []).join("\n"),
    painelCompacto: Boolean(store?.config?.painelCompacto ?? false),
    alertaSonoroPedidos: Boolean(store?.config?.alertaSonoroPedidos ?? true),
    exibirDashboardFinanceiro: Boolean(store?.config?.exibirDashboardFinanceiro ?? true),
    mensagemBoasVindas: store?.config?.mensagemBoasVindas || "",
    politicaTroca: store?.config?.politicaTroca || "",
    politicaEntrega: store?.config?.politicaEntrega || "",
    seoTitle: store?.config?.seoTitle || "",
    seoDescription: store?.config?.seoDescription || ""
  };
}

export default function MerchantSettingsPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { state, actions } = useApp();
  const [form, setForm] = useState(createForm(null));
  const [savedMessage, setSavedMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const store = state.stores.find((item) => item.id === storeId);

  useEffect(() => {
    if (!store) return;
    setForm(createForm(store));
  }, [store]);

  function updateField(field, value) {
    setSavedMessage("");
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);

    await actions.updateMerchantStoreProfile(storeId, {
      ...form,
      bairrosAtendidos: form.bairrosAtendidos
        .split(/\r?\n/)
        .map((entry) => entry.trim())
        .filter(Boolean)
        .join(", "),
      formasPagamentoAceitas: form.formasPagamentoAceitas
        .split(/\r?\n/)
        .map((entry) => entry.trim())
        .filter(Boolean)
        .join(", ")
    });

    setLoading(false);
    setSavedMessage("Ajustes operacionais atualizados.");
  }

  if (!store) {
    return <MerchantPanelMissingState description="Nao foi possivel carregar os ajustes desta operacao." />;
  }

  return (
    <MerchantPanelShell
      storeId={storeId}
      store={store}
      className="store-settings-page merchant-ui-shell"
      bodyClassName="merchant-ui-main merchant-settings-main"
      eyebrow="PDV PREMIUM / AJUSTES OPERACIONAIS"
      title="Ajustes da operacao"
      description="Configure identidade, atendimento, entrega, pagamento e preferencias do painel sem perder a compatibilidade da tela atual."
      heroActions={(
        <div className="merchant-customers-hero-actions">
          {store.slug ? <Link to={`/loja/${store.slug}`} className="store-panel-pill">Ver vitrine</Link> : null}
          <Link to={`/admin-loja/${storeId}/pdv`} className="btn btn-outline">Ir para o PDV</Link>
        </div>
      )}
      onLogout={() => {
        actions.logoutMerchant();
        navigate("/pdv");
      }}
    >
      <section className="store-panel-body merchant-ui-body">
        <form className="merchant-settings-v2" onSubmit={submit}>
          <section className="dashboard-panel">
            <div className="dashboard-panel-head">
              <div>
                <p className="prompt-card-kicker">IDENTIDADE</p>
                <h3>Loja e vitrine</h3>
              </div>
            </div>

            <div className="merchant-settings-grid">
              <label>
                <span>Nome da loja</span>
                <input value={form.nome} onChange={(event) => updateField("nome", event.target.value)} required />
              </label>
              <label>
                <span>Categoria</span>
                <input value={form.categoria} onChange={(event) => updateField("categoria", event.target.value)} />
              </label>
              <label>
                <span>Status da loja</span>
                <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                  <option value="ATIVA">Ativa</option>
                  <option value="PENDENTE">Pendente</option>
                  <option value="PAUSADA">Pausada</option>
                  <option value="BLOQUEADA">Bloqueada</option>
                </select>
              </label>
              <label>
                <span>Horario de funcionamento</span>
                <input value={form.horarioFuncionamento} onChange={(event) => updateField("horarioFuncionamento", event.target.value)} placeholder="Seg-Dom 10h as 22h" />
              </label>
              <label>
                <span>Logo da loja</span>
                <input type="url" value={form.logo} onChange={(event) => updateField("logo", event.target.value)} placeholder="https://..." />
              </label>
              <label>
                <span>Imagem de capa</span>
                <input type="url" value={form.capa} onChange={(event) => updateField("capa", event.target.value)} placeholder="https://..." />
              </label>
            </div>

            <label>
              <span>Descricao curta</span>
              <input value={form.descricaoCurta} onChange={(event) => updateField("descricaoCurta", event.target.value)} placeholder="Resumo curto da operacao" />
            </label>

            <label>
              <span>Descricao completa</span>
              <textarea rows={4} value={form.descricaoCompleta} onChange={(event) => updateField("descricaoCompleta", event.target.value)} placeholder="Texto completo da loja e da operacao..." />
            </label>

            <div className="merchant-settings-preview">
              <SmartImage src={form.capa || form.logo || store.imagens.capa} alt={form.nome || store.nome} />
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-head">
              <div>
                <p className="prompt-card-kicker">CONTATO E ENDERECO</p>
                <h3>Canais e localizacao</h3>
              </div>
            </div>

            <div className="merchant-settings-grid">
              <label>
                <span>Telefone</span>
                <input value={form.telefone} onChange={(event) => updateField("telefone", event.target.value)} />
              </label>
              <label>
                <span>WhatsApp</span>
                <input value={form.whatsapp} onChange={(event) => updateField("whatsapp", event.target.value)} />
              </label>
              <label>
                <span>E-mail</span>
                <input value={form.email} onChange={(event) => updateField("email", event.target.value)} />
              </label>
              <label>
                <span>CEP</span>
                <input value={form.cep} onChange={(event) => updateField("cep", event.target.value)} />
              </label>
              <label>
                <span>Logradouro</span>
                <input value={form.logradouro} onChange={(event) => updateField("logradouro", event.target.value)} />
              </label>
              <label>
                <span>Numero</span>
                <input value={form.numero} onChange={(event) => updateField("numero", event.target.value)} />
              </label>
              <label>
                <span>Complemento</span>
                <input value={form.complemento} onChange={(event) => updateField("complemento", event.target.value)} />
              </label>
              <label>
                <span>Bairro</span>
                <input value={form.bairro} onChange={(event) => updateField("bairro", event.target.value)} />
              </label>
              <label>
                <span>Cidade</span>
                <input value={form.cidade} onChange={(event) => updateField("cidade", event.target.value)} />
              </label>
              <label>
                <span>Estado</span>
                <input value={form.estado} onChange={(event) => updateField("estado", event.target.value)} />
              </label>
              <label>
                <span>Website</span>
                <input value={form.website} onChange={(event) => updateField("website", event.target.value)} />
              </label>
              <label>
                <span>Instagram</span>
                <input value={form.instagram} onChange={(event) => updateField("instagram", event.target.value)} />
              </label>
            </div>

            <label>
              <span>Facebook</span>
              <input value={form.facebook} onChange={(event) => updateField("facebook", event.target.value)} />
            </label>
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-head">
              <div>
                <p className="prompt-card-kicker">OPERACAO</p>
                <h3>Entrega, pagamento e atendimento</h3>
              </div>
            </div>

            <div className="merchant-settings-grid">
              <label>
                <span>Taxa de entrega padrao</span>
                <input type="number" step="0.01" value={form.taxaEntregaPadrao} onChange={(event) => updateField("taxaEntregaPadrao", event.target.value)} />
              </label>
              <label>
                <span>Pedido minimo</span>
                <input type="number" step="0.01" value={form.pedidoMinimo} onChange={(event) => updateField("pedidoMinimo", event.target.value)} />
              </label>
              <label>
                <span>Tempo medio de preparo</span>
                <input type="number" value={form.tempoMedioPreparoMinutos} onChange={(event) => updateField("tempoMedioPreparoMinutos", event.target.value)} />
              </label>
              <label>
                <span>Tempo medio de entrega</span>
                <input type="number" value={form.tempoMedioEntregaMinutos} onChange={(event) => updateField("tempoMedioEntregaMinutos", event.target.value)} />
              </label>
            </div>

            <div className="merchant-settings-toggles">
              <label><input type="checkbox" checked={form.aceitaPedidos} onChange={(event) => updateField("aceitaPedidos", event.target.checked)} /> Aceitar pedidos</label>
              <label><input type="checkbox" checked={form.aceitaRetirada} onChange={(event) => updateField("aceitaRetirada", event.target.checked)} /> Aceitar retirada</label>
              <label><input type="checkbox" checked={form.aceitaEntrega} onChange={(event) => updateField("aceitaEntrega", event.target.checked)} /> Aceitar entrega</label>
              <label><input type="checkbox" checked={form.exibirProdutosEsgotados} onChange={(event) => updateField("exibirProdutosEsgotados", event.target.checked)} /> Exibir produtos esgotados</label>
              <label><input type="checkbox" checked={form.exibirWhatsapp} onChange={(event) => updateField("exibirWhatsapp", event.target.checked)} /> Exibir WhatsApp na vitrine</label>
            </div>

            <div className="merchant-settings-grid merchant-settings-grid-textarea">
              <label>
                <span>Bairros atendidos</span>
                <textarea rows={5} value={form.bairrosAtendidos} onChange={(event) => updateField("bairrosAtendidos", event.target.value)} placeholder={"Centro\nVila Nova\nJardim Brasil"} />
              </label>
              <label>
                <span>Formas de pagamento aceitas</span>
                <textarea rows={5} value={form.formasPagamentoAceitas} onChange={(event) => updateField("formasPagamentoAceitas", event.target.value)} placeholder={"Dinheiro\nPix\nDebito\nCredito"} />
              </label>
            </div>

            <label>
              <span>Mensagem de boas-vindas</span>
              <textarea rows={3} value={form.mensagemBoasVindas} onChange={(event) => updateField("mensagemBoasVindas", event.target.value)} />
            </label>
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-head">
              <div>
                <p className="prompt-card-kicker">PAINEL E SEO</p>
                <h3>Preferencias da loja</h3>
              </div>
            </div>

            <div className="merchant-settings-toggles">
              <label><input type="checkbox" checked={form.painelCompacto} onChange={(event) => updateField("painelCompacto", event.target.checked)} /> Usar painel compacto</label>
              <label><input type="checkbox" checked={form.alertaSonoroPedidos} onChange={(event) => updateField("alertaSonoroPedidos", event.target.checked)} /> Alerta sonoro de pedidos</label>
              <label><input type="checkbox" checked={form.exibirDashboardFinanceiro} onChange={(event) => updateField("exibirDashboardFinanceiro", event.target.checked)} /> Exibir dashboard financeiro</label>
            </div>

            <div className="merchant-settings-grid merchant-settings-grid-textarea">
              <label>
                <span>Politica de entrega</span>
                <textarea rows={4} value={form.politicaEntrega} onChange={(event) => updateField("politicaEntrega", event.target.value)} />
              </label>
              <label>
                <span>Politica de troca</span>
                <textarea rows={4} value={form.politicaTroca} onChange={(event) => updateField("politicaTroca", event.target.value)} />
              </label>
            </div>

            <div className="merchant-settings-grid">
              <label>
                <span>SEO title</span>
                <input value={form.seoTitle} onChange={(event) => updateField("seoTitle", event.target.value)} />
              </label>
              <label>
                <span>SEO description</span>
                <input value={form.seoDescription} onChange={(event) => updateField("seoDescription", event.target.value)} />
              </label>
            </div>
          </section>

          {savedMessage ? <p className="success-text">{savedMessage}</p> : null}

          <button className="btn btn-primary merchant-settings-submit" type="submit">
            {loading ? "Salvando..." : "Salvar ajustes"}
          </button>
        </form>
      </section>
    </MerchantPanelShell>
  );
}
