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
    // Get contacts count
    const { count: totalContacts } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true });

    // Get call logs count
    const { data: callLogs } = await supabase
      .from('call_logs')
      .select('id, status, duration, created_at')
      .order('created_at', { ascending: false });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate call stats
    const totalCalls = callLogs?.length || 0;
    const callsToday = callLogs?.filter(log => 
      new Date(log.created_at) >= today
    ).length || 0;

    const completedCalls = callLogs?.filter(call => call.status === 'completed') || [];
    const totalDuration = completedCalls.reduce((sum, call) => sum + (call.duration || 0), 0);
    const avgCallDuration = completedCalls.length > 0 ? Math.round(totalDuration / completedCalls.length) : 0;

    // Calculate conversion rate (mock calculation based on actual data)
    const conversionRate = totalContacts > 0 ? Math.min(Math.round((totalCalls / totalContacts) * 15), 100) : 0;

    // Get recent activities count
    const { data: activities } = await supabase
      .from('activities')
      .select('id')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });

    const stats = {
      totalContacts: totalContacts || 0,
      totalCalls,
      callsToday,
      avgCallDuration,
      conversionRate,
      missedCalls: callLogs?.filter(call => call.status === 'no-answer' || call.status === 'failed').length || 0,
      recentActivities: activities?.length || 0,
      callsInProgress: callLogs?.filter(call => call.status === 'in-progress').length || 0,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(stats);

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard stats',
      details: error.message 
    });
  }
}