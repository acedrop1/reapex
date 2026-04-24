import { ReactNode } from 'react';
import { PublicThemeProvider } from '@/components/providers/PublicThemeProvider';

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PublicThemeProvider>
      {children}
    </PublicThemeProvider>
  );
}
