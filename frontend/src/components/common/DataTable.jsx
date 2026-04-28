/**
 * @component DataTable
 * @desc      Reusable table with clickable rows.
 *            Used across all Care4U pages for listing records.
 * @author    Wasana Karunanayaka (S/21/081)
 * @param {Array}    columns   - Array of { key, label } objects defining columns
 * @param {Array}    data      - Array of row objects
 * @param {Function} onRowClick - Called with the row object when a row is clicked
 * @param {string}   emptyMessage - Text shown when data array is empty
 */
const DataTable = ({ columns, data, onRowClick, emptyMessage = 'No records found.' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-100">
      <table className="w-full text-sm">
        {/* Header */}
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-slate-50">
          {data.map((row, index) => (
            <tr
              key={row.id || index}
              onClick={() => onRowClick && onRowClick(row)}
              className={`bg-white transition-colors ${
                onRowClick ? 'cursor-pointer hover:bg-slate-50' : ''
              }`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-slate-700">
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;