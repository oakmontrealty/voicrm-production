import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      contact_id,
      phone_number,
      type, // 'call', 'text', 'attempted_call', 'email', 'meeting'
      status, // 'completed', 'missed', 'no_answer', 'busy', 'failed'
      duration,
      notes,
      next_activity_date,
      next_activity_type
    } = req.body;

    // Log the activity
    const activityData = {
      contact_id,
      phone_number,
      type,
      status,
      duration,
      notes,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // Store in localStorage for now (or Supabase if configured)
    const activities = JSON.parse(global.localStorage?.getItem('contact_activities') || '[]');
    activities.unshift(activityData);
    
    // Keep last 1000 activities
    if (activities.length > 1000) {
      activities.pop();
    }
    
    if (global.localStorage) {
      global.localStorage.setItem('contact_activities', JSON.stringify(activities));
    }

    // Update contact's last activity and next follow-up
    if (contact_id) {
      const updateData = {
        last_contact_date: new Date().toISOString(),
        last_activity_type: type,
        last_activity_status: status
      };

      if (next_activity_date) {
        updateData.next_follow_up = next_activity_date;
        updateData.next_activity_type = next_activity_type || 'call';
      }

      const { error: updateError } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contact_id);

      if (updateError) {
        console.error('Failed to update contact:', updateError);
      }
    }

    // Schedule callback if next activity is set
    if (next_activity_date) {
      const callback = {
        contact_id,
        phone_number,
        scheduled_date: next_activity_date,
        type: next_activity_type || 'call',
        notes: `Follow-up from ${type} on ${new Date().toLocaleDateString()}`,
        created_at: new Date().toISOString()
      };

      // Store callbacks
      const callbacks = JSON.parse(global.localStorage?.getItem('scheduled_callbacks') || '[]');
      callbacks.push(callback);
      
      // Sort by date
      callbacks.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
      
      if (global.localStorage) {
        global.localStorage.setItem('scheduled_callbacks', JSON.stringify(callbacks));
      }
    }

    res.status(200).json({
      success: true,
      activity: activityData,
      message: 'Activity logged successfully'
    });

  } catch (error) {
    console.error('Activity logging error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log activity',
      details: error.message
    });
  }
}