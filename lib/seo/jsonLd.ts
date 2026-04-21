// JSON-LD Structured Data Helpers for SEO

export interface Organization {
  '@context': 'https://schema.org';
  '@type': 'Organization' | 'RealEstateAgent';
  name: string;
  url: string;
  logo?: string;
  image?: string;
  description?: string;
  address?: {
    '@type': 'PostalAddress';
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  contactPoint?: {
    '@type': 'ContactPoint';
    telephone?: string;
    contactType?: string;
    email?: string;
  };
  sameAs?: string[];
}

export interface WebSite {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
}

export interface RealEstateAgent {
  '@context': 'https://schema.org';
  '@type': 'RealEstateAgent';
  name: string;
  url: string;
  image?: string;
  description?: string;
  jobTitle?: string;
  email?: string;
  telephone?: string;
  address?: {
    '@type': 'PostalAddress';
    addressLocality?: string;
    addressRegion?: string;
    addressCountry?: string;
  };
  memberOf?: {
    '@type': 'Organization';
    name: string;
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: number;
    reviewCount: number;
  };
}

export interface Product {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  description: string;
  offers?: {
    '@type': 'Offer';
    price?: string;
    priceCurrency?: string;
    availability?: string;
  };
}

export interface RealEstateListing {
  '@context': 'https://schema.org';
  '@type': 'RealEstateListing';
  name: string;
  url: string;
  description?: string;
  image?: string[];
  address?: {
    '@type': 'PostalAddress';
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  geo?: {
    '@type': 'GeoCoordinates';
    latitude?: number;
    longitude?: number;
  };
  numberOfRooms?: number;
  numberOfBedrooms?: number;
  numberOfBathroomsTotal?: number;
  floorSize?: {
    '@type': 'QuantitativeValue';
    value?: number;
    unitCode?: string;
  };
  offers?: {
    '@type': 'Offer';
    price: number;
    priceCurrency: string;
    availability?: string;
  };
}

export interface FAQPage {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: {
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }[];
}

export interface BreadcrumbList {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: {
    '@type': 'ListItem';
    position: number;
    name: string;
    item?: string;
  }[];
}

// Helper function to generate Organization schema
export function generateOrganizationSchema(): Organization {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'Reapex',
    url: 'https://reapex.com',
    logo: 'https://reapex.com/logos/logo.svg',
    image: 'https://reapex.com/logos/social.png',
    description: 'Agent-first real estate platform with 100% commission plans and elite technology. High splits, capped costs, and real wealth building for New Jersey real estate agents.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'New Jersey',
      addressRegion: 'NJ',
      addressCountry: 'US',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
    },
    sameAs: [
      // Add your social media URLs here
      // 'https://facebook.com/reapex',
      // 'https://instagram.com/reapex',
      // 'https://linkedin.com/company/reapex',
    ],
  };
}

// Helper function to generate WebSite schema with search action
export function generateWebSiteSchema(): WebSite {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Reapex',
    url: 'https://reapex.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://reapex.com/listings?search={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };
}

// Helper function to generate Agent schema
export function generateAgentSchema(agent: {
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  bio?: string;
  headshot_url?: string;
  averageRating?: number;
  totalReviews?: number;
}): RealEstateAgent {
  const schema: RealEstateAgent = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: agent.name,
    url: `https://reapex.com/agent/${agent.slug}`,
    jobTitle: 'Licensed Real Estate Agent',
    memberOf: {
      '@type': 'Organization',
      name: 'Reapex',
    },
  };

  if (agent.headshot_url) {
    schema.image = agent.headshot_url;
  }

  if (agent.bio) {
    schema.description = agent.bio;
  }

  if (agent.email) {
    schema.email = agent.email;
  }

  if (agent.phone) {
    schema.telephone = agent.phone;
  }

  if (agent.averageRating && agent.totalReviews && agent.totalReviews > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: agent.averageRating,
      reviewCount: agent.totalReviews,
    };
  }

  return schema;
}

// Helper function to generate Listing schema
export function generateListingSchema(listing: {
  title: string;
  slug: string;
  description?: string;
  property_address?: string;
  property_city?: string;
  property_state?: string;
  property_zip?: string;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  price?: number;
  images?: string[];
}): RealEstateListing {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: listing.title,
    url: `https://reapex.com/listings/${listing.property_city?.toLowerCase().replace(/\s+/g, '-')}/${listing.slug}`,
    description: listing.description,
    image: listing.images || [],
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.property_address,
      addressLocality: listing.property_city,
      addressRegion: listing.property_state || 'NJ',
      postalCode: listing.property_zip,
      addressCountry: 'US',
    },
    numberOfBedrooms: listing.bedrooms,
    numberOfBathroomsTotal: listing.bathrooms,
    floorSize: listing.square_feet
      ? {
          '@type': 'QuantitativeValue',
          value: listing.square_feet,
          unitCode: 'SQF',
        }
      : undefined,
    offers: listing.price
      ? {
          '@type': 'Offer',
          price: listing.price,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        }
      : undefined,
  };
}

// Helper function to generate FAQ schema
export function generateFAQSchema(faqs: { question: string; answer: string }[]): FAQPage {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// Helper function to generate Breadcrumb schema
export function generateBreadcrumbSchema(
  items: { name: string; url?: string }[]
): BreadcrumbList {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
