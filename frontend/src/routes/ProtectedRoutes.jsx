import { Navigate, Outlet, useParams } from "react-router-dom";
import { useApp } from "../store/AppContext";
import { isAdminSessionValid, isMerchantSessionValid } from "../lib/auth-session";

// Resolve a entrada curta do admin da loja e redireciona para a loja logada.
export function MerchantEntryRoute() {
  const { state } = useApp();

  if (!isMerchantSessionValid(state.sessions)) {
    return <Navigate to="/pdv" replace />;
  }

  return <Navigate to={`/admin-loja/${state.sessions.merchantStoreId}`} replace />;
}

// Garante que a rota privada da loja só abra para a sessão correta.
export function MerchantProtectedRoute() {
  const { state } = useApp();
  const params = useParams();

  if (!isMerchantSessionValid(state.sessions)) {
    return <Navigate to="/pdv" replace />;
  }

  if (params.storeId && params.storeId !== state.sessions.merchantStoreId) {
    return <Navigate to={`/admin-loja/${state.sessions.merchantStoreId}`} replace />;
  }

  return <Outlet />;
}

// Bloqueia o painel global até o super admin autenticar.
export function SuperAdminProtectedRoute() {
  const { state } = useApp();

  if (!state.sessions.superAdmin || !isAdminSessionValid(state.sessions)) {
    return <Navigate to="/admin-temnaarea/login" replace />;
  }

  return <Outlet />;
}
