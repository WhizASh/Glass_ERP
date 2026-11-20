import { useState } from 'react';
import EmployeesPanel from '../staff/EmployeesPanel';
import PayrollPanel from '../staff/PayrollPanel';
import { monthInput, today } from '../staff/staffUi';

export default function StaffView() {
  const [section, setSection] = useState('Employees');
  const [month, setMonth] = useState(today().slice(0, 7));

  return (
    <section className="rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Staff</h1>
        {section === 'Payroll' && (
          <label className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-slate-700">
            Payroll month
            <input type="month" className={monthInput} min="1000-01" max="9999-12" value={month}
              onChange={(event) => {
                if (/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(event.target.value)) setMonth(event.target.value);
              }} />
          </label>
        )}
      </div>
      <nav aria-label="Staff sections" className="flex gap-1 border-b border-slate-200 px-4 sm:px-6">
        {['Employees', 'Payroll'].map((item) => (
          <button key={item} type="button" aria-pressed={section === item} onClick={() => setSection(item)}
            className={`min-h-11 rounded-t-md border-b-2 px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600 ${section === item ? 'border-teal-700 bg-teal-50 text-teal-900' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
            {item}
          </button>
        ))}
      </nav>
      <div className="p-4 sm:p-6">
        {section === 'Employees' ? <EmployeesPanel /> : <PayrollPanel key={month} month={month} />}
      </div>
    </section>
  );
}
