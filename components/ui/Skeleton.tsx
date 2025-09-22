import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const skeletonVariants = cva(
  "animate-pulse rounded-md bg-surface-200",
  {
    variants: {
      variant: {
        default: "bg-surface-200",
        shimmer: "bg-gradient-to-r from-surface-200 via-surface-100 to-surface-200 animate-shimmer",
        pulse: "bg-surface-200 animate-pulse",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  width?: string | number;
  height?: string | number;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, width, height, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant }), className)}
        style={{
          width: typeof width === "number" ? `${width}px` : width,
          height: typeof height === "number" ? `${height}px` : height,
          ...style,
        }}
        {...props}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

// Text Skeleton Component
export interface TextSkeletonProps extends Omit<SkeletonProps, 'height'> {
  lines?: number;
  lineHeight?: number;
  spacing?: number;
}

const TextSkeleton = React.forwardRef<HTMLDivElement, TextSkeletonProps>(
  ({ lines = 1, lineHeight = 20, spacing = 8, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            height={lineHeight}
            style={{ marginBottom: index < lines - 1 ? spacing : 0 }}
          />
        ))}
      </div>
    );
  }
);
TextSkeleton.displayName = "TextSkeleton";

// Card Skeleton Component
export interface CardSkeletonProps extends Omit<SkeletonProps, 'width' | 'height'> {
  showAvatar?: boolean;
  showActions?: boolean;
  lines?: number;
}

const CardSkeleton = React.forwardRef<HTMLDivElement, CardSkeletonProps>(
  ({ showAvatar = false, showActions = false, lines = 3, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("p-6 space-y-4", className)}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center space-x-4">
          {showAvatar && <Skeleton className="h-12 w-12 rounded-full" />}
          <div className="space-y-2 flex-1">
            <Skeleton height={20} width="60%" />
            <Skeleton height={16} width="40%" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton
              key={index}
              height={16}
              width={index === lines - 1 ? "80%" : "100%"}
            />
          ))}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex space-x-2 pt-4">
            <Skeleton height={36} width={80} />
            <Skeleton height={36} width={80} />
          </div>
        )}
      </div>
    );
  }
);
CardSkeleton.displayName = "CardSkeleton";

// Table Skeleton Component
export interface TableSkeletonProps extends Omit<SkeletonProps, 'width' | 'height'> {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

const TableSkeleton = React.forwardRef<HTMLDivElement, TableSkeletonProps>(
  ({ rows = 5, columns = 4, showHeader = true, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {/* Header */}
        {showHeader && (
          <div className="flex space-x-4 pb-4 border-b border-surface-200">
            {Array.from({ length: columns }).map((_, index) => (
              <Skeleton key={index} height={20} width="100%" />
            ))}
          </div>
        )}

        {/* Rows */}
        <div className="space-y-4 pt-4">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} height={16} width="100%" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
);
TableSkeleton.displayName = "TableSkeleton";

// List Skeleton Component
export interface ListSkeletonProps extends Omit<SkeletonProps, 'width' | 'height'> {
  items?: number;
  showAvatar?: boolean;
  showSubtitle?: boolean;
}

const ListSkeleton = React.forwardRef<HTMLDivElement, ListSkeletonProps>(
  ({ items = 5, showAvatar = false, showSubtitle = true, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        {Array.from({ length: items }).map((_, index) => (
          <div key={index} className="flex items-center space-x-4">
            {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
            <div className="space-y-2 flex-1">
              <Skeleton height={16} width="70%" />
              {showSubtitle && <Skeleton height={14} width="50%" />}
            </div>
          </div>
        ))}
      </div>
    );
  }
);
ListSkeleton.displayName = "ListSkeleton";

// Chart Skeleton Component
export interface ChartSkeletonProps extends Omit<SkeletonProps, 'width' | 'height'> {
  type?: "line" | "bar" | "pie" | "area";
  height?: number;
}

const ChartSkeleton = React.forwardRef<HTMLDivElement, ChartSkeletonProps>(
  ({ type = "line", height = 300, className, ...props }, ref) => {
    const renderChartSkeleton = () => {
      switch (type) {
        case "line":
          return (
            <div className="relative h-full">
              {/* Y-axis */}
              <div className="absolute left-0 top-0 bottom-0 w-8 space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} height={1} width="100%" />
                ))}
              </div>
              {/* X-axis */}
              <div className="absolute bottom-0 left-8 right-0 h-8 flex justify-between">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} height={1} width="15%" />
                ))}
              </div>
              {/* Line */}
              <div className="absolute left-8 right-0 top-0 bottom-8">
                <Skeleton height={2} width="100%" className="rounded-full" />
              </div>
            </div>
          );
        case "bar":
          return (
            <div className="flex items-end justify-between h-full space-x-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton
                  key={index}
                  height={`${Math.random() * 60 + 20}%`}
                  width="15%"
                  className="rounded-t"
                />
              ))}
            </div>
          );
        case "pie":
          return (
            <div className="flex items-center justify-center h-full">
              <Skeleton className="h-48 w-48 rounded-full" />
            </div>
          );
        case "area":
          return (
            <div className="relative h-full">
              <Skeleton height="100%" width="100%" className="rounded" />
            </div>
          );
        default:
          return <Skeleton height="100%" width="100%" />;
      }
    };

    return (
      <div
        ref={ref}
        className={cn("w-full", className)}
        style={{ height }}
        {...props}
      >
        {renderChartSkeleton()}
      </div>
    );
  }
);
ChartSkeleton.displayName = "ChartSkeleton";

export {
  Skeleton,
  TextSkeleton,
  CardSkeleton,
  TableSkeleton,
  ListSkeleton,
  ChartSkeleton,
  skeletonVariants,
};