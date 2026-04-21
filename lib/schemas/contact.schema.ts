import { z } from 'zod';

/**
 * Contact Validation Schemas
 * Zod schemas for contacts (CRM) table
 */

// Enums
export const ContactTypeEnum = z.enum(['buyer', 'seller', 'landlord', 'tenant', 'lead']);

export const ContactSourceEnum = z.enum([
  'website',
  'referral',
  'social_media',
  'advertising',
  'walk_in',
  'phone_call',
  'email',
  'property_portal',
  'other',
]);

export const ContactStatusEnum = z.enum([
  'new',
  'contacted',
  'qualified',
  'negotiating',
  'converted',
  'lost',
  'archived',
]);

// Base Contact Schema
export const ContactSchema = z.object({
  id: z.string().uuid(),
  agent_id: z.string().uuid(),

  // Personal Information
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().min(5).max(20),
  phone_secondary: z.string().min(5).max(20).optional(),

  // Contact Details
  company: z.string().max(200).optional(),
  job_title: z.string().max(100).optional(),

  // Address
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  emirate: z.string().max(100).optional(),
  country: z.string().max(100).default('UAE'),

  // Classification
  contact_type: ContactTypeEnum,
  source: ContactSourceEnum,
  status: ContactStatusEnum.default('new'),

  // Preferences & Requirements
  budget_min: z.number().positive().optional(),
  budget_max: z.number().positive().optional(),
  preferred_areas: z.array(z.string()).default([]),
  preferred_property_types: z.array(z.string()).default([]),
  min_bedrooms: z.number().int().min(0).optional(),
  max_bedrooms: z.number().int().min(0).optional(),

  // Interaction
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string()).default([]),
  last_contact_date: z.string().datetime().optional(),
  next_followup_date: z.string().datetime().optional(),

  // Marketing
  email_opt_in: z.boolean().default(false),
  sms_opt_in: z.boolean().default(false),

  // Metadata
  custom_fields: z.record(z.any()).optional(),

  // File Attachments
  file_urls: z.array(z.string().url()).default([]),
  attachment_names: z.array(z.string()).default([]),
  attachment_metadata: z.record(z.any()).default({}),

  // Timestamps
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Create Contact
export const CreateContactSchema = ContactSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial({
  status: true,
  country: true,
  preferred_areas: true,
  preferred_property_types: true,
  tags: true,
  email_opt_in: true,
  sms_opt_in: true,
  file_urls: true,
  attachment_names: true,
  attachment_metadata: true,
});

// Update Contact
export const UpdateContactSchema = ContactSchema.partial().required({ id: true });

// Contact Filters
export const ContactFiltersSchema = z.object({
  agent_id: z.string().uuid().optional(),
  contact_type: ContactTypeEnum.optional(),
  source: ContactSourceEnum.optional(),
  status: ContactStatusEnum.optional(),
  city: z.string().optional(),
  emirate: z.string().optional(),
  min_budget: z.number().positive().optional(),
  max_budget: z.number().positive().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(), // Search name, email, phone
  needs_followup: z.boolean().optional(), // Has next_followup_date in past
});

// Export types
export type Contact = z.infer<typeof ContactSchema>;
export type CreateContact = z.infer<typeof CreateContactSchema>;
export type UpdateContact = z.infer<typeof UpdateContactSchema>;
export type ContactFilters = z.infer<typeof ContactFiltersSchema>;
export type ContactType = z.infer<typeof ContactTypeEnum>;
export type ContactSource = z.infer<typeof ContactSourceEnum>;
export type ContactStatus = z.infer<typeof ContactStatusEnum>;
