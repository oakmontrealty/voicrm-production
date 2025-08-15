import { createClient } from '@supabase/supabase-js';
import { withCache, CacheStrategies, setCacheHeaders } from '../../lib/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if Supabase is configured
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase not configured - using mock data');
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      // If Supabase not configured, return comprehensive test data
      if (!supabase) {
        const testContact = {
          id: 'test-001',
          pipedrive_id: '12345',
          name: 'Sarah Thompson',
          first_name: 'Sarah',
          last_name: 'Thompson',
          email: 'sarah.thompson@example.com',
          phone_number: '+61412345678',
          all_phones: [
            { value: '+61412345678', label: 'Mobile' },
            { value: '+61298765432', label: 'Office' }
          ],
          all_emails: [
            { value: 'sarah.thompson@example.com', label: 'Work' },
            { value: 'sarah.personal@gmail.com', label: 'Personal' }
          ],
          company: 'Thompson Property Investments',
          org_id: 'org_789',
          status: 'Active',
          lead_score: 8,
          visible_to: '3',
          last_activity_date: '2024-12-10T14:30:00Z',
          last_activity_type: 'call',
          last_activity_subject: 'Property valuation discussion',
          next_activity_date: '2024-12-20T10:00:00Z',
          next_activity_type: 'meeting',
          next_activity_subject: 'Review contract terms for Bondi property',
          activities_count: 47,
          done_activities_count: 42,
          undone_activities_count: 5,
          open_deals_count: 2,
          won_deals_count: 3,
          lost_deals_count: 1,
          closed_deals_count: 4,
          total_deal_value: 4250000,
          deals: [
            {
              id: 'deal_001',
              title: '45 Beach Road, Bondi - Sale',
              value: 2100000,
              currency: 'AUD',
              status: 'open',
              stage_id: 'negotiation',
              add_time: '2024-11-15T09:00:00Z',
              close_time: null,
              probability: 75
            },
            {
              id: 'deal_002',
              title: '12 Harbour View, Mosman - Investment',
              value: 1850000,
              currency: 'AUD',
              status: 'open',
              stage_id: 'proposal',
              add_time: '2024-12-01T11:00:00Z',
              close_time: null,
              probability: 60
            },
            {
              id: 'deal_003',
              title: '78 Park Avenue, Surry Hills - Sold',
              value: 950000,
              currency: 'AUD',
              status: 'won',
              stage_id: 'won',
              add_time: '2024-09-10T10:00:00Z',
              close_time: '2024-10-25T16:00:00Z',
              probability: 100
            }
          ],
          email_messages_count: 156,
          notes_count: 23,
          notes: '[2024-12-10] Called to discuss property valuation. Client is interested in the Bondi beachfront property but concerned about the price. Suggested we meet next week to review comparable sales.\n\n[2024-12-05] Email exchange about investment opportunities in Mosman area. Client has $2M budget and looking for properties with good rental yield.\n\n[2024-11-28] Meeting at office. Reviewed portfolio performance. Client happy with returns on Surry Hills property. Discussed tax implications of selling investment properties.',
          recent_notes: [
            {
              content: 'Called to discuss property valuation. Client is interested in the Bondi beachfront property but concerned about the price. Suggested we meet next week to review comparable sales.',
              add_time: '2024-12-10T14:30:00Z',
              user: 'John Agent'
            },
            {
              content: 'Email exchange about investment opportunities in Mosman area. Client has $2M budget and looking for properties with good rental yield.',
              add_time: '2024-12-05T09:15:00Z',
              user: 'John Agent'
            },
            {
              content: 'Meeting at office. Reviewed portfolio performance. Client happy with returns on Surry Hills property. Discussed tax implications of selling investment properties.',
              add_time: '2024-11-28T15:00:00Z',
              user: 'John Agent'
            },
            {
              content: 'Site inspection at Beach Road property. Client loved the ocean views but wants to negotiate on price. Will prepare a comparative market analysis.',
              add_time: '2024-11-20T11:00:00Z',
              user: 'John Agent'
            },
            {
              content: 'Initial inquiry about beachfront properties. Client looking to diversify portfolio with premium coastal real estate.',
              add_time: '2024-11-15T09:00:00Z',
              user: 'John Agent'
            }
          ],
          owner_name: 'John Agent',
          owner_id: 'user_456',
          created_at: '2024-01-15T08:00:00Z',
          updated_at: '2024-12-10T14:30:00Z',
          picture_url: null,
          custom_fields: {
            property_preferences: 'Beachfront, Investment Grade',
            budget_range: '$1.5M - $3M',
            financing_approved: true,
            preferred_suburbs: 'Bondi, Mosman, Double Bay'
          },
          needs_attention: false,
          attention_reasons: [],
          source: 'Pipedrive',
          sync_time: '2024-12-14T10:00:00Z'
        };

        return res.status(200).json({
          contacts: [
            testContact,
            { id: 2, name: 'John Smith', phone_number: '+61423456789', email: 'john@example.com', status: 'Prospect', company: 'ABC Corp', lead_score: 5, activities_count: 12, open_deals_count: 1, total_deal_value: 500000 },
            { id: 3, name: 'Mike Wilson', phone_number: '+61434567890', email: 'mike@example.com', status: 'Active', company: 'Tech Solutions', lead_score: 6, activities_count: 8, won_deals_count: 2 }
          ],
          total: 3,
          page: 1,
          totalPages: 1
        });
      }
      
      try {
        // Extract query parameters
        const { 
          page = '1', 
          limit = '50', 
          search = '', 
          status = 'all',
          sortField = 'name',
          sortOrder = 'asc'
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // Build the query
        let query = supabase.from('contacts').select('*', { count: 'exact' });

        // Apply search filter
        if (search) {
          query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone_number.ilike.%${search}%,company.ilike.%${search}%`);
        }

        // Apply status filter
        if (status !== 'all') {
          if (status === 'needs_attention') {
            query = query.eq('needs_attention', true);
          } else {
            query = query.eq('status', status);
          }
        }

        // Apply sorting
        query = query.order(sortField, { ascending: sortOrder === 'asc' });

        // Apply pagination
        query = query.range(offset, offset + limitNum - 1);

        const { data, error, count } = await query;

        if (error) throw error;
        
        // Set cache headers for GET requests
        setCacheHeaders(res, {
          maxAge: 300, // 5 minutes
          sMaxAge: 600, // 10 minutes for CDN
          staleWhileRevalidate: 1800 // 30 minutes
        });
        
        res.status(200).json({
          contacts: data || [],
          total: count || 0,
          page: pageNum,
          totalPages: Math.ceil((count || 0) / limitNum)
        });
      } catch (error) {
        console.error('Contacts API error:', error);
        res.status(500).json({ error: error.message });
      }
      break;

    case 'POST':
      try {
        const { data, error } = await supabase
          .from('contacts')
          .insert([req.body])
          .select();

        if (error) throw error;
        res.status(201).json(data[0]);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;

    case 'PUT':
      try {
        const { id, ...updateData } = req.body;
        const { data, error } = await supabase
          .from('contacts')
          .update(updateData)
          .eq('id', id)
          .select();

        if (error) throw error;
        res.status(200).json(data[0]);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;

    case 'DELETE':
      try {
        const { id } = req.query;
        const { error } = await supabase
          .from('contacts')
          .delete()
          .eq('id', id);

        if (error) throw error;
        res.status(204).end();
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

// Export with cache wrapper for GET requests only
export default withCache(handler, {
  ttl: CacheStrategies.MEDIUM,
  keyGenerator: (req) => {
    const { page, limit, search, status, sortField, sortOrder } = req.query;
    return `contacts:${page}:${limit}:${search}:${status}:${sortField}:${sortOrder}`;
  },
  shouldCache: (req) => req.method === 'GET'
});