import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  UserIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import Button from "./Button";

/**
 * Navigation Component - Header principal com logo e menu
 * Responsive com menu hambúrguer em mobile
 */
export default function Navigation({ userRole = "customer", userName = null, cartCount = 0 }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <header className="navigation-header">
      <div className="navigation-container">
        {/* Logo */}
        <Link to="/" className="navigation-logo">
          <div className="navigation-logo-mark">
            <span className="navigation-logo-text">Tem na Área</span>
          </div>
        </Link>

        {/* Menu Desktop */}
        <nav className="navigation-menu desktop-only">
          <Link to="/" className="navigation-menu-item">
            <HomeIcon width={20} height={20} />
            <span>Início</span>
          </Link>
          <div className="navigation-search">
            <MagnifyingGlassIcon width={20} height={20} />
            <input type="text" placeholder="Buscar lojas ou produtos..." />
          </div>
        </nav>

        {/* Actions - Desktop */}
        <div className="navigation-actions desktop-only">
          {userRole === "customer" && (
            <Link to="/cart" className="navigation-action-item">
              <div className="navigation-action-badge">
                <ShoppingCartIcon width={24} height={24} />
                {cartCount > 0 && <span className="badge">{cartCount}</span>}
              </div>
            </Link>
          )}

          {userName ? (
            <div className="navigation-user-menu">
              <button className="navigation-action-item">
                <UserIcon width={24} height={24} />
                <span>{userName}</span>
              </button>
            </div>
          ) : (
            <Link to="/login">
              <Button variant="primary" size="sm">
                Entrar
              </Button>
            </Link>
          )}
        </div>

        {/* Menu Hamburger - Mobile */}
        <button className="navigation-hamburger mobile-only" onClick={toggleMobileMenu}>
          {mobileMenuOpen ? (
            <XMarkIcon width={24} height={24} />
          ) : (
            <Bars3Icon width={24} height={24} />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav className="navigation-mobile-menu mobile-only">
          <Link to="/" className="navigation-mobile-menu-item" onClick={toggleMobileMenu}>
            <HomeIcon width={20} height={20} />
            <span>Início</span>
          </Link>

          <div className="navigation-mobile-search">
            <input type="text" placeholder="Buscar..." />
          </div>

          {userRole === "customer" && (
            <Link to="/cart" className="navigation-mobile-menu-item" onClick={toggleMobileMenu}>
              <ShoppingCartIcon width={20} height={20} />
              <span>Carrinho {cartCount > 0 && `(${cartCount})`}</span>
            </Link>
          )}

          {userName ? (
            <div className="navigation-mobile-menu-item">
              <UserIcon width={20} height={20} />
              <span>{userName}</span>
            </div>
          ) : (
            <Link to="/login" className="navigation-mobile-menu-item" onClick={toggleMobileMenu}>
              <UserIcon width={20} height={20} />
              <span>Entrar</span>
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}

/**
 * BottomNav Component - Navegação inferior (mobile)
 * 5 ícones principais para fácil acesso
 */
export function BottomNav({ userRole = "customer", activeRoute = "/" }) {
  const isActive = (route) => activeRoute === route;

  return (
    <nav className="bottom-navigation mobile-only">
      <Link
        to="/"
        className={`bottom-nav-item ${isActive("/") ? "active" : ""}`}
        title="Início"
      >
        <HomeIcon width={24} height={24} />
        <span>Início</span>
      </Link>

      {userRole === "customer" && (
        <>
          <Link
            to="/explore"
            className={`bottom-nav-item ${isActive("/explore") ? "active" : ""}`}
            title="Explorar"
          >
            <MagnifyingGlassIcon width={24} height={24} />
            <span>Explorar</span>
          </Link>

          <Link
            to="/cart"
            className={`bottom-nav-item ${isActive("/cart") ? "active" : ""}`}
            title="Carrinho"
          >
            <ShoppingCartIcon width={24} height={24} />
            <span>Carrinho</span>
          </Link>

          <Link
            to="/orders"
            className={`bottom-nav-item ${isActive("/orders") ? "active" : ""}`}
            title="Pedidos"
          >
            <DocumentTextIcon width={24} height={24} />
            <span>Pedidos</span>
          </Link>

          <Link
            to="/profile"
            className={`bottom-nav-item ${isActive("/profile") ? "active" : ""}`}
            title="Perfil"
          >
            <UserIcon width={24} height={24} />
            <span>Perfil</span>
          </Link>
        </>
      )}

      {userRole === "merchant" && (
        <>
          <Link
            to="/merchant/dashboard"
            className={`bottom-nav-item ${isActive("/merchant/dashboard") ? "active" : ""}`}
            title="Dashboard"
          >
            <DocumentTextIcon width={24} height={24} />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/merchant/menu"
            className={`bottom-nav-item ${isActive("/merchant/menu") ? "active" : ""}`}
            title="Menu"
          >
            <HomeIcon width={24} height={24} />
            <span>Menu</span>
          </Link>

          <Link
            to="/merchant/orders"
            className={`bottom-nav-item ${isActive("/merchant/orders") ? "active" : ""}`}
            title="Pedidos"
          >
            <DocumentTextIcon width={24} height={24} />
            <span>Pedidos</span>
          </Link>

          <Link
            to="/merchant/settings"
            className={`bottom-nav-item ${isActive("/merchant/settings") ? "active" : ""}`}
            title="Configurações"
          >
            <UserIcon width={24} height={24} />
            <span>Config</span>
          </Link>
        </>
      )}
    </nav>
  );
}
