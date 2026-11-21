import { field } from '../common/ui';
export { button, primary, secondary, input, rowAction } from '../common/ui';
export const monthInput = `w-44 max-w-full ${field}`;

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
