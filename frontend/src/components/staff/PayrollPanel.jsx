import { useEffect, useState } from 'react';
import StaffTable from './StaffTable';
import { api } from '../../services/api';
import StaffDialog, { Field } from './StaffDialog';
import StaffSummary from './StaffSummary';
import { currency, input, monthLabel, primary, rowAction, secondary } from './staffUi';

function adjustmentsFor(entries) {
  return entries.filter((entry) => entry.unpaidDays || Number(entry.additions) || Number(entry.deductions))
    .map(({ employeeId, unpaidDays, additions, deductions }) => ({ employeeId, unpaidDays, additions, deductions }));
}

export default function PayrollPanel({ month }) {
  const [payroll, setPayroll] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [editor, setEditor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    api.getPayroll(month, controller.signal).then((data) => {
      if (!controller.signal.aborted) setPayroll(data);
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message);
    });
    return () => controller.abort();
  }, [month, attempt]);

  function reload() {
    setPayroll(null);
    setError('');
    setAttempt(attempt + 1);
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      setPayroll(await api.savePayroll(month, adjustmentsFor(payroll.entries), payroll.revision));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  }

  async function applyAdjustment(form) {
    const adjustments = adjustmentsFor(payroll.entries).filter((item) => item.employeeId !== editor.employeeId);
    adjustments.push({
      employeeId: editor.employeeId,
      unpaidDays: Number(form.get('unpaidDays')),
      additions: form.get('additions') || '0',
      deductions: form.get('deductions') || '0'
    });
    setPayroll(await api.previewPayroll(month, adjustments));
    setError('');
  }

  if (!payroll) {
    return error ? <div className="space-y-2"><p role="alert" className="text-sm text-red-700">{error}</p>
      <button type="button" className={secondary} onClick={reload}>Retry</button></div>
      : <StaffTable loading tableAriaLabel="Monthly payroll" />;
  }

  const saved = Boolean(payroll.createdAt);
  const totals = payroll.entries.reduce((total, entry) => ({
    grossPay: total.grossPay + Math.round(Number(entry.grossPay) * 100),
    netPay: total.netPay + Math.round(Number(entry.netPay) * 100),
    additions: total.additions + Math.round(Number(entry.additions) * 100),
    deductions: total.deductions + Math.round(Number(entry.deductions) * 100)
  }), { grossPay: 0, netPay: 0, additions: 0, deductions: 0 });
  const formatted = (key) => currency.format(totals[key] / 100);
  const columns = [
    { header: 'Employee', render: (row) => <><strong>{row.name}</strong><span className="block text-slate-500">{row.employeeCode}</span></> },
    { header: 'Paid days', align: 'right', render: (row) => `${row.paidDays} / ${row.eligibleDays}` },
    { header: 'Base pay', align: 'right', render: (row) => currency.format(row.basePay) },
    { header: 'Additions', align: 'right', render: (row) => currency.format(row.additions) },
    { header: 'Gross pay', align: 'right', render: (row) => currency.format(row.grossPay) },
    { header: 'Deductions', align: 'right', render: (row) => currency.format(row.deductions) },
    { header: 'Net pay', align: 'right', render: (row) => <strong>{currency.format(row.netPay)}</strong> },
    ...(!saved ? [{ header: 'Actions', align: 'right', render: (row) => <button type="button" disabled={saving}
      aria-label={`Adjust payroll for ${row.name}`} onClick={() => setEditor(row)}
      className={rowAction}>Adjust</button> }] : [])
  ];

  return (
    <div className="space-y-5">
      <StaffSummary title={`${monthLabel(month)} · ${payroll.days} calendar days`}
        figures={[[ 'Gross payroll', formatted('grossPay') ], [ 'Employee net pay', formatted('netPay') ]]}
        count={payroll.entries.length} countLabel="Employees in payroll"
        detailTitle="Adjustments" details={[[ 'Additions', formatted('additions') ], [ 'Deductions', formatted('deductions') ]]} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Employee payroll</h2>
          <p className="mt-1 text-sm text-slate-600" role="status">{saved ? 'Saved payroll' : 'Preview · Saving records these amounts for this month.'}</p>
        </div>
        {!saved && <button type="button" onClick={save} disabled={saving || !payroll.entries.length} className={primary + ' w-full sm:w-auto'}>{saving ? 'Saving…' : 'Save payroll'}</button>}
      </div>
      {error && <div className="flex flex-wrap items-center gap-2"><p className="text-sm text-red-700" role="alert">{error}</p>
        <button type="button" onClick={reload} className={secondary}>Reload month</button></div>}
      <StaffTable columns={columns} data={payroll.entries.map((entry) => ({ ...entry, id: entry.employeeId }))} tableAriaLabel="Monthly employee payroll"
        emptyMessage="No eligible employees this month" emptySubtext="Payroll includes employees who worked within the selected month." />
      {editor && <StaffDialog title={`Payroll adjustment for ${editor.name}`} onClose={() => setEditor(null)} onSave={applyAdjustment} saveLabel="Update preview">
        <p className="text-sm text-slate-600">Unpaid days use the average daily rate for this employee’s eligible days in the month.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Unpaid days"><input className={input} name="unpaidDays" type="number" required min="0" max={editor.eligibleDays} step="1" defaultValue={editor.unpaidDays} /></Field>
          <Field label="Additions (₹)"><input className={input} name="additions" type="number" min="0" max="9999999999.99" step="0.01" defaultValue={editor.additions} /></Field>
          <Field label="Deductions (₹)"><input className={input} name="deductions" type="number" min="0" max="9999999999.99" step="0.01" defaultValue={editor.deductions} /></Field>
        </div>
      </StaffDialog>}
    </div>
  );
}
