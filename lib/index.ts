/**
 * Library Index
 * Central export point for all library modules
 */

// Repositories
export { BaseRepository } from './repositories/base.repository';
export { ListingRepository } from './repositories/listing.repository';
export { ContactRepository } from './repositories/contact.repository';
export { DealRepository } from './repositories/deal.repository';
export { TransactionRepository } from './repositories/transaction.repository';

// Schemas & Types - Listing
export {
  ListingSchema,
  CreateListingSchema,
  UpdateListingSchema,
  ListingFiltersSchema,
  PropertyTypeEnum,
  ListingTypeEnum,
  ListingStatusEnum,
} from './schemas/listing.schema';
export type {
  Listing,
  CreateListing,
  UpdateListing,
  ListingFilters,
  PropertyType,
  ListingType,
  ListingStatus,
} from './schemas/listing.schema';

// Schemas & Types - Contact
export {
  ContactSchema,
  CreateContactSchema,
  UpdateContactSchema,
  ContactFiltersSchema,
  ContactTypeEnum,
  ContactSourceEnum,
  ContactStatusEnum,
} from './schemas/contact.schema';
export type {
  Contact,
  CreateContact,
  UpdateContact,
  ContactFilters,
  ContactType,
  ContactSource,
  ContactStatus,
} from './schemas/contact.schema';

// Schemas & Types - Deal
export {
  DealSchema,
  CreateDealSchema,
  UpdateDealSchema,
  DealFiltersSchema,
  DealStageEnum,
  DealTypeEnum,
  DealPriorityEnum,
  validateStageTransition,
} from './schemas/deal.schema';
export type {
  Deal,
  CreateDeal,
  UpdateDeal,
  DealFilters,
  DealStage,
  DealType,
  DealPriority,
} from './schemas/deal.schema';

// Schemas & Types - Transaction
export {
  TransactionSchema,
  CreateTransactionSchema,
  UpdateTransactionSchema,
  TransactionFiltersSchema,
  TransactionTypeEnum,
  TransactionStatusEnum,
  CommissionStatusEnum,
  calculateCommission,
} from './schemas/transaction.schema';
export type {
  Transaction,
  CreateTransaction,
  UpdateTransaction,
  TransactionFilters,
  TransactionType,
  TransactionStatus,
  CommissionStatus,
} from './schemas/transaction.schema';

// Services
export { CommissionService, DEFAULT_COMMISSION_RULES } from './services/commission.service';
export type {
  CommissionTier,
  CommissionRule,
  CommissionSplit,
} from './services/commission.service';

// Utilities
export {
  createServerSupabaseClient,
  createBrowserSupabaseClient,
  createApiSupabaseClient,
  createAdminSupabaseClient,
} from './utils/supabase-factory';
export type {
  SupabaseClient,
  SupabaseBrowserClient,
  SupabaseAdminClient,
} from './utils/supabase-factory';

// Error Handling
export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError,
  handleApiError,
  asyncHandler,
  tryCatch,
  assert,
  isAppError,
  logError,
} from './utils/errors';
