/**
 * @file DataTable.jsx
 * @module Components
 * @desc Shared Care4U data-table component.
 * @author Wasana Karunanayaka (S/21/081)
 */

import { Inbox } from 'lucide-react';

/**
 * @component DataTable
 * @desc      Reusable table with clickable rows.
 *            Used across all Care4U pages for listing records.
 *            Shows a friendly empty state (icon + message) instead of a
 *            blank table, per the UX standard for data-driven screens.
 * @author    Wasana Karunanayaka (S/21/081)
 * @param {Array}    columns   - Array of { key, label } objects defining columns
 * @param {Array}    data      - Array of row objects
 * @param {Function} onRowClick - Called with the row object when a row is clicked
 * @param {string}   emptyMessage - Text shown when data array is empty
 */
const DataTable = ({ columns, data, onRowClick, emptyMessage = 'No records found.' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-14 px-4 rounded-lg border border-dashed border-border bg-secondary/40">
        <Inbox className="w-9 h-9 text-muted-foreground mb-3" strokeWidth={1.5} />
        <p className="text-sm font-medium text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        {/* Header */}
        <thead>
          <tr className="bg-secondary border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-border">
          {data.map((row, index) => (
            <tr
              key={row.id || index}
              onClick={() => onRowClick && onRowClick(row)}
              className={`bg-card transition-colors ${
                onRowClick ? 'cursor-pointer hover:bg-secondary/60' : ''
              }`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-foreground">
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
