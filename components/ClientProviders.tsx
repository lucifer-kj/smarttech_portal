'use client';

import { ToastProvider } from "@/components/ui/Toast";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ToastProvider>
      {children}
      <PWAInstallPrompt />
    </ToastProvider>
  );
}
