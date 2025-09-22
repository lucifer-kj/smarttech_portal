import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:-translate-y-0.5",
        destructive: "bg-danger-600 text-white hover:bg-danger-700 hover:shadow-lg hover:-translate-y-0.5",
        outline: "border border-border bg-transparent hover:bg-surface-50 hover:border-primary-300",
        secondary: "bg-secondary-500 text-white hover:bg-secondary-600 hover:shadow-lg hover:-translate-y-0.5",
        success: "bg-success-600 text-white hover:bg-success-700 hover:shadow-lg hover:-translate-y-0.5",
        warning: "bg-warning-600 text-white hover:bg-warning-700 hover:shadow-lg hover:-translate-y-0.5",
        info: "bg-info-600 text-white hover:bg-info-700 hover:shadow-lg hover:-translate-y-0.5",
        emergency: "bg-emergency-600 text-white hover:bg-emergency-700 hover:shadow-lg hover:-translate-y-0.5 animate-pulse-fast",
        ghost: "hover:bg-surface-100 hover:text-surface-900",
        link: "text-primary-600 underline-offset-4 hover:underline",
        gradient: "gradient-primary text-white hover:shadow-lg hover:-translate-y-0.5",
        glass: "glass text-surface-900 hover:bg-white/20",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        xl: "h-12 rounded-lg px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
      animation: {
        none: "",
        bounce: "hover:animate-bounce",
        pulse: "hover:animate-pulse",
        wiggle: "hover:animate-wiggle",
        float: "hover:animate-float",
        glow: "hover:animate-glow",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, animation, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, animation, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
