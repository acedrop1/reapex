import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join Reapex | Agent Application & Commission Plans',
  description: 'Ready to keep more of your hard-earned commission? Apply to Reapex in minutes. 100% commission plans, low caps, and cutting-edge technology. Your success starts here.',
  keywords: ['join Reapex', 'real estate agent application', 'become a realtor', 'agent recruitment', 'real estate career', 'agent onboarding', 'commission plans'],
  openGraph: {
    title: 'Join Reapex | Agent Application & Commission Plans',
    description: 'Ready to keep more of your hard-earned commission? Apply to Reapex in minutes. 100% commission plans, low caps, and cutting-edge technology.',
    url: 'https://reapex.com/join',
    siteName: 'Reapex',
    images: [
      {
        url: '/images/og-image.jpeg',
        width: 1200,
        height: 630,
        alt: 'Join Reapex - Agent-First Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Join Reapex | Agent Application & Commission Plans',
    description: 'Ready to keep more of your hard-earned commission? Apply to Reapex in minutes. 100% commission plans, low caps, and cutting-edge technology.',
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

export default function JoinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
