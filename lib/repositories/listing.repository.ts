import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, QueryOptions } from './base.repository';
import {
  Listing,
  CreateListing,
  UpdateListing,
  ListingFilters,
  ListingStatus,
  CreateListingSchema,
  UpdateListingSchema,
} from '../schemas/listing.schema';

/**
 * Listing Repository
 * Domain-specific repository for property listings
 * Handles all listing-related database operations
 */

export class ListingRepository extends BaseRepository<Listing> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'listings', '*');
  }

  /**
   * Find active listings with optional filtering
   */
  async findActive(filters?: ListingFilters, options?: QueryOptions): Promise<Listing[]> {
    let query = this.query()
      .eq('status', 'active')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters
    query = this.applyFilters(query, filters);

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 10) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      throw this.handleError('findActive', error);
    }

    return (data as unknown as Listing[]) || [];
  }

  /**
   * Find featured listings
   */
  async findFeatured(limit: number = 6): Promise<Listing[]> {
    const { data, error } = await this.query()
      .eq('status', 'active')
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw this.handleError('findFeatured', error);
    }

    return (data as unknown as Listing[]) || [];
  }

  /**
   * Find listings by agent
   */
  async findByAgent(
    agentId: string,
    filters?: Partial<ListingFilters>,
    options?: QueryOptions
  ): Promise<Listing[]> {
    return this.findAll({ agent_id: agentId, ...filters }, options);
  }

  /**
   * Find listing by slug
   */
  async findBySlug(city: string, slug: string): Promise<Listing | null> {
    const normalizedCity = this.normalizeCity(city);

    const { data, error } = await this.query()
      .eq('slug', slug)
      .ilike('property_city', normalizedCity)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw this.handleError('findBySlug', error);
    }

    return data as unknown as Listing;
  }

  /**
   * Find listings by city
   */
  async findByCity(
    city: string,
    filters?: Partial<ListingFilters>,
    options?: QueryOptions
  ): Promise<Listing[]> {
    const normalizedCity = this.normalizeCity(city);

    let query = this.query()
      .ilike('property_city', normalizedCity)
      .eq('status', 'active')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply additional filters
    query = this.applyFilters(query, filters);

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 10) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      throw this.handleError('findByCity', error);
    }

    return (data as unknown as Listing[]) || [];
  }

  /**
   * Find similar listings (based on property type, area, price range)
   */
  async findSimilar(listingId: string, limit: number = 4): Promise<Listing[]> {
    // Get the reference listing
    const listing = await this.findById(listingId);
    if (!listing) {
      return [];
    }

    // Find similar listings
    const priceRange = listing.price * 0.2; // ±20% price range
    const { data, error } = await this.query()
      .eq('status', 'active')
      .eq('property_type', listing.property_type)
      .eq('listing_type', listing.listing_type)
      .eq('property_city', listing.property_city)
      .gte('price', listing.price - priceRange)
      .lte('price', listing.price + priceRange)
      .neq('id', listingId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw this.handleError('findSimilar', error);
    }

    return (data as unknown as Listing[]) || [];
  }

  /**
   * Search listings with full-text search
   */
  async search(
    searchTerm: string,
    filters?: Partial<ListingFilters>,
    options?: QueryOptions
  ): Promise<Listing[]> {
    let query = this.query().eq('status', 'active');

    // Apply text search across multiple fields
    const searchPattern = `%${searchTerm}%`;
    query = query.or(
      `title.ilike.${searchPattern},` +
      `description.ilike.${searchPattern},` +
      `property_address.ilike.${searchPattern},` +
      `property_area.ilike.${searchPattern},` +
      `reference_number.ilike.${searchPattern}`
    );

    // Apply additional filters
    query = this.applyFilters(query, filters);

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 10) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      throw this.handleError('search', error);
    }

    return (data as unknown as Listing[]) || [];
  }

  /**
   * Create listing with validation
   * Note: slug is auto-generated by database trigger
   */
  async create(entity: CreateListing): Promise<Listing> {
    // Validate input
    const validated = CreateListingSchema.parse(entity);

    return super.create(validated as Partial<Listing>);
  }

  /**
   * Update listing with validation
   * Note: slug is auto-updated by database trigger when listing_title changes
   */
  async update(id: string, entity: Partial<UpdateListing>): Promise<Listing> {
    // Validate input
    const validated = UpdateListingSchema.partial().parse({ ...entity, id });

    return super.update(id, validated);
  }

  /**
   * Update listing status
   */
  async updateStatus(id: string, status: ListingStatus): Promise<Listing> {
    const updates: Partial<Listing> = { status };

    // Set published_at when status changes to active
    // Note: published_at field is not in the current schema
    // if (status === 'active') {
    //   updates.published_at = new Date().toISOString();
    // }

    return super.update(id, updates);
  }

  /**
   * Toggle featured status
   */
  async toggleFeatured(id: string): Promise<Listing> {
    const listing = await this.findById(id);
    if (!listing) {
      throw new Error(`Listing ${id} not found`);
    }

    return super.update(id, { featured: !listing.featured });
  }

  /**
   * Get listing statistics for an agent
   */
  async getAgentStats(agentId: string) {
    const { data, error } = await this.supabase
      .from('listings')
      .select('status')
      .eq('agent_id', agentId);

    if (error) {
      throw this.handleError('getAgentStats', error);
    }

    const listings = data || [];
    const stats = {
      total: listings.length,
      active: listings.filter(l => l.status === 'active').length,
      draft: listings.filter(l => l.status === 'draft').length,
      sold: listings.filter(l => l.status === 'sold').length,
      rented: listings.filter(l => l.status === 'rented').length,
      pending: listings.filter(l => l.status === 'pending').length,
    };

    return stats;
  }

  /**
   * Apply filters to query
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private applyFilters(query: any, filters?: Partial<ListingFilters>) {
    if (!filters) return query;

    if (filters.property_type) {
      query = query.eq('property_type', filters.property_type);
    }
    if (filters.listing_type) {
      query = query.eq('listing_type', filters.listing_type);
    }
    if (filters.city) {
      query = query.ilike('property_city', `%${filters.city}%`);
    }
    // Note: emirate and area fields are not in the current schema
    // if (filters.emirate) {
    //   query = query.ilike('property_emirate', `%${filters.emirate}%`);
    // }
    // if (filters.area) {
    //   query = query.ilike('property_area', `%${filters.area}%`);
    // }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.featured !== undefined) {
      query = query.eq('featured', filters.featured);
    }
    if (filters.min_price) {
      query = query.gte('price', filters.min_price);
    }
    if (filters.max_price) {
      query = query.lte('price', filters.max_price);
    }
    if (filters.min_bedrooms !== undefined) {
      query = query.gte('bedrooms', filters.min_bedrooms);
    }
    if (filters.max_bedrooms !== undefined) {
      query = query.lte('bedrooms', filters.max_bedrooms);
    }
    if (filters.min_bathrooms !== undefined) {
      query = query.gte('bathrooms', filters.min_bathrooms);
    }
    if (filters.max_bathrooms !== undefined) {
      query = query.lte('bathrooms', filters.max_bathrooms);
    }
    // Note: min_size, max_size, and furnishing fields are not in the current schema
    // if (filters.min_size) {
    //   query = query.gte('size_sqft', filters.min_size);
    // }
    // if (filters.max_size) {
    //   query = query.lte('size_sqft', filters.max_size);
    // }
    // if (filters.furnishing) {
    //   query = query.eq('furnishing', filters.furnishing);
    // }

    return query;
  }

  /**
   * Generate URL-friendly slug from title
   * Note: In production, slug is auto-generated by database trigger
   * This method is kept for testing and client-side preview purposes
   */
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
  }

  /**
   * Normalize city name for consistent URL matching
   * Converts "Fort Lee" to "fort-lee" for URL-safe format
   */
  normalizeCity(city: string): string {
    return city
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  /**
   * Denormalize city name for display
   * Converts "fort-lee" to "Fort Lee"
   */
  denormalizeCity(city: string): string {
    return city
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
