import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, QueryOptions } from './base.repository';
import {
  Deal,
  CreateDeal,
  UpdateDeal,
  DealFilters,
  DealStage,
  CreateDealSchema,
  UpdateDealSchema,
  validateStageTransition,
} from '../schemas/deal.schema';

/**
 * Deal Repository
 * CRM pipeline/deal management repository
 */

export class DealRepository extends BaseRepository<Deal> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'deals', '*');
  }

  /**
   * Find deals by agent with filtering
   */
  async findByAgent(
    agentId: string,
    filters?: Partial<DealFilters>,
    options?: QueryOptions
  ): Promise<Deal[]> {
    return this.findAll({ agent_id: agentId, ...filters }, options);
  }

  /**
   * Find deals by stage
   */
  async findByStage(
    agentId: string,
    stage: DealStage,
    options?: QueryOptions
  ): Promise<Deal[]> {
    return this.findAll({ agent_id: agentId, stage }, options);
  }

  /**
   * Find deals needing action
   */
  async findNeedingAction(agentId: string): Promise<Deal[]> {
    const now = new Date().toISOString();

    const { data, error } = await this.query()
      .eq('agent_id', agentId)
      .not('stage', 'in', '(closed_won,closed_lost)')
      .lte('next_action_date', now)
      .order('next_action_date', { ascending: true });

    if (error) {
      throw this.handleError('findNeedingAction', error);
    }

    return (data as unknown as Deal[]) || [];
  }

  /**
   * Find high-value deals
   */
  async findHighValue(agentId: string, minValue: number = 1000000): Promise<Deal[]> {
    const { data, error } = await this.query()
      .eq('agent_id', agentId)
      .not('stage', 'in', '(closed_won,closed_lost)')
      .gte('value', minValue)
      .order('value', { ascending: false });

    if (error) {
      throw this.handleError('findHighValue', error);
    }

    return (data as unknown as Deal[]) || [];
  }

  /**
   * Find deals closing soon
   */
  async findClosingSoon(agentId: string, daysAhead: number = 30): Promise<Deal[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const { data, error } = await this.query()
      .eq('agent_id', agentId)
      .not('stage', 'in', '(closed_won,closed_lost)')
      .gte('expected_close_date', now.toISOString())
      .lte('expected_close_date', futureDate.toISOString())
      .order('expected_close_date', { ascending: true });

    if (error) {
      throw this.handleError('findClosingSoon', error);
    }

    return (data as unknown as Deal[]) || [];
  }

  /**
   * Create deal with validation
   */
  async create(entity: CreateDeal): Promise<Deal> {
    const validated = CreateDealSchema.parse(entity);

    // Calculate initial expected commission if not provided
    if (validated.value && validated.commission_percentage && !validated.expected_commission) {
      validated.expected_commission = (validated.value * validated.commission_percentage) / 100;
    }

    return super.create(validated as Partial<Deal>);
  }

  /**
   * Update deal with validation
   */
  async update(id: string, entity: Partial<UpdateDeal>): Promise<Deal> {
    const validated = UpdateDealSchema.partial().parse({ ...entity, id });

    // Recalculate expected commission if relevant fields changed
    if (validated.value || validated.commission_percentage) {
      const deal = await this.findById(id);
      if (deal) {
        const value = validated.value || deal.value || 0;
        const percentage = validated.commission_percentage || deal.commission_percentage || 0;
        validated.expected_commission = (value * percentage) / 100;
      }
    }

    return super.update(id, validated);
  }

  /**
   * Update deal stage with validation
   */
  async updateStage(id: string, newStage: DealStage, notes?: string): Promise<Deal> {
    const deal = await this.findById(id);
    if (!deal) {
      throw new Error(`Deal ${id} not found`);
    }

    // Validate stage transition
    if (!validateStageTransition(deal.stage, newStage)) {
      throw new Error(`Invalid stage transition from ${deal.stage} to ${newStage}`);
    }

    const updates: Partial<Deal> = {
      stage: newStage,
      last_activity_date: new Date().toISOString(),
    };

    // Set actual close date for terminal stages
    if (newStage === 'closed_won' || newStage === 'closed_lost') {
      updates.actual_close_date = new Date().toISOString();

      // Update probability
      updates.probability = newStage === 'closed_won' ? 100 : 0;
    }

    // Append notes if provided
    if (notes) {
      updates.notes = deal.notes
        ? `${deal.notes}\n\n[${new Date().toLocaleString()}] Stage: ${newStage}\n${notes}`
        : notes;
    }

    return super.update(id, updates);
  }

  /**
   * Set next action
   */
  async setNextAction(id: string, action: string, actionDate: string): Promise<Deal> {
    return super.update(id, {
      next_action: action,
      next_action_date: actionDate,
    });
  }

  /**
   * Record activity
   */
  async recordActivity(id: string, notes: string): Promise<Deal> {
    const deal = await this.findById(id);
    if (!deal) {
      throw new Error(`Deal ${id} not found`);
    }

    const updates: Partial<Deal> = {
      last_activity_date: new Date().toISOString(),
      notes: deal.notes
        ? `${deal.notes}\n\n[${new Date().toLocaleString()}] ${notes}`
        : notes,
    };

    return super.update(id, updates);
  }

  /**
   * Close deal as won
   */
  async closeWon(id: string, actualValue?: number): Promise<Deal> {
    const updates: Partial<Deal> = {
      stage: 'closed_won',
      actual_close_date: new Date().toISOString(),
      probability: 100,
    };

    if (actualValue) {
      updates.value = actualValue;
    }

    return super.update(id, updates);
  }

  /**
   * Close deal as lost
   */
  async closeLost(id: string, reason: string, reasonNotes?: string): Promise<Deal> {
    const updates: Partial<Deal> = {
      stage: 'closed_lost',
      actual_close_date: new Date().toISOString(),
      probability: 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      loss_reason: reason as any,
      loss_reason_notes: reasonNotes,
    };

    return super.update(id, updates);
  }

  /**
   * Get pipeline statistics for an agent
   */
  async getPipelineStats(agentId: string) {
    const { data, error } = await this.supabase
      .from('deals')
      .select('stage, value, probability, expected_commission')
      .eq('agent_id', agentId)
      .not('stage', 'in', '(closed_won,closed_lost)');

    if (error) {
      throw this.handleError('getPipelineStats', error);
    }

    const deals = data || [];

    const stats = {
      total_deals: deals.length,
      total_value: deals.reduce((sum, d) => sum + (d.value || 0), 0),
      weighted_value: deals.reduce((sum, d) => sum + (d.value || 0) * (d.probability || 0) / 100, 0),
      total_expected_commission: deals.reduce((sum, d) => sum + (d.expected_commission || 0), 0),
      weighted_commission: deals.reduce(
        (sum, d) => sum + (d.expected_commission || 0) * (d.probability || 0) / 100,
        0
      ),
      by_stage: deals.reduce((acc, d) => {
        acc[d.stage] = (acc[d.stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return stats;
  }

  /**
   * Get conversion metrics
   */
  async getConversionMetrics(agentId: string, startDate?: string, endDate?: string) {
    let query = this.supabase
      .from('deals')
      .select('stage, created_at, actual_close_date')
      .eq('agent_id', agentId);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw this.handleError('getConversionMetrics', error);
    }

    const deals = data || [];
    const total = deals.length;
    const won = deals.filter(d => d.stage === 'closed_won').length;
    const lost = deals.filter(d => d.stage === 'closed_lost').length;
    const active = deals.filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost').length;

    return {
      total,
      won,
      lost,
      active,
      win_rate: total > 0 ? (won / total) * 100 : 0,
      loss_rate: total > 0 ? (lost / total) * 100 : 0,
    };
  }
}
