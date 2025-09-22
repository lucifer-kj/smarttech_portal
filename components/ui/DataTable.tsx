'use client';

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  PaginationState,
} from '@tanstack/react-table';
import { ChevronDown, ChevronLeft, ChevronRight, Search, Filter, Download } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Badge } from './Badge';

export interface DataTableProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  showPagination?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  showExport?: boolean;
  pageSize?: number;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: TData) => void;
  onExport?: (data: TData[]) => void;
}

function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  showPagination = true,
  showSearch = true,
  showFilters = false,
  showExport = false,
  pageSize = 10,
  loading = false,
  emptyMessage = "No data available",
  onRowClick,
  onExport,
  className,
  ...props
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize,
  });

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });

  const handleExport = () => {
    if (onExport) {
      onExport(data);
    } else {
      // Default CSV export
      const getHeaderText = (col: ColumnDef<TData, TValue>): string => {
        if (typeof col.header === 'string') return col.header
        return ''
      }

      const getAccessorKey = (col: ColumnDef<TData, TValue>): string | null => {
        return (col as unknown as { accessorKey?: unknown }).accessorKey &&
          typeof (col as unknown as { accessorKey?: unknown }).accessorKey === 'string'
          ? ((col as unknown as { accessorKey: string }).accessorKey)
          : null
      }

      const csvContent = [
        // Headers
        columns.map(col => getHeaderText(col)).join(','),
        // Data rows
        ...data.map(row => 
          columns.map(col => {
            const key = getAccessorKey(col)
            const value = key ? (row as Record<string, unknown>)[key] : ''
            return `"${String(value ?? '')}"`
          }).join(',')
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'export.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <div className={cn("w-full", className)} {...props}>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-surface-200 rounded"></div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-surface-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-4", className)} {...props}>
      {/* Toolbar */}
      {(showSearch || showFilters || showExport) && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {showSearch && searchKey && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-surface-400" />
                <Input
                  placeholder={searchPlaceholder}
                  value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                  onChange={(event) =>
                    table.getColumn(searchKey)?.setFilterValue(event.target.value)
                  }
                  className="pl-10 w-64"
                />
              </div>
            )}
            {showFilters && (
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            )}
          </div>
          {showExport && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50 border-b border-border">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        "px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider",
                        header.column.getCanSort() && "cursor-pointer hover:bg-surface-100"
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center space-x-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-border">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "hover:bg-surface-50 transition-colors",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm text-surface-900">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-surface-500">
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-surface-500">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{" "}
            of {table.getFilteredRowModel().rows.length} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: table.getPageCount() }).map((_, index) => (
                <Button
                  key={index}
                  variant={table.getState().pagination.pageIndex === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => table.setPageIndex(index)}
                  className="w-8 h-8 p-0"
                >
                  {index + 1}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Column helper functions
export const createColumn = <TData, TValue>(
  id: string,
  header: string,
  accessorKey?: keyof TData,
  cell?: (props: { row: { original: TData } }) => React.ReactNode
): ColumnDef<TData, TValue> => ({
  id,
  header,
  accessorKey: accessorKey as string,
  cell: cell || (({ getValue }) => getValue()),
});

export const createStatusColumn = <TData, TValue>(
  id: string,
  header: string,
  accessorKey: keyof TData,
  statusMap?: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "info" | "emergency" }>
): ColumnDef<TData, TValue> => ({
  id,
  header,
  accessorKey: accessorKey as string,
  cell: ({ getValue }) => {
    const value = getValue() as string;
    const status = statusMap?.[value] || { label: value, variant: "default" as const };
    return <Badge variant={status.variant}>{status.label}</Badge>;
  },
});

export const createDateColumn = <TData, TValue>(
  id: string,
  header: string,
  accessorKey: keyof TData,
  format?: (date: string | Date) => string
): ColumnDef<TData, TValue> => ({
  id,
  header,
  accessorKey: accessorKey as string,
  cell: ({ getValue }) => {
    const value = getValue() as string | Date;
    const date = new Date(value);
    const formatted = format ? format(date) : date.toLocaleDateString();
    return <span>{formatted}</span>;
  },
});

export const createActionsColumn = <TData, TValue>(
  id: string,
  header: string,
  actions: (row: TData) => React.ReactNode
): ColumnDef<TData, TValue> => ({
  id,
  header,
  cell: ({ row }) => actions(row.original),
});

export { DataTable };
