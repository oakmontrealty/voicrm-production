import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { limit = 10 } = req.query;

    // Get REAL recent activities - NO MOCK DATA
    const { data: activities, error } = await supabase
      .from('activities')
      .select(`
        id,
        type,
        title,
        description,
        notes,
        created_at,
        updated_at,
        status,
        contact_id,
        contacts (
          id,
          name,
          company,
          phone,
          email
        ),
        deal_id,
        deals (
          id,
          title,
          value,
          status,
          stage
        )
      `)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }

    // If no activities found, try to get recent call logs as activities
    if (!activities || activities.length === 0) {
      const { data: callLogs } = await supabase
        .from('call_logs')
        .select(`
          id,
          phone_number,
          duration,
          status,
          call_type,
          created_at,
          contact_id,
          contacts (
            id,
            name,
            company,
            phone,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));

      // Convert call logs to activity format
      const callActivities = (callLogs || []).map(call => ({
        id: `call_${call.id}`,
        type: 'call',
        title: `${call.call_type} call`,
        description: `${call.call_type} call ${call.status === 'completed' ? 'completed' : call.status}`,
        notes: call.duration ? `Duration: ${call.duration} seconds` : null,
        created_at: call.created_at,
        updated_at: call.created_at,
        status: call.status,
        contact_id: call.contact_id,
        contacts: call.contacts,
        deal_id: null,
        deals: null
      }));

      return res.status(200).json(callActivities);
    }

    // Add activity type icons and formatting
    const formattedActivities = activities.map(activity => ({
      ...activity,
      icon: getActivityIcon(activity.type),
      formatted_time: formatTimeAgo(activity.created_at),
      display_title: activity.title || `${activity.type} activity`,
      display_description: activity.description || activity.notes || 'No additional details'
    }));

    console.log(`✅ Retrieved ${formattedActivities.length} real activities`);

    res.status(200).json(formattedActivities);

  } catch (error) {
    console.error('Error in recent activities API:', error);
    
    // Return empty array instead of mock data on error
    res.status(200).json([]);
  }
}

function getActivityIcon(type) {
  const icons = {
    call: '📞',
    email: '✉️',
    meeting: '🤝',
    deal: '💰',
    note: '📝',
    task: '✅',
    follow_up: '🔄',
    appointment: '📅',
    lead: '🎯',
    contact: '👤'
  };
  return icons[type] || '📋';
}

function formatTimeAgo(dateString) {
  if (!dateString) return 'Unknown';
  
  const now = new Date();
  const date = new Date(dateString);
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
}