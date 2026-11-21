export default function PageLayout({ title, description, actions, children }) {
  return (
    <section className="min-w-0 rounded-xl border border-steel-200 bg-white text-steel-900">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-steel-200 px-4 py-5 sm:px-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-sm leading-relaxed text-steel-600">{description}</p>}
        </div>
        {actions && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{actions}</div>}
      </header>
      <div className="min-w-0 space-y-5 p-4 sm:p-6">{children}</div>
    </section>
  );
}

export function FilterTabs({ label, options, value, onChange, counts }) {
  return (
    <div role="group" aria-label={label} className="flex min-w-0 flex-wrap gap-1 rounded-lg border border-steel-200 bg-steel-50 p-1">
      {options.map(option => <button type="button" key={option.value} aria-pressed={value === option.value} onClick={() => onChange(option.value)}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${value === option.value ? 'border-teal-200 bg-teal-50 text-teal-900' : 'border-transparent text-steel-600 hover:bg-white hover:text-steel-900'}`}>
        {option.label}{counts?.[option.value] !== undefined && <span className="rounded bg-white px-1.5 text-xs tabular-nums text-steel-600">{counts[option.value]}</span>}
      </button>)}
    </div>
  );
}

export function PageError({ message, onRetry }) {
  return <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><p>{message}</p>{onRetry && <button type="button" onClick={onRetry} className="mt-2 min-h-11 rounded-md px-2 font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">Retry</button>}</div>;
}
