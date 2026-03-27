import React from "react";

/**
 * FormInput Component - Input reutilizável com ícone e validação
 *
 * @param {string} type - Tipo do input: 'text' | 'email' | 'password' | 'number' | 'tel'
 * @param {string} placeholder - Placeholder do input
 * @param {string} value - Valor controlado
 * @param {function} onChange - Função ao mudar
 * @param {string} status - Status: 'default' | 'success' | 'warning' | 'error' | 'info'
 * @param {string} errorMessage - Mensagem de erro (exibida se status='error')
 * @param {object} icon - Ícone esquerdo (React component Heroicons)
 * @param {object} iconRight - Ícone direito (optional)
 * @param {string} label - Label do input
 * @param {string} className - Classes adicionais
 */
export default function FormInput({
  type = "text",
  placeholder,
  value,
  onChange,
  status = "default",
  errorMessage,
  icon: Icon,
  iconRight: IconRight,
  label,
  className = "",
  disabled = false,
  required = false,
  ...props
}) {
  const statusClasses = {
    default: "",
    success: "input-success",
    warning: "input-warning",
    error: "input-error",
    info: "input-info",
  };

  const statusClass = statusClasses[status] || "";

  const wrapperClassName = `form-input-wrapper ${statusClass}`.trim();

  return (
    <div className={wrapperClassName}>
      {label && (
        <label className="form-input-label">
          {label}
          {required && <span className="form-input-required">*</span>}
        </label>
      )}

      <div className="form-input-container">
        {Icon && <Icon className="form-input-icon-left" width={20} height={20} strokeWidth={1.5} />}

        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`form-input ${className}`.trim()}
          {...props}
        />

        {IconRight && (
          <IconRight className="form-input-icon-right" width={20} height={20} strokeWidth={1.5} />
        )}
      </div>

      {errorMessage && status === "error" && (
        <span className="form-input-error">{errorMessage}</span>
      )}
    </div>
  );
}
