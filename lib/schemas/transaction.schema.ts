import { z } from 'zod';

/**
 * Transaction Validation Schemas
 * Zod schemas for transactions table with commission tracking
 */

// Enums
export const TransactionTypeEnum = z.enum(['sale', 'rental', 'both']);

export const TransactionStatusEnum = z.enum([
  'pending',
  'in_progress',
  'completed',
  'cancelled',
  'on_hold',
]);

export const CommissionStatusEnum = z.enum([
  'pending',
  'invoiced',
  'received',
  'partially_received',
  'disputed',
]);

// Base Transaction Schema
export const TransactionSchema = z.object({
  id: z.string().uuid(),
  agent_id: z.string().uuid(),
  deal_id: z.string().uuid().optional(),
  listing_id: z.string().uuid().optional(),

  // Transaction Details
  transaction_type: TransactionTypeEnum,
  property_reference: z.string().max(100),
  property_address: z.string().min(5).max(500),

  // Parties
  client_name: z.string().min(1).max(200),
  client_email: z.string().email().optional(),
  client_phone: z.string().min(5).max(20),

  // Financial Details
  sale_price: z.number().positive(),
  commission_percentage: z.number().min(0).max(100),
  commission_amount: z.number().positive(),

  // Additional Fees
  admin_fee: z.number().min(0).default(0),
  referral_fee: z.number().min(0).default(0),
  other_fees: z.number().min(0).default(0),
  total_fees: z.number().min(0).default(0),

  // Net Commission
  net_commission: z.number(), // commission_amount - total_fees

  // Payment
  commission_status: CommissionStatusEnum.default('pending'),
  commission_received_amount: z.number().min(0).default(0),
  commission_due_date: z.string().datetime().optional(),
  commission_received_date: z.string().datetime().optional(),
  payment_method: z.string().max(100).optional(),
  payment_reference: z.string().max(200).optional(),

  // Status
  status: TransactionStatusEnum.default('pending'),

  // Important Dates
  contract_signed_date: z.string().datetime().optional(),
  completion_date: z.string().datetime().optional(),
  actual_completion_date: z.string().datetime().optional(),

  // Documents
  documents: z.array(
    z.object({
      name: z.string(),
      url: z.string().url(),
      type: z.enum([
        'contract',
        'mou',
        'invoice',
        'receipt',
        'passport',
        'emirates_id',
        'other',
      ]),
      uploaded_at: z.string().datetime(),
    })
  ).default([]),

  // Notes & Details
  notes: z.string().max(5000).optional(),
  internal_notes: z.string().max(5000).optional(),

  // Sharing (if co-broking)
  is_shared: z.boolean().default(false),
  sharing_agent_id: z.string().uuid().optional(),
  sharing_percentage: z.number().min(0).max(100).optional(),
  sharing_amount: z.number().min(0).optional(),

  // Tags
  tags: z.array(z.string()).default([]),

  // Timestamps
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Create Transaction
export const CreateTransactionSchema = TransactionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  net_commission: true, // Calculated field
}).partial({
  status: true,
  commission_status: true,
  admin_fee: true,
  referral_fee: true,
  other_fees: true,
  total_fees: true,
  commission_received_amount: true,
  is_shared: true,
  documents: true,
  tags: true,
});

// Update Transaction
export const UpdateTransactionSchema = TransactionSchema.partial().required({ id: true });

// Transaction Filters
export const TransactionFiltersSchema = z.object({
  agent_id: z.string().uuid().optional(),
  deal_id: z.string().uuid().optional(),
  listing_id: z.string().uuid().optional(),
  transaction_type: TransactionTypeEnum.optional(),
  status: TransactionStatusEnum.optional(),
  commission_status: CommissionStatusEnum.optional(),
  min_sale_price: z.number().positive().optional(),
  max_sale_price: z.number().positive().optional(),
  min_commission: z.number().positive().optional(),
  max_commission: z.number().positive().optional(),
  contract_signed_after: z.string().datetime().optional(),
  contract_signed_before: z.string().datetime().optional(),
  completion_after: z.string().datetime().optional(),
  completion_before: z.string().datetime().optional(),
  commission_overdue: z.boolean().optional(), // due_date < now && status != received
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Commission calculation helper
export const calculateCommission = (data: {
  sale_price: number;
  commission_percentage: number;
  admin_fee?: number;
  referral_fee?: number;
  other_fees?: number;
  sharing_percentage?: number;
}) => {
  const commission_amount = (data.sale_price * data.commission_percentage) / 100;
  const total_fees = (data.admin_fee || 0) + (data.referral_fee || 0) + (data.other_fees || 0);
  const net_commission = commission_amount - total_fees;

  let agent_commission = net_commission;
  let sharing_amount = 0;

  if (data.sharing_percentage) {
    sharing_amount = (net_commission * data.sharing_percentage) / 100;
    agent_commission = net_commission - sharing_amount;
  }

  return {
    commission_amount,
    total_fees,
    net_commission,
    agent_commission,
    sharing_amount,
  };
};

// Export types
export type Transaction = z.infer<typeof TransactionSchema>;
export type CreateTransaction = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransaction = z.infer<typeof UpdateTransactionSchema>;
export type TransactionFilters = z.infer<typeof TransactionFiltersSchema>;
export type TransactionType = z.infer<typeof TransactionTypeEnum>;
export type TransactionStatus = z.infer<typeof TransactionStatusEnum>;
export type CommissionStatus = z.infer<typeof CommissionStatusEnum>;
