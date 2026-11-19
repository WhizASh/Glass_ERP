import { useState } from 'react';
import StaffDialog, { Field } from './StaffDialog';
import { currency, dateLabel, dateValue, input, today } from './staffUi';

export default function EmployeeDialog({ employee, onClose, onSave }) {
  const [changeSalary, setChangeSalary] = useState(false);
  const [effectiveOn, setEffectiveOn] = useState(today());
  const [joinedOn, setJoinedOn] = useState(dateValue(employee?.joinedOn));
  const rate = employee?.salaries.find((salary) => dateValue(salary.effectiveOn) === effectiveOn);

  function submit(form) {
    const data = Object.fromEntries(form);
    if (employee && changeSalary) {
      data.salaryChange = { amount: data.salary, effectiveOn };
      delete data.salary;
    }
    return onSave(data, employee?.id);
  }

  return (
    <StaffDialog title={employee ? 'Edit employee' : 'Add employee'} onClose={onClose} onSave={submit} saveLabel="Save employee">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name"><input className={input} name="name" required maxLength={120} defaultValue={employee?.name} /></Field>
        <Field label="Employee ID"><input className={input} name="employeeCode" required maxLength={40} defaultValue={employee?.employeeCode} /></Field>
        <Field label="Role"><input className={input} name="role" required maxLength={120} defaultValue={employee?.role} /></Field>
        <Field label="Phone"><input className={input} name="phone" type="tel" maxLength={40} defaultValue={employee?.phone} /></Field>
        <Field label="Joining date"><input className={input} name="joinedOn" type="date" required value={joinedOn} onChange={(event) => setJoinedOn(event.target.value)} /></Field>
        {employee && <Field label="Last working day"><input className={input} name="leftOn" type="date" min={joinedOn} defaultValue={dateValue(employee.leftOn)} /></Field>}
      </div>
      <Field label="Address"><textarea className={input} name="address" rows={2} maxLength={500} defaultValue={employee?.address} /></Field>
      {!employee && <Field label="Initial monthly salary (₹)"><input className={input} name="salary" type="number" required min="0" max="9999999999.99" step="0.01" /></Field>}
      {employee && (
        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <h3 className="text-sm font-semibold">Salary history</h3>
          <ul className="max-h-32 divide-y divide-slate-200 overflow-auto text-sm">
            {[...employee.salaries].reverse().map((salary) => (
              <li key={salary.effectiveOn} className="flex justify-between gap-2 py-1.5">
                <span>{dateLabel(salary.effectiveOn)}</span>
                <span className="font-medium tabular-nums">{currency.format(salary.amount)}</span>
              </li>
            ))}
          </ul>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={changeSalary} onChange={(event) => setChangeSalary(event.target.checked)} />
            Change monthly salary
          </label>
          {changeSalary && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Effective date"><input className={input} type="date" required min={joinedOn} value={effectiveOn} onChange={(event) => setEffectiveOn(event.target.value)} /></Field>
                <Field label="Monthly salary (₹)"><input key={effectiveOn} className={input} name="salary" type="number" required min="0" max="9999999999.99" step="0.01" defaultValue={rate?.amount} /></Field>
              </div>
              {rate && <p className="text-xs text-slate-600">This date already has a salary. Saving replaces that rate.</p>}
            </>
          )}
        </div>
      )}
    </StaffDialog>
  );
}
