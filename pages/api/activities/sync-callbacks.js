import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get ALL contacts from database
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .order('next_follow_up', { ascending: true });

    if (error) {
      throw error;
    }

    // Filter contacts with next_follow_up dates
    const contactsWithCallbacks = contacts.filter(c => c.next_follow_up);
    
    // Transform to calendar events
    const calendarEvents = contactsWithCallbacks.map(contact => ({
      id: contact.id,
      title: contact.name,
      phone: contact.phone_number,
      email: contact.email,
      company: contact.company,
      date: contact.next_follow_up,
      type: 'callback',
      status: contact.status,
      leadScore: contact.lead_score,
      notes: contact.notes,
      lastContact: contact.last_contact_date,
      urgency: contact.urgency_level,
      // Calculate if overdue
      isOverdue: new Date(contact.next_follow_up) < new Date(),
      // Days until callback
      daysUntil: Math.ceil((new Date(contact.next_follow_up) - new Date()) / (1000 * 60 * 60 * 24))
    }));

    // Group by date for calendar display
    const eventsByDate = {};
    calendarEvents.forEach(event => {
      const dateKey = new Date(event.date).toDateString();
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = [];
      }
      eventsByDate[dateKey].push(event);
    });

    // Get today's callbacks
    const today = new Date().toDateString();
    const todaysCallbacks = eventsByDate[today] || [];
    
    // Get overdue callbacks
    const overdueCallbacks = calendarEvents.filter(e => e.isOverdue);
    
    // Get upcoming (next 7 days)
    const upcomingCallbacks = calendarEvents.filter(e => 
      e.daysUntil >= 0 && e.daysUntil <= 7
    );

    res.status(200).json({
      success: true,
      totalCallbacks: calendarEvents.length,
      todaysCallbacks: todaysCallbacks.length,
      overdueCount: overdueCallbacks.length,
      upcomingCount: upcomingCallbacks.length,
      events: calendarEvents,
      eventsByDate,
      stats: {
        total: contacts.length,
        withCallbacks: contactsWithCallbacks.length,
        withoutCallbacks: contacts.length - contactsWithCallbacks.length
      }
    });

  } catch (error) {
    console.error('Callback sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync callbacks',
      details: error.message
    });
  }
}