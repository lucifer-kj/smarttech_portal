'use client';

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Scatter,
  ScatterChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

// Define chart data point interface
export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}

export interface ChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: ChartDataPoint[];
  type: "line" | "area" | "bar" | "pie" | "composed" | "scatter" | "radar";
  width?: number | string;
  height?: number | string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  colors?: string[];
  className?: string;
}

const defaultColors = [
  '#0F6BFF', // primary-600
  '#00B894', // accent-600
  '#FF9F43', // warn-600
  '#FF4757', // danger-600
  '#8B5CF6', // analytics-500
  '#6366F1', // secondary-500
  '#22C55E', // success-500
  '#F59E0B', // warning-500
];

const Chart = React.forwardRef<HTMLDivElement, ChartProps>(
  ({ 
    className, 
    data, 
    type, 
    width = "100%", 
    height = 300, 
    showGrid = true,
    showLegend = true,
    showTooltip = true,
    colors = defaultColors,
    ...props 
  }, ref) => {
    const renderChart = () => {
      const numericHeight = typeof height === 'number' ? height : 300
      const numericWidth = typeof width === 'number' ? width : undefined

      const commonProps = {
        data,
        ...(numericWidth !== undefined ? { width: numericWidth } : {}),
        height: numericHeight,
        margin: { top: 20, right: 30, left: 20, bottom: 5 },
      } as const

      switch (type) {
        case "line":
          return (
            <LineChart {...commonProps}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              {showTooltip && <Tooltip />}
              {showLegend && <Legend />}
              {Object.keys(data[0] || {}).filter(key => key !== 'name').map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: colors[index % colors.length], strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          );

        case "area":
          return (
            <AreaChart {...commonProps}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              {showTooltip && <Tooltip />}
              {showLegend && <Legend />}
              {Object.keys(data[0] || {}).filter(key => key !== 'name').map((key, index) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stackId="1"
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          );

        case "bar":
          return (
            <BarChart {...commonProps}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              {showTooltip && <Tooltip />}
              {showLegend && <Legend />}
              {Object.keys(data[0] || {}).filter(key => key !== 'name').map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[index % colors.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          );

        case "pie":
          const pieData = Object.keys(data[0] || {}).map((key, index) => ({
            name: key,
            value: data[0][key],
            color: colors[index % colors.length],
          }));

          return (
            <PieChart width={typeof width === 'number' ? width : undefined} height={typeof height === 'number' ? height : 300}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={true}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              {showTooltip && <Tooltip />}
              {showLegend && <Legend />}
            </PieChart>
          );

        case "composed":
          return (
            <ComposedChart {...commonProps}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              {showTooltip && <Tooltip />}
              {showLegend && <Legend />}
              {Object.keys(data[0] || {}).filter(key => key !== 'name').map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[index % colors.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </ComposedChart>
          );

        case "scatter":
          return (
            <ScatterChart {...commonProps}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
              <XAxis dataKey="x" stroke="#64748b" fontSize={12} />
              <YAxis dataKey="y" stroke="#64748b" fontSize={12} />
              {showTooltip && <Tooltip />}
              <Scatter data={data} fill={colors[0]} />
            </ScatterChart>
          );

        case "radar":
          return (
            <RadarChart {...commonProps}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis />
              {Object.keys(data[0] || {}).filter(key => key !== 'name').map((key, index) => (
                <Radar
                  key={key}
                  name={key}
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.6}
                />
              ))}
              {showLegend && <Legend />}
            </RadarChart>
          );

        default:
          return <div />;
      }
    };

    return (
      <div
        ref={ref}
        className={cn("w-full", className)}
        {...props}
      >
        <ResponsiveContainer width={width} height={height}>
          {renderChart() ?? <></>}
        </ResponsiveContainer>
      </div>
    );
  }
);
Chart.displayName = "Chart";

// Metric Card Component
export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease" | "neutral";
  };
  icon?: React.ReactNode;
  trend?: {
    data: ChartDataPoint[];
    type: "line" | "area";
  };
  color?: "primary" | "success" | "warning" | "danger" | "info";
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ 
    className, 
    title, 
    value, 
    change, 
    icon, 
    trend,
    color = "primary",
    ...props 
  }, ref) => {
    const colorClasses = {
      primary: "text-primary-600",
      success: "text-success-600",
      warning: "text-warning-600",
      danger: "text-danger-600",
      info: "text-info-600",
    };

    const changeClasses = {
      increase: "text-success-600",
      decrease: "text-danger-600",
      neutral: "text-surface-600",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "p-6 bg-white rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow",
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-surface-600">{title}</p>
            <p className="text-2xl font-bold text-surface-900 mt-1">{value}</p>
            {change && (
              <div className="flex items-center mt-2">
                <span className={cn("text-sm font-medium", changeClasses[change.type])}>
                  {change.type === "increase" ? "+" : change.type === "decrease" ? "-" : ""}
                  {Math.abs(change.value)}%
                </span>
                <span className="text-sm text-surface-500 ml-1">vs last period</span>
              </div>
            )}
          </div>
          {icon && (
            <div className={cn("p-3 rounded-lg bg-surface-50", colorClasses[color])}>
              {icon}
            </div>
          )}
        </div>
        {trend && (
          <div className="mt-4 h-16">
            <Chart
              data={trend.data}
              type={trend.type}
              height={64}
              showGrid={false}
              showLegend={false}
              showTooltip={false}
              colors={[color === "primary" ? "#0F6BFF" : color === "success" ? "#22C55E" : color === "warning" ? "#F59E0B" : color === "danger" ? "#EF4444" : "#3B82F6"]}
            />
          </div>
        )}
      </div>
    );
  }
);
MetricCard.displayName = "MetricCard";

// Chart Container Component
export interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string;
  empty?: boolean;
  emptyMessage?: string;
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ 
    className, 
    title, 
    description, 
    actions, 
    loading = false,
    error,
    empty = false,
    emptyMessage = "No data available",
    children,
    ...props 
  }, ref) => {
    if (loading) {
      return (
        <div
          ref={ref}
          className={cn("p-6 bg-white rounded-lg border border-border shadow-sm", className)}
          {...props}
        >
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-surface-200 rounded w-1/4"></div>
            <div className="h-64 bg-surface-200 rounded"></div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div
          ref={ref}
          className={cn("p-6 bg-white rounded-lg border border-border shadow-sm", className)}
          {...props}
        >
          <div className="text-center py-8">
            <div className="text-danger-600 text-sm">{error}</div>
          </div>
        </div>
      );
    }

    if (empty) {
      return (
        <div
          ref={ref}
          className={cn("p-6 bg-white rounded-lg border border-border shadow-sm", className)}
          {...props}
        >
          <div className="text-center py-8">
            <div className="text-surface-500 text-sm">{emptyMessage}</div>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn("bg-white rounded-lg border border-border shadow-sm", className)}
        {...props}
      >
        {(title || description || actions) && (
          <div className="p-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                {title && <h3 className="text-lg font-semibold text-surface-900">{title}</h3>}
                {description && <p className="text-sm text-surface-600 mt-1">{description}</p>}
              </div>
              {actions && <div className="flex items-center space-x-2">{actions}</div>}
            </div>
          </div>
        )}
        <div className="p-6">
          {children}
        </div>
      </div>
    );
  }
);
ChartContainer.displayName = "ChartContainer";

export { Chart, MetricCard, ChartContainer };
