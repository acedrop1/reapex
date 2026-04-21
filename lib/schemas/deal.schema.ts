import { z } from 'zod';

/**
 * Deal Validation Schemas
 * Zod schemas for deals (CRM pipeline) table
 */

// Enums
export const DealStageEnum = z.enum([
  'lead',
  'contact_made',
  'viewing_scheduled',
  'viewing_completed',
  'offer_made',
  'negotiating',
  'offer_accepted',
  'contract_sent',
  'contract_signed',
  'deposit_paid',
  'closed_won',
  'closed_lost',
]);

export const DealTypeEnum = z.enum(['sale', 'rental', 'both']);

export const DealPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);

// Base Deal Schema
export const DealSchema = z.object({
  id: z.string().uuid(),
  agent_id: z.string().uuid(),
  contact_id: z.string().uuid(),
  listing_id: z.string().uuid().optional(),

  // Deal Information
  title: z.string().min(5).max(200),
  deal_type: DealTypeEnum,
  stage: DealStageEnum.default('lead'),
  priority: DealPriorityEnum.default('medium'),

  // Financial
  value: z.number().positive().optional(), // Expected deal value
  commission_percentage: z.number().min(0).max(100).optional(),
  expected_commission: z.number().positive().optional(),

  // Probability & Timing
  probability: z.number().min(0).max(100).default(0), // % chance of closing
  expected_close_date: z.string().datetime().optional(),
  actual_close_date: z.string().datetime().optional(),

  // Details
  description: z.string().max(2000).optional(),
  notes: z.string().max(5000).optional(),

  // Requirements (if not linked to listing)
  property_requirements: z.object({
    property_types: z.array(z.string()).optional(),
    areas: z.array(z.string()).optional(),
    budget_min: z.number().positive().optional(),
    budget_max: z.number().positive().optional(),
    bedrooms: z.number().int().min(0).optional(),
    move_in_date: z.string().datetime().optional(),
  }).optional(),

  // Communication
  last_activity_date: z.string().datetime().optional(),
  next_action: z.string().max(500).optional(),
  next_action_date: z.string().datetime().optional(),

  // Loss Reason (if closed_lost)
  loss_reason: z.enum([
    'price_too_high',
    'found_alternative',
    'timing_not_right',
    'budget_constraints',
    'competitor_won',
    'no_response',
    'other',
  ]).optional(),
  loss_reason_notes: z.string().max(1000).optional(),

  // Tags & Custom Fields
  tags: z.array(z.string()).default([]),
  custom_fields: z.record(z.any()).optional(),

  // Timestamps
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Create Deal
export const CreateDealSchema = DealSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial({
  stage: true,
  priority: true,
  probability: true,
  tags: true,
});

// Update Deal
export const UpdateDealSchema = DealSchema.partial().required({ id: true });

// Deal Filters
export const DealFiltersSchema = z.object({
  agent_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  listing_id: z.string().uuid().optional(),
  deal_type: DealTypeEnum.optional(),
  stage: DealStageEnum.optional(),
  priority: DealPriorityEnum.optional(),
  min_value: z.number().positive().optional(),
  max_value: z.number().positive().optional(),
  min_probability: z.number().min(0).max(100).optional(),
  expected_close_before: z.string().datetime().optional(),
  expected_close_after: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  needs_action: z.boolean().optional(), // Has next_action_date in past
});

// Deal Stage Progression Validation
export const stageProgression: Record<string, string[]> = {
  lead: ['contact_made', 'closed_lost'],
  contact_made: ['viewing_scheduled', 'closed_lost'],
  viewing_scheduled: ['viewing_completed', 'closed_lost'],
  viewing_completed: ['offer_made', 'viewing_scheduled', 'closed_lost'],
  offer_made: ['negotiating', 'closed_lost'],
  negotiating: ['offer_accepted', 'offer_made', 'closed_lost'],
  offer_accepted: ['contract_sent', 'closed_lost'],
  contract_sent: ['contract_signed', 'closed_lost'],
  contract_signed: ['deposit_paid', 'closed_lost'],
  deposit_paid: ['closed_won', 'closed_lost'],
  closed_won: [], // Terminal state
  closed_lost: [], // Terminal state
};

export const validateStageTransition = (
  currentStage: DealStage,
  newStage: DealStage
): boolean => {
  if (currentStage === newStage) return true;
  return stageProgression[currentStage]?.includes(newStage) || false;
};

// Export types
export type Deal = z.infer<typeof DealSchema>;
export type CreateDeal = z.infer<typeof CreateDealSchema>;
export type UpdateDeal = z.infer<typeof UpdateDealSchema>;
export type DealFilters = z.infer<typeof DealFiltersSchema>;
export type DealStage = z.infer<typeof DealStageEnum>;
export type DealType = z.infer<typeof DealTypeEnum>;
export type DealPriority = z.infer<typeof DealPriorityEnum>;
