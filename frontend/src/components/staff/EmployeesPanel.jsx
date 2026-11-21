import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '../common/DataTable';
import { api } from '../../services/api';
import EmployeeDialog from './EmployeeDialog';
import StaffSummary from './StaffSummary';
import { currency, dateLabel, dateValue, input, primary, rowAction, today } from './staffUi';

function employeeStatus(employee, currentDate) {
  if (dateValue(employee.joinedOn) > currentDate) return 'Upcoming';
  if (employee.leftOn && dateValue(employee.leftOn) < currentDate) return 'Departed';
  return 'Active';
}

export default function EmployeesPanel() {
  const [employees, setEmployees] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    api.getEmployees(controller.signal).then((data) => {
      if (!controller.signal.aborted) setEmployees(data);
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message);
    });
    return () => controller.abort();
  }, [attempt]);

  const currentDate = today();
  const roster = (employees ?? []).map((employee) => {
    const status = employeeStatus(employee, currentDate);
    const salaryDate = status === 'Departed' ? dateValue(employee.leftOn) : currentDate;
    const salary = [...employee.salaries].reverse().find((rate) => dateValue(rate.effectiveOn) <= salaryDate);
    return { ...employee, status, currentSalary: salary?.amount };
  });
  const active = roster.filter((employee) => employee.status === 'Active');
  const query = search.trim().toLowerCase();
  const rows = roster.filter(({ name, employeeCode, role }) =>
    [name, employeeCode, role].some((value) => value.toLowerCase().includes(query))
  );
  const columns = [
    { header: 'Employee', render: (row) => <><strong>{row.name}</strong><span className="block text-slate-500">{row.employeeCode}</span></> },
    { header: 'Role', accessor: 'role' },
    { header: 'Joined', render: (row) => dateLabel(row.joinedOn) },
    { header: 'Status', render: (row) => <>{row.status}{row.leftOn && <span className="block text-slate-500">Last day {dateLabel(row.leftOn)}</span>}</> },
    { header: 'Monthly salary', align: 'right', render: (row) => row.currentSalary == null ? '—' : currency.format(row.currentSalary) },
    { header: 'Actions', align: 'right', render: (row) => <button type="button" aria-label={`Edit ${row.name}`} className={rowAction} onClick={() => setEditor({ employee: row })}>Edit</button> }
  ];

  async function saveEmployee(data, id) {
    const employee = await api.saveEmployee(data, id);
    setEmployees((previous) => [
      ...(previous || []).filter((item) => item.id !== employee.id),
      employee
    ].sort((a, b) => a.name.localeCompare(b.name) || a.employeeCode.localeCompare(b.employeeCode)));
    setNotice(id ? 'Employee updated.' : 'Employee added.');
  }

  return (
    <div className="space-y-5">
      {employees && <StaffSummary title="Staff overview"
        figures={[[ 'Active employees', active.length ], [ 'Active monthly salary', currency.format(active.reduce((total, employee) => total + Number(employee.currentSalary ?? 0), 0)) ]]}
        count={employees.length} countLabel="Employee records"
        detailTitle="Employment status"
        details={[[ 'Upcoming', roster.filter((employee) => employee.status === 'Upcoming').length ], [ 'Departed', roster.filter((employee) => employee.status === 'Departed').length ]]} />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Employee directory</h2>
        <input type="search" aria-label="Search employees by name, ID or role" value={search} onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, ID or role" className={input + ' sm:ml-auto sm:w-64'} />
        <button type="button" disabled={!employees} onClick={() => setEditor({})} className={primary + ' w-full sm:w-auto'}>
          <Plus size={16} aria-hidden="true" /> Add employee
        </button>
      </div>
      {notice && <p role="status" className="text-sm text-teal-800">{notice}</p>}
      {error ? (
        <div className="space-y-2 text-sm">
          <p role="alert" className="text-red-700">{error}</p>
          <button type="button" className={primary} onClick={() => { setError(''); setAttempt(attempt + 1); }}>Retry</button>
        </div>
      ) : <DataTable columns={columns} data={rows} loading={!employees} tableAriaLabel="Employee directory"
        emptyMessage={query ? 'No matching employees' : 'No employees yet'}
        emptySubtext={query ? 'Try a different name, ID or role.' : 'Add an employee to start building your staff directory.'} />}
      {editor && <EmployeeDialog employee={editor.employee} onSave={saveEmployee} onClose={() => setEditor(null)} />}
    </div>
  );
}
