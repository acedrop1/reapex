import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Base Repository Pattern
 * Provides common CRUD operations for all domain repositories
 * Implements type-safe database operations with proper error handling
 */

export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findAll(filters?: Record<string, any>): Promise<T[]>;
  create(entity: Partial<T>): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: { column: string; ascending?: boolean };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class BaseRepository<T extends Record<string, any>> implements IRepository<T> {
  protected readonly supabase: SupabaseClient;
  protected readonly tableName: string;
  protected readonly selectFields: string;

  constructor(
    supabase: SupabaseClient,
    tableName: string,
    selectFields: string = '*'
  ) {
    this.supabase = supabase;
    this.tableName = tableName;
    this.selectFields = selectFields;
  }

  /**
   * Find a single record by ID
   */
  async findById(id: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(this.selectFields)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw this.handleError('findById', error);
    }

    return data as unknown as T;
  }

  /**
   * Find all records with optional filtering and pagination
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async findAll(filters?: Record<string, any>, options?: QueryOptions): Promise<T[]> {
    let query = this.supabase.from(this.tableName).select(this.selectFields);

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    // Apply ordering
    if (options?.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true,
      });
    }

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
      throw this.handleError('findAll', error);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as unknown as T[]) || [];
  }

  /**
   * Create a new record
   */
  async create(entity: Partial<T>): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(entity)
      .select(this.selectFields)
      .single();

    if (error) {
      throw this.handleError('create', error);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data as unknown as T;
  }

  /**
   * Update an existing record
   */
  async update(id: string, entity: Partial<T>): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(entity)
      .eq('id', id)
      .select(this.selectFields)
      .single();

    if (error) {
      throw this.handleError('update', error);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data as unknown as T;
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw this.handleError('delete', error);
    }
  }

  /**
   * Check if a record exists by ID
   */
  async exists(id: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('id')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw this.handleError('exists', error);
    }

    return !!data;
  }

  /**
   * Count records with optional filtering
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async count(filters?: Record<string, any>): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('id', { count: 'exact', head: true });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    const { count, error } = await query;

    if (error) {
      throw this.handleError('count', error);
    }

    return count || 0;
  }

  /**
   * Execute a custom query with the repository's table
   */
  protected query() {
    return this.supabase.from(this.tableName).select(this.selectFields);
  }

  /**
   * Handle database errors with context
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected handleError(operation: string, error: any): Error {
    const message = `${this.tableName}.${operation}: ${error.message}`;
    const err = new Error(message);
    err.cause = error;
    return err;
  }

  /**
   * Transaction support (if needed for complex operations)
   */
  protected async transaction<R>(
    callback: (client: SupabaseClient) => Promise<R>
  ): Promise<R> {
    // Supabase doesn't have explicit transaction API in JS client
    // but operations are atomic by default
    return callback(this.supabase);
  }
}
