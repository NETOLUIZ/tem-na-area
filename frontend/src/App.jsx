import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { MerchantEntryRoute, MerchantProtectedRoute, SuperAdminProtectedRoute } from "./routes/ProtectedRoutes";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import HomePage from "./pages/HomePage";
import LoginStorePage from "./pages/LoginStorePage";
import MerchantDashboardPage from "./pages/MerchantDashboardPage";
import MerchantCustomersPage from "./pages/MerchantCustomersPage";
import MerchantCashRegisterPage from "./pages/MerchantCashRegisterPage";
import MerchantInventoryPage from "./pages/MerchantInventoryPage";
import MerchantReportsPage from "./pages/MerchantReportsPage";
import MerchantMenuPage from "./pages/MerchantMenuPage";
import MerchantOrdersPage from "./pages/MerchantOrdersPage";
import MerchantPosPage from "./pages/MerchantPosPage";
import MerchantSettingsPage from "./pages/MerchantSettingsPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import PrintTicketPage from "./pages/PrintTicketPage";
import RegisterStorePage from "./pages/RegisterStorePage";
import StorePage from "./pages/StorePage";
import SuperAdminDashboardPage from "./pages/SuperAdminDashboardPage";
import SuperAdminFinancePage from "./pages/SuperAdminFinancePage";
import SuperAdminLoginPage from "./pages/SuperAdminLoginPage";
import SuperAdminLogsPage from "./pages/SuperAdminLogsPage";
import SuperAdminStoresPage from "./pages/SuperAdminStoresPage";

function NotFound() {
  return (
    <main className="container page-space">
      <div className="empty-state">
        <h2>Pagina nao encontrada</h2>
        <p>Confira o endereco digitado ou volte para o inicio da plataforma.</p>
      </div>
    </main>
  );
}

function getPageTitle(pathname) {
  if (pathname === "/") return "Tem na Area | Descubra o que tem por perto";
  if (pathname === "/sacola") return "Tem na Area | Sacola";
  if (pathname === "/checkout") return "Tem na Area | Finalizar pedido";
  if (pathname === "/cadastrar-loja") return "Tem na Area | Entrar para a rede";
  if (pathname === "/pdv" || pathname === "/login-loja") return "Tem na Area | Painel do parceiro";
  if (pathname === "/pedido/sucesso") return "Tem na Area | Pedido confirmado";
  if (pathname === "/admin-temnaarea") return "Tem na Area | Central estrategica";
  if (pathname === "/admin-temnaarea/login") return "Tem na Area | Login da central";
  if (pathname === "/admin-temnaarea/lojas") return "Tem na Area | Rede de parceiros";
  if (pathname === "/admin-temnaarea/logs") return "Tem na Area | Logs";
  if (pathname === "/admin-temnaarea/financeiro") return "Tem na Area | Financeiro";
  if (/^\/loja\/[^/]+$/.test(pathname)) return "Tem na Area | Vitrine local";
  if (/^\/admin-loja\/[^/]+$/.test(pathname)) return "Tem na Area | Painel da operacao";
  if (/^\/admin-loja\/[^/]+\/pedidos$/.test(pathname)) return "Tem na Area | Gestao de pedidos";
  if (/^\/admin-loja\/[^/]+\/clientes$/.test(pathname)) return "Tem na Area | Clientes da loja";
  if (/^\/admin-loja\/[^/]+\/caixa$/.test(pathname)) return "Tem na Area | Caixa da loja";
  if (/^\/admin-loja\/[^/]+\/estoque$/.test(pathname)) return "Tem na Area | Estoque da loja";
  if (/^\/admin-loja\/[^/]+\/relatorios$/.test(pathname)) return "Tem na Area | Relatorios da loja";
  if (/^\/admin-loja\/[^/]+\/pdv$/.test(pathname)) return "Tem na Area | Frente de caixa";
  if (/^\/admin-loja\/[^/]+\/cardapio$/.test(pathname)) return "Tem na Area | Catalogo da loja";
  if (/^\/admin-loja\/[^/]+\/ajustes$/.test(pathname)) return "Tem na Area | Ajustes da loja";
  if (/^\/admin-loja\/[^/]+\/pedidos\/[^/]+\/imprimir$/.test(pathname)) {
    return "Tem na Area | Impressao do pedido";
  }
  return "Tem na Area";
}

export default function App() {
  const location = useLocation();

  useEffect(() => {
    document.title = getPageTitle(location.pathname);
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/loja/:slug" element={<StorePage />} />
      <Route path="/sacola" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/pedido/sucesso" element={<OrderSuccessPage />} />

      <Route path="/cadastrar-loja" element={<RegisterStorePage />} />
      <Route path="/pdv" element={<LoginStorePage />} />
      <Route path="/login-loja" element={<Navigate to="/pdv" replace />} />
      <Route path="/admin-loja" element={<MerchantEntryRoute />} />

      <Route element={<MerchantProtectedRoute />}>
        <Route path="/admin-loja/:storeId" element={<MerchantDashboardPage />} />
        <Route path="/admin-loja/:storeId/pedidos" element={<MerchantOrdersPage />} />
        <Route path="/admin-loja/:storeId/clientes" element={<MerchantCustomersPage />} />
        <Route path="/admin-loja/:storeId/caixa" element={<MerchantCashRegisterPage />} />
        <Route path="/admin-loja/:storeId/estoque" element={<MerchantInventoryPage />} />
        <Route path="/admin-loja/:storeId/relatorios" element={<MerchantReportsPage />} />
        <Route path="/admin-loja/:storeId/pdv" element={<MerchantPosPage />} />
        <Route path="/admin-loja/:storeId/cardapio" element={<MerchantMenuPage />} />
        <Route path="/admin-loja/:storeId/ajustes" element={<MerchantSettingsPage />} />
        <Route path="/admin-loja/:storeId/pedidos/:orderId/imprimir" element={<PrintTicketPage />} />
      </Route>

      <Route path="/admin-temnaarea/login" element={<SuperAdminLoginPage />} />
      <Route element={<SuperAdminProtectedRoute />}>
        <Route path="/admin-temnaarea" element={<SuperAdminDashboardPage />} />
        <Route path="/admin-temnaarea/lojas" element={<SuperAdminStoresPage />} />
        <Route path="/admin-temnaarea/logs" element={<SuperAdminLogsPage />} />
        <Route path="/admin-temnaarea/financeiro" element={<SuperAdminFinancePage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
      <Route path="/admin" element={<Navigate to="/admin-temnaarea" replace />} />
    </Routes>
  );
}
