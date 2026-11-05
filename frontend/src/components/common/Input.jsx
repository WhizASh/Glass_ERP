import React from 'react';

/**
 * Labeled input component with error message display and icon support.
 */
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
  disabled = false,
  required = false,
  icon: Icon,
  suffix,
  className = '',
  step,
  min,
  max,
  ...props
}) {
  const inputId = id || name;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-slate-700 mb-1">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative rounded-lg shadow-2xs">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          step={step}
          min={min}
          max={max}
          className={`block w-full rounded-lg text-sm bg-white border transition-all text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 ${
            Icon ? 'pl-9' : 'pl-3'
          } ${suffix ? 'pr-12' : 'pr-3'} py-2 ${
            error
              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-300 focus:border-sky-500 focus:ring-sky-500/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' : ''}`}
          {...props}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs text-slate-500 font-medium">
            {suffix}
          </div>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
