import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary-600 text-primary-foreground hover:bg-primary-700",
        secondary: "border-transparent bg-secondary-500 text-secondary-foreground hover:bg-secondary-600",
        destructive: "border-transparent bg-danger-600 text-danger-foreground hover:bg-danger-700",
        success: "border-transparent bg-success-600 text-success-foreground hover:bg-success-700",
        warning: "border-transparent bg-warning-600 text-warning-foreground hover:bg-warning-700",
        info: "border-transparent bg-info-600 text-info-foreground hover:bg-info-700",
        emergency: "border-transparent bg-emergency-600 text-emergency-foreground hover:bg-emergency-700 animate-pulse-fast",
        outline: "text-foreground border-border",
        ghost: "text-foreground hover:bg-surface-100",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  dot?: boolean;
}

function Badge({ className, variant, size, leftIcon, rightIcon, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && <div className="mr-1 h-1.5 w-1.5 rounded-full bg-current" />}
      {leftIcon && <span className="mr-1">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-1">{rightIcon}</span>}
    </div>
  );
}

// Status Badge Component
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: "pending" | "approved" | "rejected" | "in-progress" | "completed" | "emergency" | "draft" | "published";
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, className, ...props }, _ref) => {
    const statusVariants = {
      pending: "warning",
      approved: "success",
      rejected: "destructive",
      "in-progress": "info",
      completed: "success",
      emergency: "emergency",
      draft: "secondary",
      published: "success",
    } as const;

    return (
      <Badge
        variant={statusVariants[status]}
        className={cn(className)}
        {...props}
      >
        {status.replace("-", " ")}
      </Badge>
    );
  }
);
StatusBadge.displayName = "StatusBadge";

// Notification Badge Component
export interface NotificationBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
  count: number;
  max?: number;
  showZero?: boolean;
}

const NotificationBadge = React.forwardRef<HTMLDivElement, NotificationBadgeProps>(
  ({ count, max = 99, showZero = false, className, ...props }, _ref) => {
    if (count === 0 && !showZero) return null;

    const displayCount = count > max ? `${max}+` : count.toString();

    return (
      <Badge
        variant="destructive"
        size="sm"
        className={cn("min-w-[20px] h-5 flex items-center justify-center", className)}
        {...props}
      >
        {displayCount}
      </Badge>
    );
  }
);
NotificationBadge.displayName = "NotificationBadge";

// Priority Badge Component
export interface PriorityBadgeProps extends Omit<BadgeProps, 'variant'> {
  priority: "low" | "medium" | "high" | "urgent" | "critical";
}

const PriorityBadge = React.forwardRef<HTMLDivElement, PriorityBadgeProps>(
  ({ priority, className, ...props }, _ref) => {
    const priorityVariants = {
      low: "secondary",
      medium: "info",
      high: "warning",
      urgent: "destructive",
      critical: "emergency",
    } as const;

    const priorityIcons = {
      low: "↓",
      medium: "→",
      high: "↑",
      urgent: "⚠",
      critical: "🚨",
    };

    return (
      <Badge
        variant={priorityVariants[priority]}
        className={cn(className)}
        {...props}
      >
        <span className="mr-1">{priorityIcons[priority]}</span>
        {priority}
      </Badge>
    );
  }
);
PriorityBadge.displayName = "PriorityBadge";

export { Badge, StatusBadge, NotificationBadge, PriorityBadge, badgeVariants };
