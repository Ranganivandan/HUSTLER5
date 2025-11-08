import { memo, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Chart color constants (defined outside component to prevent recreation)
const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
};

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Chart configuration constants
const CHART_CONFIG = {
  margin: { top: 5, right: 30, left: 20, bottom: 5 },
  animationDuration: 300,
  strokeWidth: 2,
};

// ==================== OPTIMIZED LINE CHART ====================

interface OptimizedLineChartProps {
  data: any[];
  dataKey: string;
  xAxisKey: string;
  color?: string;
  height?: number;
}

export const OptimizedLineChart = memo<OptimizedLineChartProps>(
  ({ data, dataKey, xAxisKey, color = CHART_COLORS.primary, height = 300 }) => {
    // Memoize chart data to prevent unnecessary recalculations
    const chartData = useMemo(() => data, [data]);

    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={CHART_CONFIG.margin}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={CHART_CONFIG.strokeWidth}
            animationDuration={CHART_CONFIG.animationDuration}
            dot={false} // Disable dots for better performance
          />
        </LineChart>
      </ResponsiveContainer>
    );
  },
  // Custom comparison function - only re-render if data actually changed
  (prevProps, nextProps) => {
    return (
      JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
      prevProps.dataKey === nextProps.dataKey &&
      prevProps.xAxisKey === nextProps.xAxisKey
    );
  }
);

OptimizedLineChart.displayName = 'OptimizedLineChart';

// ==================== OPTIMIZED BAR CHART ====================

interface OptimizedBarChartProps {
  data: any[];
  dataKey: string;
  xAxisKey: string;
  color?: string;
  height?: number;
}

export const OptimizedBarChart = memo<OptimizedBarChartProps>(
  ({ data, dataKey, xAxisKey, color = CHART_COLORS.primary, height = 300 }) => {
    const chartData = useMemo(() => data, [data]);

    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={CHART_CONFIG.margin}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar
            dataKey={dataKey}
            fill={color}
            animationDuration={CHART_CONFIG.animationDuration}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  },
  (prevProps, nextProps) => {
    return (
      JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
      prevProps.dataKey === nextProps.dataKey
    );
  }
);

OptimizedBarChart.displayName = 'OptimizedBarChart';

// ==================== OPTIMIZED PIE CHART ====================

interface OptimizedPieChartProps {
  data: any[];
  dataKey: string;
  nameKey: string;
  height?: number;
}

export const OptimizedPieChart = memo<OptimizedPieChartProps>(
  ({ data, dataKey, nameKey, height = 300 }) => {
    const chartData = useMemo(() => data, [data]);

    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
            animationDuration={CHART_CONFIG.animationDuration}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  },
  (prevProps, nextProps) => {
    return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
  }
);

OptimizedPieChart.displayName = 'OptimizedPieChart';

// ==================== MULTI-LINE CHART ====================

interface MultiLineChartProps {
  data: any[];
  lines: Array<{ dataKey: string; color: string; name: string }>;
  xAxisKey: string;
  height?: number;
}

export const OptimizedMultiLineChart = memo<MultiLineChartProps>(
  ({ data, lines, xAxisKey, height = 300 }) => {
    const chartData = useMemo(() => data, [data]);
    const lineConfigs = useMemo(() => lines, [lines]);

    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={CHART_CONFIG.margin}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {lineConfigs.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              name={line.name}
              strokeWidth={CHART_CONFIG.strokeWidth}
              animationDuration={CHART_CONFIG.animationDuration}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  },
  (prevProps, nextProps) => {
    return (
      JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
      JSON.stringify(prevProps.lines) === JSON.stringify(nextProps.lines)
    );
  }
);

OptimizedMultiLineChart.displayName = 'OptimizedMultiLineChart';

// ==================== CHART WRAPPER WITH LAZY RENDERING ====================

interface LazyChartWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
}

export const LazyChartWrapper = memo<LazyChartWrapperProps>(
  ({ children, fallback = <div className="h-64 animate-pulse bg-muted rounded-lg" />, rootMargin = '100px' }) => {
    // This will be enhanced with intersection observer
    return <>{children}</>;
  }
);

LazyChartWrapper.displayName = 'LazyChartWrapper';

// Export chart colors for use in other components
export { CHART_COLORS, PIE_COLORS };
