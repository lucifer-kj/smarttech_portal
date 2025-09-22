import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const progressVariants = cva(
  "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
  {
    variants: {
      variant: {
        default: "bg-surface-200",
        success: "bg-success-100",
        warning: "bg-warning-100",
        danger: "bg-danger-100",
        info: "bg-info-100",
      },
      size: {
        default: "h-4",
        sm: "h-2",
        lg: "h-6",
        xl: "h-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const progressBarVariants = cva(
  "h-full w-full flex-1 bg-primary transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "bg-primary-600",
        success: "bg-success-600",
        warning: "bg-warning-600",
        danger: "bg-danger-600",
        info: "bg-info-600",
        gradient: "gradient-primary",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        shimmer: "animate-shimmer",
      },
    },
    defaultVariants: {
      variant: "default",
      animation: "none",
    },
  }
);

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value?: number;
  max?: number;
  showValue?: boolean;
  label?: string;
  indeterminate?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    className, 
    variant, 
    size, 
    value = 0, 
    max = 100, 
    showValue = false, 
    label,
    indeterminate = false,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div className="w-full space-y-2">
        {(label || showValue) && (
          <div className="flex justify-between text-sm">
            {label && <span className="text-surface-700">{label}</span>}
            {showValue && (
              <span className="text-surface-600 font-medium">
                {indeterminate ? "..." : `${Math.round(percentage)}%`}
              </span>
            )}
          </div>
        )}
        <div
          ref={ref}
          className={cn(progressVariants({ variant, size }), className)}
          {...props}
        >
          <div
            className={cn(
              progressBarVariants({ 
                variant: variant === "default" ? "default" : variant,
                animation: indeterminate ? "shimmer" : "none"
              })
            )}
            style={{
              width: indeterminate ? "100%" : `${percentage}%`,
              animation: indeterminate ? "shimmer 2s linear infinite" : undefined,
            }}
          />
        </div>
      </div>
    );
  }
);
Progress.displayName = "Progress";

// Circular Progress Component
export interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  label?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

const CircularProgress = React.forwardRef<HTMLDivElement, CircularProgressProps>(
  ({ 
    className, 
    value = 0, 
    max = 100, 
    size = 120, 
    strokeWidth = 8,
    showValue = false,
    label,
    variant = "default",
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const variantColors = {
      default: "stroke-primary-600",
      success: "stroke-success-600",
      warning: "stroke-warning-600",
      danger: "stroke-danger-600",
      info: "stroke-info-600",
    };

    return (
      <div ref={ref} className={cn("flex flex-col items-center space-y-2", className)} {...props}>
        <div className="relative" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            className="transform -rotate-90"
          >
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="none"
              className="text-surface-200"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={cn("transition-all duration-300 ease-in-out", variantColors[variant])}
            />
          </svg>
          {showValue && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-semibold text-surface-700">
                {Math.round(percentage)}%
              </span>
            </div>
          )}
        </div>
        {label && (
          <span className="text-sm text-surface-600 text-center">{label}</span>
        )}
      </div>
    );
  }
);
CircularProgress.displayName = "CircularProgress";

// Multi-step Progress Component
export interface Step {
  id: string;
  label: string;
  description?: string;
  status: "pending" | "current" | "completed" | "error";
}

export interface MultiStepProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: Step[];
  currentStep?: number;
  orientation?: "horizontal" | "vertical";
}

const MultiStepProgress = React.forwardRef<HTMLDivElement, MultiStepProgressProps>(
  ({ className, steps, currentStep = 0, orientation = "horizontal", ...props }, ref) => {
    const isHorizontal = orientation === "horizontal";

    return (
      <div
        ref={ref}
        className={cn(
          "w-full",
          isHorizontal ? "flex items-center" : "space-y-4",
          className
        )}
        {...props}
      >
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isError = step.status === "error";

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center",
                isHorizontal ? "flex-1" : "flex-col space-y-2"
              )}
            >
              {/* Step Circle */}
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200",
                  isCompleted && !isError && "bg-success-600 border-success-600 text-white",
                  isCurrent && !isError && "bg-primary-600 border-primary-600 text-white",
                  isError && "bg-danger-600 border-danger-600 text-white",
                  !isCompleted && !isCurrent && !isError && "bg-white border-surface-300 text-surface-500"
                )}
              >
                {isCompleted && !isError ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : isError ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>

              {/* Step Content */}
              <div className={cn(isHorizontal ? "ml-3" : "text-center")}>
                <div className={cn(
                  "text-sm font-medium",
                  isCompleted && !isError && "text-success-700",
                  isCurrent && !isError && "text-primary-700",
                  isError && "text-danger-700",
                  !isCompleted && !isCurrent && !isError && "text-surface-500"
                )}>
                  {step.label}
                </div>
                {step.description && (
                  <div className="text-xs text-surface-500 mt-1">
                    {step.description}
                  </div>
                )}
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    isHorizontal ? "flex-1 h-0.5 mx-4" : "w-0.5 h-8 mt-2",
                    isCompleted && !isError ? "bg-success-600" : "bg-surface-300"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }
);
MultiStepProgress.displayName = "MultiStepProgress";

export { Progress, CircularProgress, MultiStepProgress, progressVariants };
