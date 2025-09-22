import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { Eye, EyeOff, Search, X } from "lucide-react";

const inputVariants = cva(
  "flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-input hover:border-primary-300 focus-visible:ring-primary-500",
        error: "border-red-300 hover:border-red-400 focus-visible:ring-red-500",
        success: "border-green-300 hover:border-green-400 focus-visible:ring-green-500",
        warning: "border-yellow-300 hover:border-yellow-400 focus-visible:ring-yellow-500",
      },
      size: {
        default: "h-10",
        sm: "h-9 px-2 text-xs",
        lg: "h-11 px-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  loading?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, leftIcon, rightIcon, clearable, onClear, loading, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(props.value || props.defaultValue || "");

    const isPassword = props.type === "password";
    const hasValue = internalValue && String(internalValue).length > 0;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      props.onChange?.(e);
    };

    const handleClear = () => {
      setInternalValue("");
      onClear?.();
      // Create a synthetic event for onChange
      const syntheticEvent = {
        target: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>;
      props.onChange?.(syntheticEvent);
    };

    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}
        <input
          type={isPassword && showPassword ? "text" : props.type}
          className={cn(
            inputVariants({ variant, size }),
            leftIcon && "pl-10",
            (rightIcon || clearable || isPassword || loading) && "pr-10",
            className
          )}
          ref={ref}
          value={internalValue}
          onChange={handleChange}
          {...props}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600" />
          )}
          {!loading && clearable && hasValue && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {!loading && isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
          {!loading && rightIcon && !isPassword && !clearable && (
            <div className="text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
      </div>
    );
  }
);
Input.displayName = "Input";

// Search Input Component
export interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {
  onSearch?: (value: string) => void;
  placeholder?: string;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, placeholder = "Search...", ...props }, ref) => {
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        onSearch?.(e.currentTarget.value);
      }
    };

    return (
      <Input
        ref={ref}
        leftIcon={<Search className="h-4 w-4" />}
        placeholder={placeholder}
        onKeyPress={handleKeyPress}
        {...props}
      />
    );
  }
);
SearchInput.displayName = "SearchInput";

// Password Input Component
export interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightIcon'> {
  showStrength?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showStrength = false, ...props }, ref) => {
    const [password, setPassword] = React.useState("");
    
    const getPasswordStrength = (password: string) => {
      let strength = 0;
      if (password.length >= 8) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[a-z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[^A-Za-z0-9]/.test(password)) strength++;
      return strength;
    };

    const strength = getPasswordStrength(password);
    const strengthColors = [
      "bg-red-500",
      "bg-orange-500", 
      "bg-yellow-500",
      "bg-blue-500",
      "bg-green-500"
    ];

    return (
      <div className="space-y-2">
        <Input
          ref={ref}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          {...props}
        />
        {showStrength && password && (
          <div className="space-y-1">
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded ${
                    level <= strength ? strengthColors[strength - 1] : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Password strength: {strength}/5
            </p>
          </div>
        )}
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { Input, SearchInput, PasswordInput, inputVariants };