import { useState } from 'react';
import EmployeesPanel from '../staff/EmployeesPanel';
import PayrollPanel from '../staff/PayrollPanel';
import { monthInput, today } from '../staff/staffUi';
import PageLayout, { FilterTabs } from '../common/PageLayout';

export default function StaffView() {
  const [section, setSection] = useState('Employees');
  const [month, setMonth] = useState(today().slice(0, 7));

  return (
    <PageLayout title="Staff" description="Employee records, salary history and monthly payroll." actions={section === 'Payroll' && (
          <label className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-slate-700">
            Payroll month
            <input type="month" className={monthInput} min="1000-01" max="9999-12" value={month}
              onChange={(event) => {
                if (/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(event.target.value)) setMonth(event.target.value);
              }} />
          </label>
        )}>
      <FilterTabs label="Staff sections" options={['Employees', 'Payroll'].map(value => ({ value, label: value }))} value={section} onChange={setSection} />
        {section === 'Employees' ? <EmployeesPanel /> : <PayrollPanel key={month} month={month} />}
    </PageLayout>
  );
}
