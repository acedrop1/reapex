import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Reapex | Get in Touch with Our Team',
  description: 'Questions about joining Reapex or our services? Reach out to our team. We are here to help agents succeed and homeowners find the right solutions. Contact us today.',
  keywords: ['contact Reapex', 'real estate inquiry', 'agent support', 'customer service', 'get in touch', 'Reapex contact information'],
  openGraph: {
    title: 'Contact Reapex | Get in Touch with Our Team',
    description: 'Questions about joining Reapex or our services? Reach out to our team. We are here to help agents succeed and homeowners find the right solutions.',
    url: 'https://reapex.com/contact',
    siteName: 'Reapex',
    images: [
      {
        url: '/images/og-image.jpeg',
        width: 1200,
        height: 630,
        alt: 'Contact Reapex',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Reapex | Get in Touch with Our Team',
    description: 'Questions about joining Reapex or our services? Reach out to our team. We are here to help agents succeed and homeowners find the right solutions.',
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

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
