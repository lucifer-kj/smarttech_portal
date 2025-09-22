'use client';

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from "lucide-react";

const statsCardVariants = cva(
  "p-6 bg-white rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-border",
        success: "border-success-200 bg-success-50",
        warning: "border-warning-200 bg-warning-50",
        danger: "border-danger-200 bg-danger-50",
        info: "border-info-200 bg-info-50",
        emergency: "border-emergency-200 bg-emergency-50",
      },
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface StatsCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statsCardVariants> {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: {
    value: number;
    type: "increase" | "decrease" | "neutral";
    period?: string;
  };
  icon?: React.ReactNode;
  trend?: {
    data: number[];
    type: "line" | "bar";
  };
  loading?: boolean;
  onClick?: () => void;
}

const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({ 
    className, 
    variant, 
    size, 
    title, 
    value, 
    subtitle, 
    change, 
    icon, 
    trend,
    loading = false,
    onClick,
    ...props 
  }, ref) => {
    const getChangeIcon = () => {
      if (!change) return null;
      
      switch (change.type) {
        case "increase":
          return <TrendingUp className="h-4 w-4" />;
        case "decrease":
          return <TrendingDown className="h-4 w-4" />;
        case "neutral":
          return <Minus className="h-4 w-4" />;
        default:
          return null;
      }
    };

    const getChangeColor = () => {
      if (!change) return "text-surface-600";
      
      switch (change.type) {
        case "increase":
          return "text-success-600";
        case "decrease":
          return "text-danger-600";
        case "neutral":
          return "text-surface-600";
        default:
          return "text-surface-600";
      }
    };

    if (loading) {
      return (
        <div
          ref={ref}
          className={cn(statsCardVariants({ variant, size }), className)}
          {...props}
        >
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-surface-200 rounded w-1/2"></div>
            <div className="h-8 bg-surface-200 rounded w-3/4"></div>
            <div className="h-3 bg-surface-200 rounded w-1/3"></div>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          statsCardVariants({ variant, size }),
          onClick && "cursor-pointer hover:scale-105",
          className
        )}
        onClick={onClick}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-surface-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-surface-900 mb-2">{value}</p>
            {subtitle && (
              <p className="text-sm text-surface-500 mb-2">{subtitle}</p>
            )}
            {change && (
              <div className="flex items-center space-x-1">
                <span className={cn("text-sm font-medium flex items-center", getChangeColor())}>
                  {getChangeIcon()}
                  <span className="ml-1">
                    {change.type === "increase" ? "+" : change.type === "decrease" ? "-" : ""}
                    {Math.abs(change.value)}%
                  </span>
                </span>
                {change.period && (
                  <span className="text-sm text-surface-500">vs {change.period}</span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className="p-3 rounded-lg bg-surface-100 text-surface-600">
              {icon}
            </div>
          )}
        </div>
        {trend && (
          <div className="mt-4 h-16">
            <div className="flex items-end justify-between h-full space-x-1">
              {trend.data.map((point, index) => (
                <div
                  key={index}
                  className={cn(
                    "bg-primary-200 rounded-t transition-all duration-300",
                    trend.type === "bar" ? "w-full" : "w-1"
                  )}
                  style={{
                    height: `${(point / Math.max(...trend.data)) * 100}%`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);
StatsCard.displayName = "StatsCard";

// Stats Grid Component
export interface StatsGridProps extends React.HTMLAttributes<HTMLDivElement> {
  stats: StatsCardProps[];
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  loading?: boolean;
}

const StatsGrid = React.forwardRef<HTMLDivElement, StatsGridProps>(
  ({ className, stats, columns = 4, loading = false, ...props }, ref) => {
    const gridCols = {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
      5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
      6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
    };

    if (loading) {
      return (
        <div
          ref={ref}
          className={cn("grid gap-6", gridCols[columns], className)}
          {...props}
        >
          {Array.from({ length: columns }).map((_, index) => (
            <StatsCard key={index} loading={true} title="" value="" />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn("grid gap-6", gridCols[columns], className)}
        {...props}
      >
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>
    );
  }
);
StatsGrid.displayName = "StatsGrid";

// KPI Card Component
export interface KPICardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  target?: string | number;
  progress?: number;
  status?: "on-track" | "behind" | "ahead" | "at-risk";
  icon?: React.ReactNode;
  description?: string;
}

const KPICard = React.forwardRef<HTMLDivElement, KPICardProps>(
  ({ 
    className, 
    title, 
    value, 
    target, 
    progress, 
    status, 
    icon, 
    description,
    ...props 
  }, ref) => {
    const getStatusColor = () => {
      switch (status) {
        case "on-track":
          return "text-success-600 bg-success-100";
        case "behind":
          return "text-danger-600 bg-danger-100";
        case "ahead":
          return "text-info-600 bg-info-100";
        case "at-risk":
          return "text-warning-600 bg-warning-100";
        default:
          return "text-surface-600 bg-surface-100";
      }
    };

    const getStatusIcon = () => {
      switch (status) {
        case "on-track":
          return <ArrowUpRight className="h-4 w-4" />;
        case "behind":
          return <ArrowDownRight className="h-4 w-4" />;
        case "ahead":
          return <ArrowUpRight className="h-4 w-4" />;
        case "at-risk":
          return <TrendingDown className="h-4 w-4" />;
        default:
          return null;
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "p-6 bg-white rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-200",
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-surface-600 mb-1">{title}</h3>
            <p className="text-3xl font-bold text-surface-900 mb-2">{value}</p>
            {target && (
              <p className="text-sm text-surface-500">Target: {target}</p>
            )}
          </div>
          {icon && (
            <div className="p-3 rounded-lg bg-surface-100 text-surface-600">
              {icon}
            </div>
          )}
        </div>

        {progress !== undefined && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-surface-600">Progress</span>
              <span className="text-sm font-medium text-surface-900">{progress}%</span>
            </div>
            <div className="w-full bg-surface-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {status && (
          <div className="flex items-center justify-between">
            <div className={cn("flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium", getStatusColor())}>
              {getStatusIcon()}
              <span>{status.replace("-", " ")}</span>
            </div>
            {description && (
              <p className="text-sm text-surface-500">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);
KPICard.displayName = "KPICard";

export { StatsCard, StatsGrid, KPICard, statsCardVariants };
