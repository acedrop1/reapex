import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sell Your Home | Expert Listing Services - Reapex',
  description: 'List your property with Reapex. Connect with experienced agents, get accurate market valuations, and maximize your sale price. Submit your property details today for a free consultation.',
  keywords: ['sell home', 'list property', 'home valuation', 'sell house fast', 'real estate listing', 'property sale', 'Reapex listing service'],
  openGraph: {
    title: 'Sell Your Home | Expert Listing Services - Reapex',
    description: 'List your property with Reapex. Connect with experienced agents, get accurate market valuations, and maximize your sale price.',
    url: 'https://reapex.com/sell',
    siteName: 'Reapex',
    images: [
      {
        url: '/images/og-image.jpeg',
        width: 1200,
        height: 630,
        alt: 'Sell Your Home with Reapex',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sell Your Home | Expert Listing Services - Reapex',
    description: 'List your property with Reapex. Connect with experienced agents, get accurate market valuations, and maximize your sale price.',
    images: ['/images/og-image.jpeg'],
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
};

export default function SellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
