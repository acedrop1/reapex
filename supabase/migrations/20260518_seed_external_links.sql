-- Seed external_links with all hardcoded resource links from the old website
-- These were previously hardcoded in dashboard/resources/page.tsx

-- First clear any old seed data to avoid duplicates
DELETE FROM public.external_links WHERE url IN (
  'https://www.narrpr.com/home',
  'https://www.greaterbergenrealtors.com/',
  'https://www.njmls.com/',
  'https://www.hcmls.com/',
  'https://www.gsmls.com/',
  'https://www.narrpr.com/',
  'https://www.zillow.com/',
  'https://www.loopnet.com/',
  'https://www.paragonrels.com/',
  'https://www.supraekey.com/',
  'https://www.showingtime.com/',
  'https://www.docusign.com/',
  'https://www.dotloop.com/',
  'https://www.ziplogix.com/',
  'https://www.nar.realtor/',
  'https://www.njactb.org/',
  'https://www.floodsmart.gov/',
  'https://newjersey.mylicense.com/'
);

-- MLS & Listings
INSERT INTO public.external_links (title, description, url, category, display_order, is_active)
VALUES
  ('Greater Bergen Realtors (GBRAR)', 'Access your GBRAR MLS board and member resources', 'https://www.greaterbergenrealtors.com/', 'Forms & Compliance', 1, true),
  ('NJMLS', 'New Jersey Multiple Listing Service', 'https://www.njmls.com/', 'Forms & Compliance', 2, true),
  ('HCMLS', 'Hudson County Multiple Listing Service', 'https://www.hcmls.com/', 'Forms & Compliance', 3, true),
  ('GSMLS', 'Garden State Multiple Listing Service', 'https://www.gsmls.com/', 'Forms & Compliance', 4, true),
  ('Realtors Property Resource (RPR)', 'Comprehensive property data, market analytics, and valuation tools', 'https://www.narrpr.com/', 'Forms & Compliance', 5, true),
  ('Zillow', 'Browse listings and market data on Zillow', 'https://www.zillow.com/', 'Forms & Compliance', 6, true),
  ('LoopNet', 'Commercial real estate listings and research', 'https://www.loopnet.com/', 'Forms & Compliance', 7, true),
  ('Paragon MLS', 'MLS platform for property searches and reports', 'https://www.paragonrels.com/', 'Forms & Compliance', 8, true),

-- Tools & Software
  ('Supra eKEY', 'Electronic lockbox access for property showings', 'https://www.supraekey.com/', 'Marketing & Branding', 9, true),
  ('ShowingTime', 'Schedule and manage property showings', 'https://www.showingtime.com/', 'Marketing & Branding', 10, true),
  ('DocuSign', 'Electronic signature platform for real estate documents', 'https://www.docusign.com/', 'Marketing & Branding', 11, true),
  ('dotloop', 'Transaction management and e-signature platform', 'https://www.dotloop.com/', 'Marketing & Branding', 12, true),
  ('zipLogix (zipForms)', 'Real estate forms and transaction management', 'https://www.ziplogix.com/', 'Marketing & Branding', 13, true),

-- Associations & Government
  ('National Association of Realtors', 'NAR member portal, resources, and education', 'https://www.nar.realtor/', 'Training & Knowledge', 14, true),
  ('Greater Bergen Board of Realtors', 'Local board member resources and events', 'https://www.greaterbergenrealtors.com/', 'Training & Knowledge', 15, true),
  ('NJ Property Records', 'New Jersey property tax and assessment records', 'https://www.njactb.org/', 'Training & Knowledge', 16, true),
  ('FEMA FloodSmart', 'FEMA flood zone maps and insurance information', 'https://www.floodsmart.gov/', 'Training & Knowledge', 17, true),
  ('NJREC License Renewal Portal', 'New Jersey real estate license renewal and management', 'https://newjersey.mylicense.com/', 'Training & Knowledge', 18, true);
