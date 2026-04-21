import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, QueryOptions } from './base.repository';
import {
  Contact,
  CreateContact,
  UpdateContact,
  ContactFilters,
  ContactStatus,
  CreateContactSchema,
  UpdateContactSchema,
} from '../schemas/contact.schema';

/**
 * Contact Repository
 * CRM contact management repository
 */

export class ContactRepository extends BaseRepository<Contact> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'contacts', '*');
  }

  /**
   * Find contacts by agent with filtering
   */
  async findByAgent(
    agentId: string,
    filters?: Partial<ContactFilters>,
    options?: QueryOptions
  ): Promise<Contact[]> {
    return this.findAll({ agent_id: agentId, ...filters }, options);
  }

  /**
   * Find contacts needing follow-up
   */
  async findNeedingFollowup(agentId: string): Promise<Contact[]> {
    const now = new Date().toISOString();

    const { data, error } = await this.query()
      .eq('agent_id', agentId)
      .not('status', 'in', '(converted,lost,archived)')
      .lte('next_followup_date', now)
      .order('next_followup_date', { ascending: true });

    if (error) {
      throw this.handleError('findNeedingFollowup', error);
    }

    return (data as unknown as Contact[]) || [];
  }

  /**
   * Find hot leads (recent contacts with high potential)
   */
  async findHotLeads(agentId: string, limit: number = 10): Promise<Contact[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await this.query()
      .eq('agent_id', agentId)
      .eq('status', 'qualified')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw this.handleError('findHotLeads', error);
    }

    return (data as unknown as Contact[]) || [];
  }

  /**
   * Search contacts (name, email, phone)
   */
  async search(
    agentId: string,
    searchTerm: string,
    options?: QueryOptions
  ): Promise<Contact[]> {
    const searchPattern = `%${searchTerm}%`;

    let query = this.query()
      .eq('agent_id', agentId)
      .or(
        `first_name.ilike.${searchPattern},` +
        `last_name.ilike.${searchPattern},` +
        `email.ilike.${searchPattern},` +
        `phone.ilike.${searchPattern},` +
        `company.ilike.${searchPattern}`
      );

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 10) - 1
      );
    }

    const { data, error} = await query;

    if (error) {
      throw this.handleError('search', error);
    }

    return (data as unknown as Contact[]) || [];
  }

  /**
   * Create contact with validation
   */
  async create(entity: CreateContact): Promise<Contact> {
    const validated = CreateContactSchema.parse(entity);
    return super.create(validated as Partial<Contact>);
  }

  /**
   * Update contact with validation
   */
  async update(id: string, entity: Partial<UpdateContact>): Promise<Contact> {
    const validated = UpdateContactSchema.partial().parse({ ...entity, id });
    return super.update(id, validated);
  }

  /**
   * Update contact status
   */
  async updateStatus(id: string, status: ContactStatus): Promise<Contact> {
    const updates: Partial<Contact> = {
      status,
      last_contact_date: new Date().toISOString(),
    };

    return super.update(id, updates);
  }

  /**
   * Record contact interaction
   */
  async recordInteraction(id: string, notes?: string): Promise<Contact> {
    const contact = await this.findById(id);
    if (!contact) {
      throw new Error(`Contact ${id} not found`);
    }

    const updates: Partial<Contact> = {
      last_contact_date: new Date().toISOString(),
    };

    if (notes) {
      updates.notes = contact.notes
        ? `${contact.notes}\n\n[${new Date().toLocaleString()}] ${notes}`
        : notes;
    }

    return super.update(id, updates);
  }

  /**
   * Set follow-up reminder
   */
  async setFollowup(id: string, date: string, notes?: string): Promise<Contact> {
    const updates: Partial<Contact> = {
      next_followup_date: date,
    };

    if (notes) {
      const contact = await this.findById(id);
      if (contact) {
        updates.notes = contact.notes
          ? `${contact.notes}\n\n[Follow-up scheduled for ${new Date(date).toLocaleDateString()}] ${notes}`
          : notes;
      }
    }

    return super.update(id, updates);
  }

  /**
   * Add tags to contact
   */
  async addTags(id: string, newTags: string[]): Promise<Contact> {
    const contact = await this.findById(id);
    if (!contact) {
      throw new Error(`Contact ${id} not found`);
    }

    const existingTags = contact.tags || [];
    const uniqueTags = Array.from(new Set([...existingTags, ...newTags]));

    return super.update(id, { tags: uniqueTags });
  }

  /**
   * Remove tags from contact
   */
  async removeTags(id: string, tagsToRemove: string[]): Promise<Contact> {
    const contact = await this.findById(id);
    if (!contact) {
      throw new Error(`Contact ${id} not found`);
    }

    const updatedTags = (contact.tags || []).filter(
      tag => !tagsToRemove.includes(tag)
    );

    return super.update(id, { tags: updatedTags });
  }

  /**
   * Get contact statistics for an agent
   */
  async getAgentStats(agentId: string) {
    const { data, error } = await this.supabase
      .from('contacts')
      .select('status, contact_type, source')
      .eq('agent_id', agentId);

    if (error) {
      throw this.handleError('getAgentStats', error);
    }

    const contacts = data || [];
    const stats = {
      total: contacts.length,
      by_status: {
        new: contacts.filter(c => c.status === 'new').length,
        contacted: contacts.filter(c => c.status === 'contacted').length,
        qualified: contacts.filter(c => c.status === 'qualified').length,
        negotiating: contacts.filter(c => c.status === 'negotiating').length,
        converted: contacts.filter(c => c.status === 'converted').length,
        lost: contacts.filter(c => c.status === 'lost').length,
      },
      by_type: {
        buyer: contacts.filter(c => c.contact_type === 'buyer').length,
        seller: contacts.filter(c => c.contact_type === 'seller').length,
        landlord: contacts.filter(c => c.contact_type === 'landlord').length,
        tenant: contacts.filter(c => c.contact_type === 'tenant').length,
        lead: contacts.filter(c => c.contact_type === 'lead').length,
      },
      by_source: contacts.reduce((acc, c) => {
        acc[c.source] = (acc[c.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return stats;
  }

  /**
   * Find duplicate contacts (by email or phone)
   */
  async findDuplicates(email?: string, phone?: string): Promise<Contact[]> {
    if (!email && !phone) {
      return [];
    }

    let query = this.query();

    if (email && phone) {
      query = query.or(`email.eq.${email},phone.eq.${phone}`);
    } else if (email) {
      query = query.eq('email', email);
    } else if (phone) {
      query = query.eq('phone', phone);
    }

    const { data, error } = await query;

    if (error) {
      throw this.handleError('findDuplicates', error);
    }

    return (data as unknown as Contact[]) || [];
  }

  /**
   * Attach file to contact
   */
  async attachFile(
    id: string,
    fileUrl: string,
    fileName: string,
    metadata?: Record<string, any>
  ): Promise<Contact> {
    const contact = await this.findById(id);
    if (!contact) {
      throw new Error(`Contact ${id} not found`);
    }

    const fileUrls = [...(contact.file_urls || []), fileUrl];
    const attachmentNames = [...(contact.attachment_names || []), fileName];
    const attachmentMetadata = contact.attachment_metadata || {};

    if (metadata) {
      attachmentMetadata[fileUrl] = metadata;
    }

    return super.update(id, {
      file_urls: fileUrls,
      attachment_names: attachmentNames,
      attachment_metadata: attachmentMetadata,
    });
  }

  /**
   * Remove file from contact
   */
  async removeFile(id: string, fileUrl: string): Promise<Contact> {
    const contact = await this.findById(id);
    if (!contact) {
      throw new Error(`Contact ${id} not found`);
    }

    const fileIndex = (contact.file_urls || []).indexOf(fileUrl);
    if (fileIndex === -1) {
      throw new Error(`File ${fileUrl} not found in contact attachments`);
    }

    const fileUrls = [...(contact.file_urls || [])];
    const attachmentNames = [...(contact.attachment_names || [])];
    const attachmentMetadata = { ...(contact.attachment_metadata || {}) };

    fileUrls.splice(fileIndex, 1);
    attachmentNames.splice(fileIndex, 1);
    delete attachmentMetadata[fileUrl];

    return super.update(id, {
      file_urls: fileUrls,
      attachment_names: attachmentNames,
      attachment_metadata: attachmentMetadata,
    });
  }

  /**
   * Get all file attachments for a contact
   */
  async getFiles(id: string): Promise<{
    url: string;
    name: string;
    metadata?: Record<string, any>;
  }[]> {
    const contact = await this.findById(id);
    if (!contact) {
      throw new Error(`Contact ${id} not found`);
    }

    const fileUrls = contact.file_urls || [];
    const attachmentNames = contact.attachment_names || [];
    const attachmentMetadata = contact.attachment_metadata || {};

    return fileUrls.map((url, index) => ({
      url,
      name: attachmentNames[index] || 'Unknown',
      metadata: attachmentMetadata[url],
    }));
  }
}
