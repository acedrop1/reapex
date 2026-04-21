import type { Metadata } from 'next';
import Script from 'next/script';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ClarityProvider } from '@/components/providers/ClarityProvider';
import { ErrorProvider } from '@/contexts/ErrorContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GlobalErrorHandler } from '@/components/GlobalErrorHandler';
import { NetworkStatusMonitor } from '@/components/NetworkStatusMonitor';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://reapex.com'),
  title: {
    default: 'Reapex | Keep 100% of Your Commission',
    template: '%s | Reapex',
  },
  description: 'High splits. Capped costs. Real wealth. Join the agent-first platform with 100% commission plans and elite tech. Stop splitting your profits. Apply in minutes.',
  keywords: ['real estate commission', '100% commission', 'realtor', 'real estate agent', 'high commission split', 'low cap', 'Reapex'],
  authors: [{ name: 'Reapex' }],
  creator: 'Reapex',
  publisher: 'Reapex',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/logos/favicon.svg',
    apple: '/logos/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Reapex',
    title: 'Reapex | Keep 100% of Your Commission',
    description: 'High splits. Capped costs. Real wealth. Join the agent-first platform with 100% commission plans and elite tech.',
    images: [
      {
        url: '/logos/social.png',
        width: 1200,
        height: 630,
        alt: 'Reapex - Reach Your Real Estate Apex',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reapex | Keep 100% of Your Commission',
    description: 'High splits. Capped costs. Real wealth. Join the agent-first platform with 100% commission plans and elite tech.',
    images: ['/logos/social.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'yun8xjOcNnKLaKgRsR6XeooqBFABpojXsOBMYENV1Zc',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <head>
        <link rel="icon" href="/logos/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className={dmSans.className} style={{ fontFamily: '"DM Sans", sans-serif' }}>
        <ErrorBoundary>
          <ErrorProvider>
            <GlobalErrorHandler />
            <NetworkStatusMonitor />
            <ThemeProvider>
              <ClarityProvider>
                <QueryProvider>
                  {children}
                </QueryProvider>
              </ClarityProvider>
            </ThemeProvider>
          </ErrorProvider>
        </ErrorBoundary>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-2F20JRN4PH"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-2F20JRN4PH');
          `}
        </Script>
      </body>
    </html>
  );
}

