import { memo, useMemo, CSSProperties } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Column {
  key: string;
  label: string;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface VirtualizedTableProps {
  data: any[];
  columns: Column[];
  rowHeight?: number;
  height?: number;
  title?: string;
  onRowClick?: (row: any) => void;
}

// Row component - memoized to prevent unnecessary re-renders
const TableRow = memo<{
  row: any;
  columns: Column[];
  onRowClick?: (row: any) => void;
}>(({ row, columns, onRowClick }) => {
  return (
    <div
      className={`flex items-center border-b hover:bg-muted/50 transition-colors ${
        onRowClick ? 'cursor-pointer' : ''
      }`}
      onClick={() => onRowClick?.(row)}
    >
      {columns.map((column) => (
        <div
          key={column.key}
          className="px-4 py-2 text-sm"
          style={{ width: column.width || `${100 / columns.length}%` }}
        >
          {column.render ? column.render(row[column.key], row) : row[column.key]}
        </div>
      ))}
    </div>
  );
});

TableRow.displayName = 'TableRow';

// Main virtualized table component
export const VirtualizedTable = memo<VirtualizedTableProps>(
  ({ data, columns, rowHeight = 45, height = 500, title, onRowClick }) => {
    // Memoize data to prevent unnecessary recalculations
    const memoizedData = useMemo(() => data, [data]);
    const memoizedColumns = useMemo(() => columns, [columns]);

    return (
      <Card>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="flex items-center border-b bg-muted/50 font-medium">
            {memoizedColumns.map((column) => (
              <div
                key={column.key}
                className="px-4 py-3 text-sm"
                style={{ width: column.width || `${100 / columns.length}%` }}
              >
                {column.label}
              </div>
            ))}
          </div>

          {/* Scrollable Rows */}
          {memoizedData.length > 0 ? (
            <div style={{ maxHeight: height, overflowY: 'auto' }}>
              {memoizedData.map((row, index) => (
                <TableRow
                  key={row.id || index}
                  row={row}
                  columns={memoizedColumns}
                  onRowClick={onRowClick}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
  // Custom comparison - only re-render if data or columns changed
  (prevProps, nextProps) => {
    return (
      JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
      JSON.stringify(prevProps.columns) === JSON.stringify(nextProps.columns) &&
      prevProps.title === nextProps.title
    );
  }
);

VirtualizedTable.displayName = 'VirtualizedTable';

// ==================== INFINITE SCROLL TABLE ====================

interface InfiniteScrollTableProps extends VirtualizedTableProps {
  hasMore: boolean;
  loadMore: () => void;
  isLoading?: boolean;
}

export const InfiniteScrollTable = memo<InfiniteScrollTableProps>(
  ({ data, columns, rowHeight = 45, height = 500, title, onRowClick, hasMore, loadMore, isLoading }) => {
    const memoizedData = useMemo(() => data, [data]);
    const memoizedColumns = useMemo(() => columns, [columns]);

    // Handle scroll to load more
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollHeight - scrollTop <= clientHeight * 1.2 && hasMore && !isLoading) {
        loadMore();
      }
    };

    return (
      <Card>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="flex items-center border-b bg-muted/50 font-medium">
            {memoizedColumns.map((column) => (
              <div
                key={column.key}
                className="px-4 py-3 text-sm"
                style={{ width: column.width || `${100 / columns.length}%` }}
              >
                {column.label}
              </div>
            ))}
          </div>

          {/* Scrollable Rows with Infinite Scroll */}
          {memoizedData.length > 0 ? (
            <>
              <div
                style={{ maxHeight: height, overflowY: 'auto' }}
                onScroll={handleScroll}
              >
                {memoizedData.map((row, index) => (
                  <TableRow
                    key={row.id || index}
                    row={row}
                    columns={memoizedColumns}
                    onRowClick={onRowClick}
                  />
                ))}
                {isLoading && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

InfiniteScrollTable.displayName = 'InfiniteScrollTable';

// ==================== USAGE EXAMPLES ====================

/*
// Basic Usage:
<VirtualizedTable
  data={users}
  columns={[
    { key: 'name', label: 'Name', width: '30%' },
    { key: 'email', label: 'Email', width: '40%' },
    { 
      key: 'status', 
      label: 'Status', 
      width: '30%',
      render: (value) => (
        <span className={value === 'active' ? 'text-green-600' : 'text-red-600'}>
          {value}
        </span>
      )
    },
  ]}
  height={600}
  title="Users"
  onRowClick={(row) => console.log('Clicked:', row)}
/>

// Infinite Scroll Usage:
<InfiniteScrollTable
  data={logs}
  columns={columns}
  height={500}
  hasMore={hasMore}
  loadMore={loadMoreLogs}
  isLoading={isLoadingMore}
/>
*/
