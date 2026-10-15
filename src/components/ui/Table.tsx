import React from 'react';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  isLoading = false,
  emptyMessage = 'No records found',
  className = '',
}: TableProps<T>) {
  return (
    <div className={`w-full overflow-x-auto rounded-[20px] border border-white/12 bg-white/4 backdrop-blur-xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] ${className}`}>
      <table className="w-full border-collapse text-left text-sm text-[#EAF0FF]">
        {/* Sticky Glass Header */}
        <thead>
          <tr className="border-b border-white/12 bg-[#0E1626]/90 backdrop-blur-md sticky top-0 z-10">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`py-4 px-5 text-xs font-bold uppercase tracking-wider text-[#A3B0CC] ${
                  col.align === 'center'
                    ? 'text-center'
                    : col.align === 'right'
                    ? 'text-right'
                    : 'text-left'
                } ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-white/6 font-normal">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-[#A3B0CC]">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-[#2F6BFF] border-t-transparent animate-spin" />
                  <span className="text-xs">Loading records...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-sm text-[#A3B0CC]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => {
              const rowKey = keyExtractor(row, idx);
              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick?.(row)}
                  className={`group transition-colors duration-160 ${
                    onRowClick ? 'cursor-pointer hover:bg-white/[0.08]' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={`${rowKey}-${col.key}`}
                      className={`py-4 px-5 align-middle ${
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                          ? 'text-right'
                          : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {col.render ? col.render(row, idx) : String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
