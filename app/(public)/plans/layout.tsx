import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Commission Plans | 100% Commission with Low Caps - Reapex',
  description: 'Compare our transparent commission structures. From 80% splits to 100% commission plans with minimal caps. Choose the plan that maximizes your earnings and fits your business goals.',
  keywords: ['commission plans', 'real estate commission structure', '100% commission', 'commission splits', 'low cap brokerage', 'agent commission tiers', 'Reapex pricing'],
  openGraph: {
    title: 'Commission Plans | 100% Commission with Low Caps - Reapex',
    description: 'Compare our transparent commission structures. From 80% splits to 100% commission plans with minimal caps. Choose the plan that maximizes your earnings.',
    url: 'https://reapex.com/plans',
    siteName: 'Reapex',
    images: [
      {
        url: '/images/og-image.jpeg',
        width: 1200,
        height: 630,
        alt: 'Reapex Commission Plans',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Commission Plans | 100% Commission with Low Caps - Reapex',
    description: 'Compare our transparent commission structures. From 80% splits to 100% commission plans with minimal caps.',
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

export default function PlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
