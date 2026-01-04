-- Add public-facing NAP fields (Name, Address, Phone) + optional website

-- Contractors (legacy)
ALTER TABLE public.contractors
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT;

COMMENT ON COLUMN public.contractors.address IS
  'Public street address for contractor (NAP).';

COMMENT ON COLUMN public.contractors.postal_code IS
  'Postal/ZIP code for contractor address (NAP).';

COMMENT ON COLUMN public.contractors.phone IS
  'Public phone number for contractor (NAP).';

COMMENT ON COLUMN public.contractors.website IS
  'Public website URL for contractor.';

-- Businesses (agentic schema)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT;

COMMENT ON COLUMN public.businesses.address IS
  'Public street address for business (NAP).';

COMMENT ON COLUMN public.businesses.postal_code IS
  'Postal/ZIP code for business address (NAP).';

COMMENT ON COLUMN public.businesses.phone IS
  'Public phone number for business (NAP).';

COMMENT ON COLUMN public.businesses.website IS
  'Public website URL for business.';
