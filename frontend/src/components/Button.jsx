import React from "react";

/**
 * Button Component - Botão reutilizável com múltiplas variações
 *
 * @param {string} variant - Tipo do botão: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost'
 * @param {string} size - Tamanho: 'sm' | 'md' (padrão) | 'lg'
 * @param {string} children - Conteúdo do botão
 * @param {boolean} disabled - Disabled state
 * @param {function} onClick - Função ao clicar
 * @param {string} className - Classes adicionais
 * @param {object} icon - Ícone (opcional) - deve ser um React component do Heroicons
 * @param {string} iconPosition - Posição do ícone: 'left' (padrão) | 'right'
 * @param {string} type - Tipo HTML: 'button' (padrão) | 'submit' | 'reset'
 * @param {React.ElementType} as - Component to render as (e.g., Link) - default is 'button'
 */
export default function Button({
  variant = "primary",
  size = "md",
  children,
  disabled = false,
  onClick,
  className = "",
  icon: Icon,
  iconPosition = "left",
  type = "button",
  as: Component = "button",
  ...props
}) {
  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    success: "btn-success",
    danger: "btn-danger",
    outline: "btn-outline",
    ghost: "btn-ghost",
  };

  const sizeClasses = {
    sm: "btn-sm",
    md: "",
    lg: "btn-lg",
  };

  const baseClasses = "btn";
  const variantClass = variantClasses[variant] || variantClasses.primary;
  const sizeClass = sizeClasses[size] || "";

  const combinedClassName = `${baseClasses} ${variantClass} ${sizeClass} ${className}`.trim();

  const buttonProps = {
    className: combinedClassName,
    ...props,
  };

  if (Component === "button" || typeof Component === "string") {
    buttonProps.type = type;
    buttonProps.disabled = disabled;
    buttonProps.onClick = onClick;
  }

  return React.createElement(
    Component,
    buttonProps,
    Icon && iconPosition === "left" && (
      <Icon key="icon-left" className="button-icon" width={20} height={20} strokeWidth={1.5} />
    ),
    children && <span key="child">{children}</span>,
    Icon && iconPosition === "right" && (
      <Icon key="icon-right" className="button-icon" width={20} height={20} strokeWidth={1.5} />
    )
  );
}
