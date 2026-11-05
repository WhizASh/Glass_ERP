import React from 'react';

/**
 * Stylized Select dropdown component with error message and label.
 */
export default function Select({
  label,
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder,
  error,
  helperText,
  disabled = false,
  required = false,
  className = '',
  ...props
}) {
  const selectId = id || name;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-xs font-medium text-slate-700 mb-1">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`block w-full appearance-none rounded-lg text-sm bg-white border px-3 py-2 pr-8 text-slate-900 focus:outline-none focus:ring-2 transition-all ${
            error
              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-300 focus:border-sky-500 focus:ring-sky-500/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' : ''}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="bg-white text-slate-400">
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const isObject = typeof opt === 'object' && opt !== null;
            const val = isObject ? opt.value ?? opt.id : opt;
            const text = isObject ? opt.label ?? opt.name : opt;
            return (
              <option key={String(val)} value={val} className="bg-white text-slate-900 py-1">
                {text}
              </option>
            );
          })}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
      {error ? (
        <p className="mt-1 text-xs text-rose-500">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
