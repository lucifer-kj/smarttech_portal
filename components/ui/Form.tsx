'use client';

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

const formFieldVariants = cva(
  "space-y-2",
  {
    variants: {
      variant: {
        default: "",
        error: "",
        success: "",
        warning: "",
        info: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface FormFieldProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof formFieldVariants> {
  label?: string;
  description?: string;
  error?: string;
  success?: string;
  warning?: string;
  info?: string;
  required?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ 
    className, 
    variant, 
    label, 
    description, 
    error, 
    success, 
    warning, 
    info, 
    required, 
    disabled,
    children,
    ...props 
  }, ref) => {
    const getStatusIcon = () => {
      if (error) return <AlertCircle className="h-4 w-4 text-danger-600" />;
      if (success) return <CheckCircle className="h-4 w-4 text-success-600" />;
      if (warning) return <AlertTriangle className="h-4 w-4 text-warning-600" />;
      if (info) return <Info className="h-4 w-4 text-info-600" />;
      return null;
    };

    const getStatusMessage = () => {
      if (error) return error;
      if (success) return success;
      if (warning) return warning;
      if (info) return info;
      return null;
    };

    const getStatusColor = () => {
      if (error) return "text-danger-600";
      if (success) return "text-success-600";
      if (warning) return "text-warning-600";
      if (info) return "text-info-600";
      return "text-surface-600";
    };

    return (
      <div
        ref={ref}
        className={cn(formFieldVariants({ variant }), className)}
        {...props}
      >
        {label && (
          <label className={cn(
            "block text-sm font-medium",
            disabled ? "text-surface-400" : "text-surface-700"
          )}>
            {label}
            {required && <span className="text-danger-600 ml-1">*</span>}
          </label>
        )}
        
        {description && !error && !success && !warning && !info && (
          <p className="text-sm text-surface-500">{description}</p>
        )}

        <div className="relative">
          {React.cloneElement(children as React.ReactElement, {
            disabled,
            className: cn(
              (children as React.ReactElement).props.className,
              error && "border-danger-300 focus:border-danger-500 focus:ring-danger-500",
              success && "border-success-300 focus:border-success-500 focus:ring-success-500",
              warning && "border-warning-300 focus:border-warning-500 focus:ring-warning-500",
              info && "border-info-300 focus:border-info-500 focus:ring-info-500"
            )
          })}
        </div>

        {(error || success || warning || info) && (
          <div className={cn("flex items-center space-x-2 text-sm", getStatusColor())}>
            {getStatusIcon()}
            <span>{getStatusMessage()}</span>
          </div>
        )}
      </div>
    );
  }
);
FormField.displayName = "FormField";

// Select Component
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  searchable?: boolean;
  multiple?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, searchable = false, multiple = false, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [selectedValues, setSelectedValues] = React.useState<string[]>([]);

    const filteredOptions = options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (value: string) => {
      if (multiple) {
        setSelectedValues(prev => 
          prev.includes(value) 
            ? prev.filter(v => v !== value)
            : [...prev, value]
        );
      } else {
        setSelectedValues([value]);
        setIsOpen(false);
      }
    };

    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          multiple={multiple}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);
Select.displayName = "Select";

// Textarea Component
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  resize?: "none" | "vertical" | "horizontal" | "both";
  showCount?: boolean;
  maxLength?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, resize = "vertical", showCount = false, maxLength, ...props }, ref) => {
    const [value, setValue] = React.useState(props.value || props.defaultValue || "");

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
      props.onChange?.(e);
    };

    const resizeClasses = {
      none: "resize-none",
      vertical: "resize-y",
      horizontal: "resize-x",
      both: "resize",
    };

    return (
      <div className="relative">
        <textarea
          ref={ref}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            resizeClasses[resize],
            className
          )}
          maxLength={maxLength}
          value={value}
          onChange={handleChange}
          {...props}
        />
        {showCount && maxLength && (
          <div className="absolute bottom-2 right-2 text-xs text-surface-500">
            {String(value).length}/{maxLength}
          </div>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

// Checkbox Component
export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, indeterminate = false, ...props }, ref) => {
    const checkboxRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    return (
      <div className="flex items-start space-x-3">
        <div className="flex items-center h-5">
          <input
            ref={ref || checkboxRef}
            type="checkbox"
            className={cn(
              "h-4 w-4 rounded border-input text-primary-600 focus:ring-primary-500 focus:ring-offset-2",
              className
            )}
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="text-sm">
            {label && (
              <label className="font-medium text-surface-700 cursor-pointer">
                {label}
              </label>
            )}
            {description && (
              <p className="text-surface-500 mt-1">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

// Radio Group Component
export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  options: { value: string; label: string; description?: string; disabled?: boolean }[];
  value?: string;
  onChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, options, value, onChange, orientation = "vertical", ...props }, ref) => {
    const handleChange = (optionValue: string) => {
      onChange?.(optionValue);
    };

    return (
      <div
        ref={ref}
        className={cn(
          "space-y-2",
          orientation === "horizontal" && "flex flex-wrap gap-4",
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <div
            key={option.value}
            className={cn(
              "flex items-start space-x-3",
              orientation === "horizontal" && "flex-col space-x-0 space-y-2"
            )}
          >
            <div className="flex items-center h-5">
              <input
                type="radio"
                value={option.value}
                checked={value === option.value}
                onChange={() => handleChange(option.value)}
                disabled={option.disabled}
                className="h-4 w-4 border-input text-primary-600 focus:ring-primary-500 focus:ring-offset-2"
              />
            </div>
            <div className="text-sm">
              <label className={cn(
                "font-medium cursor-pointer",
                option.disabled ? "text-surface-400" : "text-surface-700"
              )}>
                {option.label}
              </label>
              {option.description && (
                <p className={cn(
                  "mt-1",
                  option.disabled ? "text-surface-400" : "text-surface-500"
                )}>
                  {option.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }
);
RadioGroup.displayName = "RadioGroup";

// Switch Component
export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  size?: "sm" | "default" | "lg";
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, size = "default", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-7",
      default: "h-6 w-11",
      lg: "h-8 w-14",
    };

    const thumbSizeClasses = {
      sm: "h-3 w-3",
      default: "h-5 w-5",
      lg: "h-7 w-7",
    };

    return (
      <div className="flex items-start space-x-3">
        <div className="flex items-center h-5">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              ref={ref}
              type="checkbox"
              className="sr-only"
              {...props}
            />
            <div className={cn(
              "relative rounded-full transition-colors duration-200 ease-in-out",
              sizeClasses[size],
              props.checked ? "bg-primary-600" : "bg-surface-300",
              className
            )}>
              <div className={cn(
                "absolute top-0.5 left-0.5 bg-white rounded-full transition-transform duration-200 ease-in-out",
                thumbSizeClasses[size],
                props.checked ? `translate-x-${size === "sm" ? "3" : size === "lg" ? "6" : "5"}` : "translate-x-0"
              )} />
            </div>
          </label>
        </div>
        {(label || description) && (
          <div className="text-sm">
            {label && (
              <label className="font-medium text-surface-700 cursor-pointer">
                {label}
              </label>
            )}
            {description && (
              <p className="text-surface-500 mt-1">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);
Switch.displayName = "Switch";

// Form Group Component
export interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

const FormGroup = React.forwardRef<HTMLDivElement, FormGroupProps>(
  ({ className, title, description, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-4", className)}
        {...props}
      >
        {(title || description) && (
          <div className="space-y-1">
            {title && <h3 className="text-lg font-medium text-surface-900">{title}</h3>}
            {description && <p className="text-sm text-surface-600">{description}</p>}
          </div>
        )}
        <div className="space-y-4">
          {children}
        </div>
      </div>
    );
  }
);
FormGroup.displayName = "FormGroup";

export {
  FormField,
  Select,
  Textarea,
  Checkbox,
  RadioGroup,
  Switch,
  FormGroup,
  formFieldVariants,
};
