import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Property Listings | Homes for Sale - Reapex',
  description: 'Browse active property listings. Find your dream home with detailed photos, pricing, and neighborhood insights. Expert agents ready to guide your home search.',
  keywords: ['homes for sale', 'property listings', 'real estate search', 'houses for sale', 'property search', 'Reapex listings'],
  openGraph: {
    title: 'Property Listings | Homes for Sale - Reapex',
    description: 'Browse active property listings. Find your dream home with detailed photos, pricing, and neighborhood insights.',
    url: 'https://reapex.com/listings',
    siteName: 'Reapex',
    images: [
      {
        url: '/images/og-image.jpeg',
        width: 1200,
        height: 630,
        alt: 'Reapex Property Listings',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Property Listings | Homes for Sale - Reapex',
    description: 'Browse active property listings. Find your dream home with detailed photos, pricing, and neighborhood insights.',
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

export default function ListingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
