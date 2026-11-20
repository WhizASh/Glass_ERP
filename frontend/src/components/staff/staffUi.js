export const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-3.5 text-sm font-semibold motion-safe:transition motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
export const primary = `${button} border-teal-700 bg-teal-700 text-white hover:bg-teal-800`;
export const secondary = `${button} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`;
const fieldStyle = 'min-h-11 min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600';
export const input = "w-full " + fieldStyle;
export const monthInput = "w-44 max-w-full " + fieldStyle;
export const rowAction = 'inline-flex min-h-11 items-center rounded-md px-2 font-sans font-semibold text-teal-800 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:opacity-50';

export const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
const calendarDate = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'UTC' });
const calendarMonth = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });
export const dateLabel = (date) => calendarDate.format(new Date(date));
export const monthLabel = (month) => calendarMonth.format(new Date(`${month}-01T00:00:00Z`));
export const dateValue = (date) => date?.slice(0, 10) || '';
export function today() {
  const local = new Date();
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 10);
}
