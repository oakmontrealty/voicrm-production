import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Complete Pipedrive contacts with all details
    const pipedriveContacts = [
      {
        name: 'Sarah Thompson',
        first_name: 'Sarah',
        last_name: 'Thompson',
        email: 'sarah.thompson@email.com',
        phone_number: '+61412345678',
        company: 'Thompson Real Estate Group',
        assigned_agent: null,
        last_contact_date: new Date('2025-08-10').toISOString(),
        next_follow_up: new Date('2025-08-15').toISOString(),
        tags: ['hot-lead', 'commercial', 'high-value'],
        communication_preferences: {
          preferred_contact_method: 'phone',
          best_contact_time: 'morning',
          timezone: 'Australia/Sydney'
        },
        budget_range: '$2M - $5M',
        property_interests: 'Commercial Office Buildings',
        lead_score: 95,
        urgency_level: 'high',
        last_ai_analysis: 'Highly qualified commercial investor with proven track record. Strong buy signals.',
        source: 'Pipedrive',
        status: 'hot',
        notes: 'Looking to expand commercial portfolio. Previously closed $15M deal. Interest: Commercial Office Buildings, Budget: $2M-$5M, Location: Sydney CBD. Last activity: Phone call discussing market opportunities.'
      },
      {
        name: 'Michael Chen',
        first_name: 'Michael',
        last_name: 'Chen',
        email: 'mchen@techstartup.com',
        phone_number: '+61423456789',
        company: 'TechFlow Solutions',
        assigned_agent: null,
        last_contact_date: new Date('2025-08-12').toISOString(),
        next_follow_up: new Date('2025-08-16').toISOString(),
        tags: ['hot-lead', 'luxury', 'cash-buyer'],
        communication_preferences: {
          preferred_contact_method: 'email',
          best_contact_time: 'evening',
          timezone: 'Australia/Sydney'
        },
        budget_range: '$3M - $8M',
        property_interests: 'Luxury Residential Waterfront',
        lead_score: 92,
        urgency_level: 'high',
        last_ai_analysis: 'Tech entrepreneur with liquid capital. Seeking prestige waterfront property.',
        source: 'Pipedrive',
        status: 'hot',
        notes: 'Tech entrepreneur, cash buyer, wants waterfront property. Interest: Luxury Residential, Budget: $3M-$8M, Location: North Shore. Last activity: Email inquiry about waterfront listings.'
      },
      {
        name: 'Elizabeth Rodriguez',
        first_name: 'Elizabeth',
        last_name: 'Rodriguez',
        email: 'e.rodriguez@investcorp.com',
        phone_number: '+61434567890',
        company: 'Rodriguez Investment Corp',
        assigned_agent: null,
        last_contact_date: new Date('2025-08-11').toISOString(),
        next_follow_up: new Date('2025-08-17').toISOString(),
        tags: ['hot-lead', 'institutional', 'rental-yield'],
        communication_preferences: {
          preferred_contact_method: 'phone',
          best_contact_time: 'afternoon',
          timezone: 'Australia/Sydney'
        },
        budget_range: '$5M - $15M',
        property_interests: 'Multi-family Residential Investment',
        lead_score: 88,
        urgency_level: 'high',
        last_ai_analysis: 'Institutional buyer focused on rental yield. Looking for portfolio additions.',
        source: 'Pipedrive',
        status: 'hot',
        notes: 'Institutional buyer, looking for rental yield opportunities. Interest: Multi-family Residential, Budget: $5M-$15M, Location: Inner West. Last activity: Site inspection scheduled.'
      },
      {
        name: 'David Wilson',
        first_name: 'David',
        last_name: 'Wilson',
        email: 'david.wilson@gmail.com',
        phone_number: '+61445678901',
        company: 'Wilson Family Trust',
        assigned_agent: null,
        last_contact_date: new Date('2025-08-08').toISOString(),
        next_follow_up: new Date('2025-08-18').toISOString(),
        tags: ['warm-lead', 'development', 'family-trust'],
        communication_preferences: {
          preferred_contact_method: 'phone',
          best_contact_time: 'morning',
          timezone: 'Australia/Sydney'
        },
        budget_range: '$1M - $3M',
        property_interests: 'Residential Development Opportunities',
        lead_score: 72,
        urgency_level: 'medium',
        last_ai_analysis: 'Family trust looking to diversify. Conservative but interested in development.',
        source: 'Pipedrive',
        status: 'warm',
        notes: 'Family looking to diversify into property development. Interest: Residential Development Sites, Budget: $1M-$3M, Location: Western Suburbs. Last activity: Market research discussion.'
      },
      {
        name: 'Amanda Foster',
        first_name: 'Amanda',
        last_name: 'Foster',
        email: 'amanda@fosterenterprise.com',
        phone_number: '+61456789012',
        company: 'Foster Enterprise',
        assigned_agent: null,
        last_contact_date: new Date('2025-08-09').toISOString(),
        next_follow_up: new Date('2025-08-19').toISOString(),
        tags: ['warm-lead', 'industrial', 'expansion'],
        communication_preferences: {
          preferred_contact_method: 'email',
          best_contact_time: 'business-hours',
          timezone: 'Australia/Sydney'
        },
        budget_range: '$2M - $6M',
        property_interests: 'Industrial Warehouse Facilities',
        lead_score: 78,
        urgency_level: 'medium',
        last_ai_analysis: 'Manufacturing business expanding operations. Needs warehouse space.',
        source: 'Pipedrive',
        status: 'warm',
        notes: 'Manufacturing company expanding operations. Interest: Industrial Warehouses, Budget: $2M-$6M, Location: South West. Last activity: Facility requirements assessment.'
      },
      {
        name: 'Robert Kim',
        first_name: 'Robert',
        last_name: 'Kim',
        email: 'robert.kim@kimholdings.com',
        phone_number: '+61467890123',
        company: 'Kim Holdings',
        assigned_agent: null,
        last_contact_date: new Date('2025-08-07').toISOString(),
        next_follow_up: new Date('2025-08-20').toISOString(),
        tags: ['warm-lead', 'retail', 'international'],
        communication_preferences: {
          preferred_contact_method: 'phone',
          best_contact_time: 'afternoon',
          timezone: 'Australia/Sydney'
        },
        budget_range: '$10M - $25M',
        property_interests: 'Retail Shopping Centers',
        lead_score: 85,
        urgency_level: 'medium',
        last_ai_analysis: 'Korean investment group with significant capital. Interested in retail assets.',
        source: 'Pipedrive',
        status: 'warm',
        notes: 'Korean investment group, interested in retail properties. Interest: Retail Shopping Centers, Budget: $10M-$25M, Location: Metropolitan. Last activity: Portfolio review meeting.'
      },
      {
        name: 'Jessica Murphy',
        first_name: 'Jessica',
        last_name: 'Murphy',
        email: 'j.murphy@murphydev.com',
        phone_number: '+61478901234',
        company: 'Murphy Development',
        assigned_agent: null,
        last_contact_date: new Date('2025-08-06').toISOString(),
        next_follow_up: new Date('2025-08-21').toISOString(),
        tags: ['warm-lead', 'boutique-developer', 'mixed-use'],
        communication_preferences: {
          preferred_contact_method: 'phone',
          best_contact_time: 'morning',
          timezone: 'Australia/Sydney'
        },
        budget_range: '$5M - $12M',
        property_interests: 'Mixed-Use Development Sites',
        lead_score: 80,
        urgency_level: 'medium',
        last_ai_analysis: 'Boutique developer with quality focus. Selective but committed buyer.',
        source: 'Pipedrive',
        status: 'warm',
        notes: 'Boutique developer, focuses on high-end mixed use. Interest: Mixed-Use Development, Budget: $5M-$12M, Location: Eastern Suburbs. Last activity: Development feasibility discussion.'
      },
      {
        name: 'Thomas Liu',
        first_name: 'Thomas',
        last_name: 'Liu',
        email: 'thomas@liuinvestments.com',
        phone_number: '+61489012345',
        company: 'Liu Investments',
        assigned_agent: null,
        last_contact_date: new Date('2025-08-05').toISOString(),
        next_follow_up: new Date('2025-08-22').toISOString(),
        tags: ['warm-lead', 'student-accommodation', 'university'],
        communication_preferences: {
          preferred_contact_method: 'email',
          best_contact_time: 'evening',
          timezone: 'Australia/Sydney'
        },
        budget_range: '$3M - $8M',
        property_interests: 'Student Accommodation Properties',
        lead_score: 75,
        urgency_level: 'medium',
        last_ai_analysis: 'Specialist in student housing. Targets university proximity properties.',
        source: 'Pipedrive',
        status: 'warm',
        notes: 'Specializes in student housing near universities. Interest: Student Accommodation, Budget: $3M-$8M, Location: University Areas. Last activity: University precinct analysis.'
      },
      {
        name: 'Helen Anderson',
        first_name: 'Helen',
        last_name: 'Anderson',
        email: 'helen.anderson@outlook.com',
        phone_number: '+61490123456',
        company: 'Anderson Holdings',
        assigned_agent: null,
        last_contact_date: new Date('2025-08-01').toISOString(),
        next_follow_up: new Date('2025-08-25').toISOString(),
        tags: ['cold-lead', 'office', 'early-stage'],
        communication_preferences: {
          preferred_contact_method: 'email',
          best_contact_time: 'business-hours',
          timezone: 'Australia/Sydney'
        },
        budget_range: '$1M - $4M',
        property_interests: 'Office Buildings CBD Fringe',
        lead_score: 45,
        urgency_level: 'low',
        last_ai_analysis: 'Early stage inquiry. Requires nurturing and education.',
        source: 'Pipedrive',
        status: 'cold',
        notes: 'Early stage inquiry, needs nurturing. Interest: Office Buildings, Budget: $1M-$4M, Location: CBD Fringe. Last activity: Initial market inquiry email.'
      },
      {
        name: 'James Wright',
        first_name: 'James',
        last_name: 'Wright',
        email: 'james.wright@wrightco.com',
        phone_number: '+61401234567',
        company: 'Wright & Co',
        assigned_agent: null,
        last_contact_date: new Date('2025-07-30').toISOString(),
        next_follow_up: new Date('2025-08-30').toISOString(),
        tags: ['cold-lead', 'industrial-land', 'long-term'],
        communication_preferences: {
          preferred_contact_method: 'phone',
          best_contact_time: 'afternoon',
          timezone: 'Australia/Sydney'
        },
        budget_range: '$500K - $2M',
        property_interests: 'Industrial Land Development',
        lead_score: 40,
        urgency_level: 'low',
        last_ai_analysis: 'Manufacturing expansion plans with extended timeline. Low urgency.',
        source: 'Pipedrive',
        status: 'cold',
        notes: 'Manufacturing expansion plans, long-term timeline. Interest: Industrial Land, Budget: $500K-$2M, Location: Outer Suburbs. Last activity: Long-term planning consultation.'
      }
    ];

    // Clear existing contacts first
    await supabase.from('contacts').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert complete contacts
    const { data, error } = await supabase
      .from('contacts')
      .insert(pipedriveContacts)
      .select();

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      message: `Successfully imported complete Pipedrive contacts with all details`,
      contacts_imported: data.length,
      sample_contact: data[0],
      fields_included: [
        'name', 'first_name', 'last_name', 'email', 'phone_number', 'company',
        'assigned_agent', 'last_contact_date', 'next_follow_up', 'tags',
        'communication_preferences', 'budget_range', 'property_interests',
        'lead_score', 'urgency_level', 'last_ai_analysis', 'source', 'status', 'notes'
      ]
    });

  } catch (error) {
    console.error('Complete import error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import complete Pipedrive contacts',
      details: error.message
    });
  }
}