import { TransactionRepository } from '../repositories/transaction.repository';
import { DealRepository } from '../repositories/deal.repository';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Commission Service
 * Centralized business logic for commission calculations and workflows
 */

export interface CommissionTier {
  min: number;
  max: number;
  percentage: number;
}

export interface CommissionRule {
  transactionType: 'sale' | 'rental';
  tiers: CommissionTier[];
  flatFee?: number;
}

export interface CommissionSplit {
  agentId: string;
  percentage: number;
  amount: number;
}

export class CommissionService {
  private transactionRepository: TransactionRepository;
  private dealRepository: DealRepository;

  constructor(supabase: SupabaseClient) {
    this.transactionRepository = new TransactionRepository(supabase);
    this.dealRepository = new DealRepository(supabase);
  }

  /**
   * Calculate commission based on tiered structure
   * Example: 0-500K = 3%, 500K-1M = 2.5%, 1M+ = 2%
   */
  calculateTieredCommission(salePrice: number, rule: CommissionRule): number {
    let commission = rule.flatFee || 0;

    for (const tier of rule.tiers) {
      if (salePrice > tier.min) {
        const applicableAmount = Math.min(salePrice, tier.max) - tier.min;
        commission += (applicableAmount * tier.percentage) / 100;
      }
    }

    return commission;
  }

  /**
   * Calculate commission split for co-broking deals
   */
  calculateCommissionSplit(
    totalCommission: number,
    splits: { agentId: string; percentage: number }[]
  ): CommissionSplit[] {
    const totalPercentage = splits.reduce((sum, split) => sum + split.percentage, 0);

    if (totalPercentage !== 100) {
      throw new Error(`Commission split percentages must total 100%, got ${totalPercentage}%`);
    }

    return splits.map(split => ({
      agentId: split.agentId,
      percentage: split.percentage,
      amount: (totalCommission * split.percentage) / 100,
    }));
  }

  /**
   * Calculate net commission after fees
   */
  calculateNetCommission(params: {
    grossCommission: number;
    adminFee?: number;
    referralFee?: number;
    otherFees?: number;
    adminFeePercentage?: number; // If admin fee is percentage-based
  }): {
    grossCommission: number;
    adminFee: number;
    referralFee: number;
    otherFees: number;
    totalFees: number;
    netCommission: number;
  } {
    const adminFee = params.adminFee ||
      (params.adminFeePercentage ? (params.grossCommission * params.adminFeePercentage) / 100 : 0);
    const referralFee = params.referralFee || 0;
    const otherFees = params.otherFees || 0;
    const totalFees = adminFee + referralFee + otherFees;
    const netCommission = params.grossCommission - totalFees;

    return {
      grossCommission: params.grossCommission,
      adminFee,
      referralFee,
      otherFees,
      totalFees,
      netCommission,
    };
  }

  /**
   * Calculate monthly commission forecast based on pipeline
   */
  async calculatePipelineForecast(agentId: string): Promise<{
    thisMonth: number;
    nextMonth: number;
    thisQuarter: number;
    weightedPipeline: number;
  }> {
    const now = new Date();
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const thisQuarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);

    const deals = await this.dealRepository
      .findAll({
        agent_id: agentId,
        stage: 'negotiating', // Can be expanded to include other active stages
      });

    let thisMonth = 0;
    let nextMonth = 0;
    let thisQuarter = 0;
    let weightedPipeline = 0;

    for (const deal of deals || []) {
      const expectedCommission = deal.expected_commission || 0;
      const probability = (deal.probability || 0) / 100;
      const weightedValue = expectedCommission * probability;

      weightedPipeline += weightedValue;

      if (deal.expected_close_date) {
        const closeDate = new Date(deal.expected_close_date);

        if (closeDate <= thisMonthEnd) {
          thisMonth += weightedValue;
        } else if (closeDate <= nextMonthEnd) {
          nextMonth += weightedValue;
        }

        if (closeDate <= thisQuarterEnd) {
          thisQuarter += weightedValue;
        }
      }
    }

    return {
      thisMonth,
      nextMonth,
      thisQuarter,
      weightedPipeline,
    };
  }

  /**
   * Calculate Year-to-Date (YTD) commission
   */
  async calculateYTDCommission(agentId: string): Promise<{
    totalCommissionExpected: number;
    totalCommissionReceived: number;
    pendingCommission: number;
    completedTransactions: number;
  }> {
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
    const stats = await this.transactionRepository.getCommissionStats(agentId, yearStart);

    return {
      totalCommissionExpected: stats.total_commission_expected,
      totalCommissionReceived: stats.total_commission_received,
      pendingCommission: stats.pending_commission,
      completedTransactions: stats.completed_transactions,
    };
  }

  /**
   * Calculate commission payout schedule
   */
  calculatePayoutSchedule(params: {
    totalCommission: number;
    paymentTerms: 'immediate' | 'net-30' | 'net-60' | 'installments';
    contractSignedDate: Date;
    completionDate?: Date;
    installmentCount?: number;
  }): Array<{
    dueDate: Date;
    amount: number;
    description: string;
  }> {
    const schedule: Array<{
      dueDate: Date;
      amount: number;
      description: string;
    }> = [];

    switch (params.paymentTerms) {
      case 'immediate':
        schedule.push({
          dueDate: params.completionDate || params.contractSignedDate,
          amount: params.totalCommission,
          description: 'Full commission payment',
        });
        break;

      case 'net-30':
        schedule.push({
          dueDate: new Date(params.contractSignedDate.getTime() + 30 * 24 * 60 * 60 * 1000),
          amount: params.totalCommission,
          description: 'Full commission payment (Net 30)',
        });
        break;

      case 'net-60':
        schedule.push({
          dueDate: new Date(params.contractSignedDate.getTime() + 60 * 24 * 60 * 60 * 1000),
          amount: params.totalCommission,
          description: 'Full commission payment (Net 60)',
        });
        break;

      case 'installments':
        const installments = params.installmentCount || 3;
        const installmentAmount = params.totalCommission / installments;

        for (let i = 0; i < installments; i++) {
          schedule.push({
            dueDate: new Date(params.contractSignedDate.getTime() + (i + 1) * 30 * 24 * 60 * 60 * 1000),
            amount: installmentAmount,
            description: `Installment ${i + 1} of ${installments}`,
          });
        }
        break;
    }

    return schedule;
  }

  /**
   * Validate commission calculation against business rules
   */
  validateCommission(params: {
    salePrice: number;
    commissionPercentage: number;
    commissionAmount: number;
    transactionType: 'sale' | 'rental';
  }): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Business rules validation
    const calculatedCommission = (params.salePrice * params.commissionPercentage) / 100;

    if (Math.abs(calculatedCommission - params.commissionAmount) > 0.01) {
      errors.push(
        `Commission amount ${params.commissionAmount} doesn't match calculated value ${calculatedCommission.toFixed(2)}`
      );
    }

    // Warning for unusually high commission percentages
    if (params.transactionType === 'sale' && params.commissionPercentage > 5) {
      warnings.push(`Commission percentage ${params.commissionPercentage}% is higher than typical 2-3% for sales`);
    }

    if (params.transactionType === 'rental' && params.commissionPercentage > 10) {
      warnings.push(`Commission percentage ${params.commissionPercentage}% is higher than typical 5-8% for rentals`);
    }

    // Warning for very low commissions
    if (params.commissionPercentage < 1) {
      warnings.push(`Commission percentage ${params.commissionPercentage}% is unusually low`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Calculate average deal size and commission for an agent
   */
  async calculateAverageMetrics(agentId: string, days: number = 90) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactions = await this.transactionRepository.findAll(
      {
        agent_id: agentId,
        status: 'completed',
      }
    );

    if (!transactions || transactions.length === 0) {
      return {
        averageDealSize: 0,
        averageCommission: 0,
        averageCommissionPercentage: 0,
        totalDeals: 0,
      };
    }

    const totalDealValue = transactions.reduce((sum, t) => sum + t.sale_price, 0);
    const totalCommission = transactions.reduce((sum, t) => sum + t.commission_amount, 0);

    return {
      averageDealSize: totalDealValue / transactions.length,
      averageCommission: totalCommission / transactions.length,
      averageCommissionPercentage:
        (totalCommission / totalDealValue) * 100,
      totalDeals: transactions.length,
    };
  }
}

/**
 * Default commission rules for UAE real estate
 */
export const DEFAULT_COMMISSION_RULES: Record<string, CommissionRule> = {
  sale: {
    transactionType: 'sale',
    tiers: [
      { min: 0, max: 500000, percentage: 3 },
      { min: 500000, max: 1000000, percentage: 2.5 },
      { min: 1000000, max: Infinity, percentage: 2 },
    ],
  },
  rental: {
    transactionType: 'rental',
    tiers: [
      { min: 0, max: Infinity, percentage: 5 },
    ],
  },
};
