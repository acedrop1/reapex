-- Update external_links categories from old names to new names
-- Old: "Forms & Compliance", "Marketing & Branding", "Training & Knowledge"
-- New: "Property Search", "Utility", "Government"

-- MLS & listing sites → Property Search
UPDATE public.external_links
SET category = 'Property Search'
WHERE url IN (
  'https://www.greaterbergenrealtors.com/',
  'https://www.njmls.com/',
  'https://www.hcmls.com/',
  'https://www.gsmls.com/',
  'https://www.narrpr.com/',
  'https://www.zillow.com/',
  'https://www.loopnet.com/',
  'https://www.paragonrels.com/'
)
AND category = 'Forms & Compliance';

-- Tools & software → Utility
UPDATE public.external_links
SET category = 'Utility'
WHERE url IN (
  'https://www.supraekey.com/',
  'https://www.showingtime.com/',
  'https://www.docusign.com/',
  'https://www.dotloop.com/',
  'https://www.ziplogix.com/'
)
AND category = 'Marketing & Branding';

-- Associations & government → Government
UPDATE public.external_links
SET category = 'Government'
WHERE url IN (
  'https://www.nar.realtor/',
  'https://www.njactb.org/',
  'https://www.floodsmart.gov/',
  'https://newjersey.mylicense.com/'
)
AND category = 'Training & Knowledge';

-- Greater Bergen Board (was duplicated in Training & Knowledge) → Government
UPDATE public.external_links
SET category = 'Government'
WHERE url = 'https://www.greaterbergenrealtors.com/'
AND category = 'Training & Knowledge';
