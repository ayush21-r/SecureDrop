import React from 'react';

export default function Input({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  icon: Icon,
  endAdornment,
  disabled = false,
  required = false,
  className = '',
  ...props
}) {
  const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-slate-300 mb-1.5"
        >
          {label}
          {required && <span className="text-emerald-400 ml-1">*</span>}
        </label>
      )}

      <div className="relative rounded-lg shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className={`w-full rounded-lg bg-slate-900/80 border text-slate-100 text-sm placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-1 ${
            Icon ? 'pl-9' : 'pl-3.5'
          } ${endAdornment ? 'pr-10' : 'pr-3.5'} py-2.5 ${
            error
              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
              : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-900' : ''}`}
          {...props}
        />

        {endAdornment && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {endAdornment}
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
}
