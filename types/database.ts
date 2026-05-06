// Database Types (matching Supabase schema)

export type UserRole = 'agent' | 'admin' | 'broker';
export type AccountStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type TransactionStatus = 'pending' | 'under_contract' | 'closed' | 'cancelled';
export type AnnouncementPriority = 'low' | 'medium' | 'high';
export type EventType = 'task' | 'appointment' | 'transaction' | 'company';
export type EventSource = 'fub' | 'transaction' | 'custom';
export type ResourceType = 'video' | 'document' | 'faq';
export type IntegrationService = 'follow_up_boss' | 'quickbooks' | 'zipforms' | 'rpr' | 'canva';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  account_status: AccountStatus;
  approved_by: string | null;
  approved_at: string | null;
  headshot_url: string | null;
  bio: string | null;
  cap_amount: number;
  current_cap_progress: number;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  years_experience: number | null;
  specialties: string[] | null;
  phone: string | null;
  show_phone_number: boolean | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  x: string | null;
  tiktok: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  agent_id: string;
  property_address: string;
  property_city: string;
  property_state: string;
  property_zip: string;
  listing_price: number | null;
  sale_price: number | null;
  gci: number;
  agent_split_percentage: number;
  agent_commission: number;
  status: TransactionStatus;
  closing_date: string | null;
  contingency_date: string | null;
  listing_date: string | null;
  documents: string[];
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  priority: AnnouncementPriority;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  agent_id: string | null;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  event_type: EventType;
  source: EventSource;
  source_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyWebsite {
  id: string;
  transaction_id: string;
  slug: string;
  is_published: boolean;
  custom_domain: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingResource {
  id: string;
  title: string;
  description: string | null;
  resource_type: ResourceType;
  video_url: string | null;
  document_url: string | null;
  category: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface IntegrationToken {
  id: string;
  user_id: string;
  service: IntegrationService;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Contact types
export type ContactType = 'buyer' | 'seller' | 'landlord' | 'tenant' | 'lead';
export type ContactSource = 'website' | 'referral' | 'social_media' | 'advertising' | 'walk_in' | 'phone_call' | 'email' | 'property_portal' | 'agent_website' | 'other';
export type ContactStatus = 'new' | 'contacted' | 'qualified' | 'negotiating' | 'converted' | 'lost' | 'archived';

export interface Contact {
  id: string;
  agent_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  phone_secondary: string | null;
  company: string | null;
  job_title: string | null;
  address: string | null;
  city: string | null;
  emirate: string | null;
  country: string;
  contact_type: ContactType;
  source: ContactSource;
  status: ContactStatus;
  budget_min: number | null;
  budget_max: number | null;
  preferred_areas: string[];
  preferred_property_types: string[];
  min_bedrooms: number | null;
  max_bedrooms: number | null;
  notes: string | null;
  tags: string[];
  last_contact_date: string | null;
  next_followup_date: string | null;
  email_opt_in: boolean;
  sms_opt_in: boolean;
  custom_fields: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface ContactAgentAssignment {
  id: string;
  contact_id: string;
  agent_id: string;
  assigned_at: string;
  assigned_by: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface ContactActivity {
  id: string;
  contact_id: string;
  agent_id: string;
  activity_type: string;
  subject: string;
  body: string | null;
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'completed' | 'cancelled';
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

