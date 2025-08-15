import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(200).json({ callbacks: [], activities: [] });
    }

    // Search for callbacks/scheduled activities
    const { data: callbacks, error: callbackError } = await supabase
      .from('contacts')
      .select('*')
      .not('next_follow_up', 'is', null)
      .or(`name.ilike.%${q}%,phone_number.ilike.%${q}%,company.ilike.%${q}%`)
      .limit(10);

    if (callbackError) {
      console.error('Callback search error:', callbackError);
    }

    // Get recent activities from localStorage (or wherever they're stored)
    const activities = JSON.parse(global.localStorage?.getItem('contact_activities') || '[]')
      .filter(activity => 
        activity.phone_number?.includes(q) ||
        activity.notes?.toLowerCase().includes(q.toLowerCase())
      )
      .slice(0, 10);

    res.status(200).json({
      callbacks: callbacks || [],
      activities: activities
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search activities',
      details: error.message
    });
  }
}