export default function StaffSummary({ title, figures, detailTitle, details, count, countLabel }) {
  return (
    <section aria-label={title} className="grid gap-3 md:grid-cols-[1fr_1fr] lg:grid-cols-[2fr_0.8fr_1.25fr]">
      <div className="min-w-0 rounded-lg border md:col-span-2 lg:col-span-1 border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-slate-600">{title}</h2>
        <dl className="mt-4 grid gap-x-4 gap-y-3 min-[375px]:grid-cols-2">
          {figures.map(([label, value]) => (
            <div key={label} className="flex min-w-0 flex-col gap-1">
              <dt className="text-sm text-slate-600">{label}</dt>
              <dd className="order-first break-words text-xl font-semibold tracking-tight sm:text-2xl text-slate-900 tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="flex flex-col justify-center rounded-lg border border-slate-200 bg-slate-50 p-4 lg:text-center">
        <span className="text-sm font-medium text-slate-600">{countLabel}</span>
        <strong className="text-2xl font-semibold text-teal-800 tabular-nums">{count}</strong>
      </div>
      <div className="min-w-0 px-2 py-2 lg:pl-3">
        <h2 className="mb-2 text-sm font-semibold text-slate-800">{detailTitle}</h2>
        <dl className="divide-y divide-slate-200 text-sm">
          {details.map(([label, value]) => (
            <div key={label} className="flex flex-wrap justify-between gap-x-3 py-1.5">
              <dt className="text-slate-600">{label}</dt>
              <dd className="font-medium text-slate-800 tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
