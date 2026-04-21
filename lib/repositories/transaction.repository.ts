import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, QueryOptions } from './base.repository';
import {
  Transaction,
  CreateTransaction,
  UpdateTransaction,
  TransactionFilters,
  TransactionStatus,
  CommissionStatus,
  CreateTransactionSchema,
  UpdateTransactionSchema,
  calculateCommission,
} from '../schemas/transaction.schema';

/**
 * Transaction Repository
 * Transaction and commission tracking repository
 */

export class TransactionRepository extends BaseRepository<Transaction> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'transactions', '*');
  }

  /**
   * Find transactions by agent
   */
  async findByAgent(
    agentId: string,
    filters?: Partial<TransactionFilters>,
    options?: QueryOptions
  ): Promise<Transaction[]> {
    return this.findAll({ agent_id: agentId, ...filters }, options);
  }

  /**
   * Find pending commission transactions
   */
  async findPendingCommissions(agentId: string): Promise<Transaction[]> {
    const { data, error } = await this.query()
      .eq('agent_id', agentId)
      .in('commission_status', ['pending', 'invoiced'])
      .order('commission_due_date', { ascending: true });

    if (error) {
      throw this.handleError('findPendingCommissions', error);
    }

    return (data as unknown as Transaction[]) || [];
  }

  /**
   * Find overdue commissions
   */
  async findOverdueCommissions(agentId: string): Promise<Transaction[]> {
    const now = new Date().toISOString();

    const { data, error } = await this.query()
      .eq('agent_id', agentId)
      .not('commission_status', 'eq', 'received')
      .lt('commission_due_date', now)
      .order('commission_due_date', { ascending: true });

    if (error) {
      throw this.handleError('findOverdueCommissions', error);
    }

    return (data as unknown as Transaction[]) || [];
  }

  /**
   * Find completed transactions in date range
   */
  async findCompleted(
    agentId: string,
    startDate: string,
    endDate: string
  ): Promise<Transaction[]> {
    const { data, error } = await this.query()
      .eq('agent_id', agentId)
      .eq('status', 'completed')
      .gte('actual_completion_date', startDate)
      .lte('actual_completion_date', endDate)
      .order('actual_completion_date', { ascending: false });

    if (error) {
      throw this.handleError('findCompleted', error);
    }

    return (data as unknown as Transaction[]) || [];
  }

  /**
   * Create transaction with commission calculation
   */
  async create(entity: CreateTransaction): Promise<Transaction> {
    const validated = CreateTransactionSchema.parse(entity);

    // Calculate commission breakdown
    const commissionBreakdown = calculateCommission({
      sale_price: validated.sale_price,
      commission_percentage: validated.commission_percentage,
      admin_fee: validated.admin_fee,
      referral_fee: validated.referral_fee,
      other_fees: validated.other_fees,
      sharing_percentage: validated.sharing_percentage,
    });

    // Add calculated fields
    const transactionData: Partial<Transaction> = {
      ...validated,
      commission_amount: commissionBreakdown.commission_amount,
      total_fees: commissionBreakdown.total_fees,
      net_commission: commissionBreakdown.net_commission,
      sharing_amount: validated.is_shared ? commissionBreakdown.sharing_amount : undefined,
    };

    return super.create(transactionData);
  }

  /**
   * Update transaction with recalculation if needed
   */
  async update(id: string, entity: Partial<UpdateTransaction>): Promise<Transaction> {
    const validated = UpdateTransactionSchema.partial().parse({ ...entity, id });

    // Recalculate commission if financial fields changed
    if (
      validated.sale_price ||
      validated.commission_percentage ||
      validated.admin_fee ||
      validated.referral_fee ||
      validated.other_fees ||
      validated.sharing_percentage !== undefined
    ) {
      const transaction = await this.findById(id);
      if (transaction) {
        const commissionBreakdown = calculateCommission({
          sale_price: validated.sale_price || transaction.sale_price,
          commission_percentage: validated.commission_percentage || transaction.commission_percentage,
          admin_fee: validated.admin_fee ?? transaction.admin_fee,
          referral_fee: validated.referral_fee ?? transaction.referral_fee,
          other_fees: validated.other_fees ?? transaction.other_fees,
          sharing_percentage: validated.sharing_percentage ?? transaction.sharing_percentage,
        });

        validated.commission_amount = commissionBreakdown.commission_amount;
        validated.total_fees = commissionBreakdown.total_fees;
        validated.net_commission = commissionBreakdown.net_commission;
        validated.sharing_amount = (validated.is_shared ?? transaction.is_shared)
          ? commissionBreakdown.sharing_amount
          : undefined;
      }
    }

    return super.update(id, validated);
  }

  /**
   * Update transaction status
   */
  async updateStatus(id: string, status: TransactionStatus): Promise<Transaction> {
    const updates: Partial<Transaction> = { status };

    // Set actual completion date when completed
    if (status === 'completed') {
      updates.actual_completion_date = new Date().toISOString();
    }

    return super.update(id, updates);
  }

  /**
   * Update commission status
   */
  async updateCommissionStatus(
    id: string,
    commissionStatus: CommissionStatus,
    receivedAmount?: number
  ): Promise<Transaction> {
    const updates: Partial<Transaction> = {
      commission_status: commissionStatus,
    };

    if (receivedAmount !== undefined) {
      updates.commission_received_amount = receivedAmount;
    }

    if (commissionStatus === 'received') {
      updates.commission_received_date = new Date().toISOString();
    }

    return super.update(id, updates);
  }

  /**
   * Record commission payment
   */
  async recordPayment(
    id: string,
    amount: number,
    paymentMethod: string,
    reference?: string
  ): Promise<Transaction> {
    const transaction = await this.findById(id);
    if (!transaction) {
      throw new Error(`Transaction ${id} not found`);
    }

    const newReceivedAmount = transaction.commission_received_amount + amount;
    const isFullyPaid = newReceivedAmount >= transaction.commission_amount;

    const updates: Partial<Transaction> = {
      commission_received_amount: newReceivedAmount,
      commission_status: isFullyPaid
        ? 'received'
        : newReceivedAmount > 0
        ? 'partially_received'
        : 'invoiced',
      payment_method: paymentMethod,
      payment_reference: reference,
    };

    if (isFullyPaid) {
      updates.commission_received_date = new Date().toISOString();
    }

    return super.update(id, updates);
  }

  /**
   * Add document to transaction
   */
  async addDocument(
    id: string,
    document: {
      name: string;
      url: string;
      type: 'contract' | 'mou' | 'invoice' | 'receipt' | 'passport' | 'emirates_id' | 'other';
    }
  ): Promise<Transaction> {
    const transaction = await this.findById(id);
    if (!transaction) {
      throw new Error(`Transaction ${id} not found`);
    }

    const documents = transaction.documents || [];
    documents.push({
      ...document,
      uploaded_at: new Date().toISOString(),
    });

    return super.update(id, { documents });
  }

  /**
   * Get commission statistics for an agent
   */
  async getCommissionStats(agentId: string, startDate?: string, endDate?: string) {
    let query = this.supabase
      .from('transactions')
      .select('commission_amount, net_commission, commission_received_amount, commission_status, status')
      .eq('agent_id', agentId);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw this.handleError('getCommissionStats', error);
    }

    const transactions = data || [];

    const stats = {
      total_transactions: transactions.length,
      completed_transactions: transactions.filter(t => t.status === 'completed').length,
      total_commission_expected: transactions.reduce((sum, t) => sum + t.commission_amount, 0),
      total_net_commission: transactions.reduce((sum, t) => sum + t.net_commission, 0),
      total_commission_received: transactions.reduce((sum, t) => sum + t.commission_received_amount, 0),
      pending_commission: transactions
        .filter(t => t.commission_status !== 'received')
        .reduce((sum, t) => sum + (t.commission_amount - t.commission_received_amount), 0),
      by_status: {
        pending: transactions.filter(t => t.commission_status === 'pending').length,
        invoiced: transactions.filter(t => t.commission_status === 'invoiced').length,
        partially_received: transactions.filter(t => t.commission_status === 'partially_received').length,
        received: transactions.filter(t => t.commission_status === 'received').length,
        disputed: transactions.filter(t => t.commission_status === 'disputed').length,
      },
    };

    return stats;
  }

  /**
   * Get monthly revenue report
   */
  async getMonthlyRevenue(agentId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    return this.getCommissionStats(agentId, startDate, endDate);
  }

  /**
   * Get annual revenue report
   */
  async getAnnualRevenue(agentId: string, year: number) {
    const startDate = new Date(year, 0, 1).toISOString();
    const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();

    return this.getCommissionStats(agentId, startDate, endDate);
  }
}
