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
      // If Supabase not configured, return mock data
      if (!supabase) {
        return res.status(200).json({
          contacts: [
            { id: 1, name: 'John Smith', phone_number: '+61412345678', email: 'john@example.com', status: 'active', company: 'ABC Corp' },
            { id: 2, name: 'Sarah Johnson', phone_number: '+61423456789', email: 'sarah@example.com', status: 'lead', company: 'XYZ Ltd' },
            { id: 3, name: 'Mike Wilson', phone_number: '+61434567890', email: 'mike@example.com', status: 'active', company: 'Tech Inc' }
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