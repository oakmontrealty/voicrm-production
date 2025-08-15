import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date, upcoming } = req.query;
    
    // Get all contacts with next_follow_up dates
    const query = supabase
      .from('contacts')
      .select('*')
      .not('next_follow_up', 'is', null)
      .order('next_follow_up', { ascending: true });

    // Filter by specific date if provided
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.gte('next_follow_up', startOfDay.toISOString())
           .lte('next_follow_up', endOfDay.toISOString());
    } else if (upcoming) {
      // Get upcoming callbacks for next 7 days
      const now = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      
      query.gte('next_follow_up', now.toISOString())
           .lte('next_follow_up', weekFromNow.toISOString());
    }

    const { data: contacts, error } = await query;

    if (error) {
      throw error;
    }

    // Format callbacks with additional info
    const callbacks = contacts.map(contact => ({
      id: contact.id,
      name: contact.name,
      phone_number: contact.phone_number,
      email: contact.email,
      company: contact.company,
      scheduled_date: contact.next_follow_up,
      last_contact: contact.last_contact_date,
      last_activity_type: contact.last_activity_type || 'unknown',
      notes: contact.notes,
      status: contact.status,
      lead_score: contact.lead_score,
      // Calculate days since last contact
      days_since_contact: contact.last_contact_date 
        ? Math.floor((new Date() - new Date(contact.last_contact_date)) / (1000 * 60 * 60 * 24))
        : null,
      // Calculate if overdue
      is_overdue: new Date(contact.next_follow_up) < new Date(),
      // Priority based on lead score and overdue status
      priority: calculatePriority(contact)
    }));

    // Sort by priority and time
    callbacks.sort((a, b) => {
      if (a.is_overdue !== b.is_overdue) {
        return a.is_overdue ? -1 : 1;
      }
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return new Date(a.scheduled_date) - new Date(b.scheduled_date);
    });

    // Get activity history from localStorage
    const activities = JSON.parse(global.localStorage?.getItem('contact_activities') || '[]');

    res.status(200).json({
      success: true,
      callbacks,
      total: callbacks.length,
      overdue: callbacks.filter(c => c.is_overdue).length,
      today: callbacks.filter(c => {
        const today = new Date();
        const callbackDate = new Date(c.scheduled_date);
        return callbackDate.toDateString() === today.toDateString();
      }).length,
      activities: activities.slice(0, 100) // Last 100 activities
    });

  } catch (error) {
    console.error('Error fetching callbacks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch callbacks',
      details: error.message
    });
  }
}

function calculatePriority(contact) {
  let priority = 0;
  
  // Lead score contributes to priority
  if (contact.lead_score) {
    priority += contact.lead_score;
  }
  
  // Hot leads get higher priority
  if (contact.status === 'hot' || contact.urgency_level === 'high') {
    priority += 5;
  }
  
  // Recent activity increases priority
  if (contact.last_contact_date) {
    const daysSinceContact = Math.floor((new Date() - new Date(contact.last_contact_date)) / (1000 * 60 * 60 * 24));
    if (daysSinceContact <= 7) {
      priority += 3;
    } else if (daysSinceContact <= 14) {
      priority += 1;
    }
  }
  
  return priority;
}