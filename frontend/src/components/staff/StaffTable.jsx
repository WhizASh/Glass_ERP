import DataTable from '../common/DataTable';

export default function StaffTable({ columns, data, tableAriaLabel, ...tableProps }) {
  if (!data?.length) {
    return <DataTable columns={columns} data={data} tableAriaLabel={tableAriaLabel} {...tableProps} />;
  }

  const [name, ...fields] = columns;
  return (
    <>
      <div className="hidden lg:block">
        <DataTable columns={columns} data={data} tableAriaLabel={tableAriaLabel} {...tableProps} />
      </div>
      <ul aria-label={tableAriaLabel} className="divide-y divide-slate-200 rounded-lg border border-slate-200 lg:hidden">
        {data.map((row) => (
          <li key={row.id} className="min-w-0 p-4">
            <div className="break-words text-sm">{name.render(row)}</div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
              {fields.map((column) => (
                <div key={column.header} className="min-w-0">
                  <dt className="text-xs text-slate-600">{column.header}</dt>
                  <dd className="break-words text-sm tabular-nums">{column.render ? column.render(row) : row[column.accessor]}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
