import React from 'react';

/**
 * Reusable Button component with multiple variants, sizes, and loading state.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white shadow-lg shadow-cyan-900/30 focus:ring-cyan-500 border border-cyan-500/30',
    secondary:
      'bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-slate-200 border border-slate-700 focus:ring-slate-500 shadow-sm',
    danger:
      'bg-rose-600/90 hover:bg-rose-500 active:bg-rose-700 text-white shadow-lg shadow-rose-950/40 focus:ring-rose-500 border border-rose-500/30',
    outline:
      'bg-transparent hover:bg-slate-800/80 active:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 focus:ring-slate-500',
    ghost:
      'bg-transparent hover:bg-slate-800/60 active:bg-slate-800 text-slate-400 hover:text-slate-100 focus:ring-slate-500',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${
        variantClasses[variant] || variantClasses.primary
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-0.5 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : Icon ? (
        <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      ) : null}
      {children}
    </button>
  );
}
