'use client';

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { X } from "lucide-react";

const modalVariants = cva(
  "fixed inset-0 z-50 flex items-center justify-center p-4",
  {
    variants: {
      size: {
        sm: "",
        default: "",
        lg: "",
        xl: "",
        full: "p-0",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

const modalContentVariants = cva(
  "relative bg-white rounded-lg shadow-lg border border-border max-h-[90vh] overflow-hidden",
  {
    variants: {
      size: {
        sm: "max-w-sm w-full",
        default: "max-w-md w-full",
        lg: "max-w-lg w-full",
        xl: "max-w-xl w-full",
        full: "w-full h-full rounded-none",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface ModalProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modalVariants> {
  open: boolean;
  onClose: () => void;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ 
    className, 
    size, 
    open, 
    onClose, 
    closeOnOverlayClick = true,
    closeOnEscape = true,
    showCloseButton = true,
    children, 
    ...props 
  }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
      if (open) {
        setIsVisible(true);
        document.body.style.overflow = 'hidden';
      } else {
        setIsVisible(false);
        document.body.style.overflow = 'unset';
      }

      return () => {
        document.body.style.overflow = 'unset';
      };
    }, [open]);

    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (closeOnEscape && e.key === 'Escape') {
          onClose();
        }
      };

      if (open) {
        document.addEventListener('keydown', handleEscape);
      }

      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }, [open, closeOnEscape, onClose]);

    const handleOverlayClick = (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose();
      }
    };

    if (!open) return null;

    return (
      <div
        ref={ref}
        className={cn(
          modalVariants({ size }),
          "animate-fade-in"
        )}
        onClick={handleOverlayClick}
        {...props}
      >
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        
        {/* Modal Content */}
        <div
          className={cn(
            modalContentVariants({ size }),
            "animate-scale-in",
            className
          )}
        >
          {showCloseButton && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          )}
          {children}
        </div>
      </div>
    );
  }
);
Modal.displayName = "Modal";

const ModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)}
    {...props}
  />
));
ModalHeader.displayName = "ModalHeader";

const ModalTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
ModalTitle.displayName = "ModalTitle";

const ModalDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
ModalDescription.displayName = "ModalDescription";

const ModalContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-6 pt-0", className)}
    {...props}
  />
));
ModalContent.displayName = "ModalContent";

const ModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-4", className)}
    {...props}
  />
));
ModalFooter.displayName = "ModalFooter";

// Confirmation Modal Component
export interface ConfirmationModalProps extends Omit<ModalProps, 'children'> {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger" | "warning";
  onConfirm: () => void;
  loading?: boolean;
}

const ConfirmationModal = React.forwardRef<HTMLDivElement, ConfirmationModalProps>(
  ({ 
    title, 
    description, 
    confirmText = "Confirm", 
    cancelText = "Cancel",
    variant = "default",
    onConfirm,
    loading = false,
    ...props 
  }, ref) => {
    const handleConfirm = () => {
      onConfirm();
      props.onClose();
    };

    // const confirmButtonVariant = variant === "danger" ? "destructive" : "default"; // TODO: Implement button variant logic

    return (
      <Modal ref={ref} {...props}>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          {description && <ModalDescription>{description}</ModalDescription>}
        </ModalHeader>
        <ModalFooter>
          <button
            onClick={props.onClose}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              variant === "danger" 
                ? "bg-danger-600 text-white hover:bg-danger-700" 
                : "bg-primary-600 text-white hover:bg-primary-700"
            )}
          >
            {loading && (
              <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {confirmText}
          </button>
        </ModalFooter>
      </Modal>
    );
  }
);
ConfirmationModal.displayName = "ConfirmationModal";

// Alert Modal Component
export interface AlertModalProps extends Omit<ModalProps, 'children'> {
  title: string;
  description?: string;
  variant?: "info" | "success" | "warning" | "danger";
  buttonText?: string;
}

const AlertModal = React.forwardRef<HTMLDivElement, AlertModalProps>(
  ({ 
    title, 
    description, 
    variant = "info",
    buttonText = "OK",
    ...props 
  }, ref) => {
    const variantIcons = {
      info: "ℹ️",
      success: "✅",
      warning: "⚠️",
      danger: "❌",
    };

    const variantColors = {
      info: "text-info-600",
      success: "text-success-600",
      warning: "text-warning-600",
      danger: "text-danger-600",
    };

    return (
      <Modal ref={ref} {...props}>
        <ModalHeader>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{variantIcons[variant]}</span>
            <ModalTitle className={variantColors[variant]}>{title}</ModalTitle>
          </div>
          {description && <ModalDescription>{description}</ModalDescription>}
        </ModalHeader>
        <ModalFooter>
          <button
            onClick={props.onClose}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white ring-offset-background transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {buttonText}
          </button>
        </ModalFooter>
      </Modal>
    );
  }
);
AlertModal.displayName = "AlertModal";

export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
  ConfirmationModal,
  AlertModal,
  modalVariants,
};