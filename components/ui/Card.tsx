import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const cardVariants = cva(
  "rounded-2xl border bg-white shadow-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-border hover:shadow-md",
        elevated: "border-border shadow-lg hover:shadow-xl",
        interactive: "border-border shadow-md hover:shadow-lg hover:border-primary-300 cursor-pointer",
        emergency: "border-red-200 bg-red-50 shadow-md hover:shadow-lg hover:border-red-300",
        success: "border-green-200 bg-green-50 shadow-md hover:shadow-lg hover:border-green-300",
        warning: "border-yellow-200 bg-yellow-50 shadow-md hover:shadow-lg hover:border-yellow-300",
        info: "border-blue-200 bg-blue-50 shadow-md hover:shadow-lg hover:border-blue-300",
        glass: "glass border-white/20 shadow-lg hover:shadow-xl",
        gradient: "border-border shadow-lg hover:shadow-xl gradient-primary text-white",
      },
      padding: {
        none: "",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
      animation: {
        none: "",
        hover: "hover:-translate-y-1",
        bounce: "hover:animate-bounce",
        pulse: "hover:animate-pulse",
        glow: "hover:animate-glow",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
      animation: "none",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, animation, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, animation, className }))}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl leading-none font-semibold tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-surface-500 text-sm", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// Enhanced Card Components
const CardBadge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "success" | "warning" | "danger" | "info" | "emergency";
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variantClasses = {
    default: "bg-surface-100 text-surface-800",
    success: "bg-success-100 text-success-800",
    warning: "bg-warning-100 text-warning-800",
    danger: "bg-danger-100 text-danger-800",
    info: "bg-info-100 text-info-800",
    emergency: "bg-emergency-100 text-emergency-800 animate-pulse-fast",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
});
CardBadge.displayName = "CardBadge";

const CardStatus = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    status: "pending" | "approved" | "rejected" | "in-progress" | "completed" | "emergency";
  }
>(({ className, status, ...props }, ref) => {
  const statusClasses = {
    pending: "status-pending",
    approved: "status-approved",
    rejected: "status-rejected",
    "in-progress": "bg-blue-100 text-blue-800 border border-blue-200",
    completed: "bg-green-100 text-green-800 border border-green-200",
    emergency: "status-emergency",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
        statusClasses[status],
        className
      )}
      {...props}
    />
  );
});
CardStatus.displayName = "CardStatus";

const CardAction = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-end space-x-2 p-6 pt-0", className)}
    {...props}
  />
));
CardAction.displayName = "CardAction";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardBadge,
  CardStatus,
  CardAction,
  cardVariants,
};
