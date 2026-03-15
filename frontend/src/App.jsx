import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { MerchantEntryRoute, MerchantProtectedRoute, SuperAdminProtectedRoute } from "./routes/ProtectedRoutes";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import HomePage from "./pages/HomePage";
import LoginStorePage from "./pages/LoginStorePage";
import MerchantDashboardPage from "./pages/MerchantDashboardPage";
import MerchantMenuPage from "./pages/MerchantMenuPage";
import MerchantOrdersPage from "./pages/MerchantOrdersPage";
import MerchantSettingsPage from "./pages/MerchantSettingsPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import PrintTicketPage from "./pages/PrintTicketPage";
import RegisterStorePage from "./pages/RegisterStorePage";
import StorePage from "./pages/StorePage";
import SuperAdminDashboardPage from "./pages/SuperAdminDashboardPage";
import SuperAdminLoginPage from "./pages/SuperAdminLoginPage";
import SuperAdminLogsPage from "./pages/SuperAdminLogsPage";
import SuperAdminStoresPage from "./pages/SuperAdminStoresPage";

function NotFound() {
  return (
    <main className="container page-space">
      <div className="empty-state">
        <h2>Pgina no encontrada</h2>
        <p>Confira o endereo ou volte para a Home.</p>
      </div>
    </main>
  );
}

function getPageTitle(pathname) {
  if (pathname === "/") return "Tem na Area | /";
  if (pathname === "/sacola") return "Tem na Area | /sacola";
  if (pathname === "/checkout") return "Tem na Area | /checkout";
  if (pathname === "/cadastrar-loja") return "Tem na Area | /cadastrar-loja";
  if (pathname === "/login-loja") return "Tem na Area | /login-loja";
  if (pathname === "/pedido/sucesso") return "Tem na Area | /pedido/sucesso";
  if (pathname === "/admin-temnaarea") return "Tem na Area | /admin-temnaarea";
  if (pathname === "/admin-temnaarea/login") return "Tem na Area | /admin-temnaarea/login";
  if (pathname === "/admin-temnaarea/lojas") return "Tem na Area | /admin-temnaarea/lojas";
  if (pathname === "/admin-temnaarea/logs") return "Tem na Area | /admin-temnaarea/logs";
  if (/^\/loja\/[^/]+$/.test(pathname)) return "Tem na Area | /loja";
  if (/^\/admin-loja\/[^/]+$/.test(pathname)) return "Tem na Area | /admin-loja";
  if (/^\/admin-loja\/[^/]+\/pedidos$/.test(pathname)) return "Tem na Area | /admin-loja/pedidos";
  if (/^\/admin-loja\/[^/]+\/cardapio$/.test(pathname)) return "Tem na Area | /admin-loja/cardapio";
  if (/^\/admin-loja\/[^/]+\/ajustes$/.test(pathname)) return "Tem na Area | /admin-loja/ajustes";
  if (/^\/admin-loja\/[^/]+\/pedidos\/[^/]+\/imprimir$/.test(pathname)) {
    return "Tem na Area | /admin-loja/pedidos/imprimir";
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
      <Route path="/login-loja" element={<LoginStorePage />} />
      <Route path="/admin-loja" element={<MerchantEntryRoute />} />

      <Route element={<MerchantProtectedRoute />}>
        <Route path="/admin-loja/:storeId" element={<MerchantDashboardPage />} />
        <Route path="/admin-loja/:storeId/pedidos" element={<MerchantOrdersPage />} />
        <Route path="/admin-loja/:storeId/cardapio" element={<MerchantMenuPage />} />
        <Route path="/admin-loja/:storeId/ajustes" element={<MerchantSettingsPage />} />
        <Route path="/admin-loja/:storeId/pedidos/:orderId/imprimir" element={<PrintTicketPage />} />
      </Route>

      <Route path="/admin-temnaarea/login" element={<SuperAdminLoginPage />} />
      <Route element={<SuperAdminProtectedRoute />}>
        <Route path="/admin-temnaarea" element={<SuperAdminDashboardPage />} />
        <Route path="/admin-temnaarea/lojas" element={<SuperAdminStoresPage />} />
        <Route path="/admin-temnaarea/logs" element={<SuperAdminLogsPage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
      <Route path="/admin" element={<Navigate to="/admin-temnaarea" replace />} />
    </Routes>
  );
}
