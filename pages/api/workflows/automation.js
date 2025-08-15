import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Workflow triggers
const TRIGGERS = {
  NEW_LEAD: 'new_lead',
  MISSED_CALL: 'missed_call',
  NO_CONTACT_7_DAYS: 'no_contact_7_days',
  HOT_LEAD: 'hot_lead',
  DEAL_WON: 'deal_won',
  BIRTHDAY: 'birthday',
  FOLLOW_UP_DUE: 'follow_up_due',
  LOW_ENGAGEMENT: 'low_engagement'
};

// Workflow actions
const ACTIONS = {
  SEND_SMS: 'send_sms',
  SEND_EMAIL: 'send_email',
  CREATE_TASK: 'create_task',
  UPDATE_LEAD_SCORE: 'update_lead_score',
  SCHEDULE_CALLBACK: 'schedule_callback',
  ADD_TO_CAMPAIGN: 'add_to_campaign',
  NOTIFY_AGENT: 'notify_agent'
};

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getWorkflows(req, res);
    case 'POST':
      return executeWorkflow(req, res);
    case 'PUT':
      return updateWorkflow(req, res);
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getWorkflows(req, res) {
  try {
    // Get all active workflows
    const workflows = [
      {
        id: 1,
        name: 'New Lead Welcome',
        trigger: TRIGGERS.NEW_LEAD,
        actions: [
          { type: ACTIONS.SEND_SMS, delay: 0, template: 'welcome_sms' },
          { type: ACTIONS.SEND_EMAIL, delay: 300, template: 'welcome_email' },
          { type: ACTIONS.SCHEDULE_CALLBACK, delay: 86400, note: 'Follow up in 24 hours' }
        ],
        active: true
      },
      {
        id: 2,
        name: 'Missed Call Follow-up',
        trigger: TRIGGERS.MISSED_CALL,
        actions: [
          { type: ACTIONS.SEND_SMS, delay: 300, template: 'missed_call_sms' },
          { type: ACTIONS.CREATE_TASK, delay: 3600, task: 'Return missed call' }
        ],
        active: true
      },
      {
        id: 3,
        name: 'Re-engagement Campaign',
        trigger: TRIGGERS.NO_CONTACT_7_DAYS,
        actions: [
          { type: ACTIONS.SEND_EMAIL, delay: 0, template: 'reengagement_email' },
          { type: ACTIONS.UPDATE_LEAD_SCORE, delay: 0, adjustment: -10 },
          { type: ACTIONS.ADD_TO_CAMPAIGN, delay: 86400, campaign: 'nurture' }
        ],
        active: true
      },
      {
        id: 4,
        name: 'Hot Lead Priority',
        trigger: TRIGGERS.HOT_LEAD,
        actions: [
          { type: ACTIONS.NOTIFY_AGENT, delay: 0, priority: 'high' },
          { type: ACTIONS.SCHEDULE_CALLBACK, delay: 0, note: 'Priority callback ASAP' },
          { type: ACTIONS.SEND_SMS, delay: 1800, template: 'hot_lead_followup' }
        ],
        active: true
      },
      {
        id: 5,
        name: 'Deal Won Celebration',
        trigger: TRIGGERS.DEAL_WON,
        actions: [
          { type: ACTIONS.SEND_SMS, delay: 0, template: 'congratulations_sms' },
          { type: ACTIONS.SEND_EMAIL, delay: 3600, template: 'thank_you_email' },
          { type: ACTIONS.CREATE_TASK, delay: 604800, task: 'Request testimonial' }
        ],
        active: true
      }
    ];

    res.status(200).json({ workflows });
  } catch (error) {
    console.error('Get workflows error:', error);
    res.status(500).json({ error: 'Failed to get workflows' });
  }
}

async function executeWorkflow(req, res) {
  const { trigger, contactId, data } = req.body;

  try {
    // Get contact details
    const { data: contact } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Find matching workflows
    const workflows = getWorkflowsByTrigger(trigger);
    const executedActions = [];

    for (const workflow of workflows) {
      if (!workflow.active) continue;

      for (const action of workflow.actions) {
        // Schedule action with delay
        setTimeout(async () => {
          try {
            await executeAction(action, contact, data);
            
            // Log action execution
            await supabase
              .from('workflow_logs')
              .insert({
                workflow_id: workflow.id,
                contact_id: contactId,
                action_type: action.type,
                status: 'completed',
                executed_at: new Date().toISOString()
              });
          } catch (error) {
            console.error(`Failed to execute action ${action.type}:`, error);
            
            // Log failed action
            await supabase
              .from('workflow_logs')
              .insert({
                workflow_id: workflow.id,
                contact_id: contactId,
                action_type: action.type,
                status: 'failed',
                error: error.message,
                executed_at: new Date().toISOString()
              });
          }
        }, action.delay * 1000);

        executedActions.push({
          workflow: workflow.name,
          action: action.type,
          scheduledIn: action.delay
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Workflow triggered for ${trigger}`,
      executedActions
    });

  } catch (error) {
    console.error('Execute workflow error:', error);
    res.status(500).json({ error: 'Failed to execute workflow' });
  }
}

async function executeAction(action, contact, data) {
  switch (action.type) {
    case ACTIONS.SEND_SMS:
      return await sendSMS(contact, action.template);
    
    case ACTIONS.SEND_EMAIL:
      return await sendEmail(contact, action.template);
    
    case ACTIONS.CREATE_TASK:
      return await createTask(contact, action.task);
    
    case ACTIONS.UPDATE_LEAD_SCORE:
      return await updateLeadScore(contact, action.adjustment);
    
    case ACTIONS.SCHEDULE_CALLBACK:
      return await scheduleCallback(contact, action.note);
    
    case ACTIONS.ADD_TO_CAMPAIGN:
      return await addToCampaign(contact, action.campaign);
    
    case ACTIONS.NOTIFY_AGENT:
      return await notifyAgent(contact, action.priority);
    
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

async function sendSMS(contact, template) {
  const templates = {
    welcome_sms: `Hi ${contact.name}! Welcome to VoiCRM. We're excited to help you find your dream property. Reply STOP to opt out.`,
    missed_call_sms: `Hi ${contact.name}, we missed your call. Our team will get back to you shortly. Meanwhile, feel free to text us your query.`,
    hot_lead_followup: `${contact.name}, just checking in on your property search. Any questions? We're here to help! 🏡`,
    congratulations_sms: `Congratulations ${contact.name}! 🎉 Your offer has been accepted. Let's celebrate this milestone together!`
  };

  const message = templates[template] || 'Thank you for your interest. We will contact you soon.';

  if (contact.phone_number) {
    await twilioClient.messages.create({
      body: message,
      to: contact.phone_number,
      from: process.env.TWILIO_PHONE_NUMBER
    });
  }
}

async function sendEmail(contact, template) {
  // Email sending logic would go here
  // For now, log the action
  console.log(`Sending email template ${template} to ${contact.email}`);
}

async function createTask(contact, taskDescription) {
  await supabase
    .from('activities')
    .insert({
      contact_id: contact.id,
      type: 'task',
      subject: taskDescription,
      due_date: new Date(Date.now() + 86400000).toISOString(), // Due in 24 hours
      status: 'pending',
      created_at: new Date().toISOString()
    });
}

async function updateLeadScore(contact, adjustment) {
  const newScore = Math.max(0, Math.min(100, (contact.lead_score || 0) + adjustment));
  
  await supabase
    .from('contacts')
    .update({ 
      lead_score: newScore,
      score_updated_at: new Date().toISOString()
    })
    .eq('id', contact.id);
}

async function scheduleCallback(contact, note) {
  await supabase
    .from('activities')
    .insert({
      contact_id: contact.id,
      type: 'callback',
      subject: `Callback: ${contact.name}`,
      notes: note,
      scheduled_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      status: 'scheduled',
      created_at: new Date().toISOString()
    });
}

async function addToCampaign(contact, campaignName) {
  await supabase
    .from('campaign_members')
    .insert({
      contact_id: contact.id,
      campaign_name: campaignName,
      status: 'active',
      added_at: new Date().toISOString()
    });
}

async function notifyAgent(contact, priority) {
  // In production, this would send push notification or email to agent
  console.log(`ALERT: ${priority} priority lead - ${contact.name} (${contact.phone_number})`);
  
  // Create urgent task
  await supabase
    .from('activities')
    .insert({
      contact_id: contact.id,
      type: 'urgent_task',
      subject: `URGENT: Contact ${contact.name} immediately`,
      priority,
      due_date: new Date().toISOString(), // Due now
      status: 'urgent',
      created_at: new Date().toISOString()
    });
}

function getWorkflowsByTrigger(trigger) {
  // In production, this would fetch from database
  const allWorkflows = [
    {
      id: 1,
      name: 'New Lead Welcome',
      trigger: TRIGGERS.NEW_LEAD,
      actions: [
        { type: ACTIONS.SEND_SMS, delay: 0, template: 'welcome_sms' },
        { type: ACTIONS.SEND_EMAIL, delay: 300, template: 'welcome_email' },
        { type: ACTIONS.SCHEDULE_CALLBACK, delay: 86400, note: 'Follow up in 24 hours' }
      ],
      active: true
    },
    // ... other workflows
  ];

  return allWorkflows.filter(w => w.trigger === trigger);
}

async function updateWorkflow(req, res) {
  const { id, active } = req.body;

  try {
    // Update workflow status
    // In production, this would update in database
    
    res.status(200).json({
      success: true,
      message: `Workflow ${id} ${active ? 'activated' : 'deactivated'}`
    });
  } catch (error) {
    console.error('Update workflow error:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
}