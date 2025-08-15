import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Sample Pipedrive-style contact data for real estate
    const pipedriveContacts = [
      {
        name: 'Sarah Thompson',
        email: 'sarah.thompson@email.com',
        phone_number: '+61412345678',
        company: 'Thompson Real Estate Group',
        notes: 'Looking to expand commercial portfolio. Previously closed $15M deal. Interest: Commercial Office Buildings, Budget: $2M-$5M, Location: Sydney CBD'
      },
      {
        name: 'Michael Chen',
        email: 'mchen@techstartup.com',
        phone_number: '+61423456789',
        company: 'TechFlow Solutions',
        notes: 'Tech entrepreneur, cash buyer, wants waterfront property. Interest: Luxury Residential, Budget: $3M-$8M, Location: North Shore'
      },
      {
        name: 'Elizabeth Rodriguez',
        email: 'e.rodriguez@investcorp.com',
        phone_number: '+61434567890',
        company: 'Rodriguez Investment Corp',
        notes: 'Institutional buyer, looking for rental yield opportunities. Interest: Multi-family Residential, Budget: $5M-$15M, Location: Inner West'
      },
      {
        name: 'David Wilson',
        email: 'david.wilson@gmail.com',
        phone_number: '+61445678901',
        company: 'Wilson Family Trust',
        notes: 'Family looking to diversify into property development. Interest: Residential Development Sites, Budget: $1M-$3M, Location: Western Suburbs'
      },
      {
        name: 'Amanda Foster',
        email: 'amanda@fosterenterprise.com',
        phone_number: '+61456789012',
        company: 'Foster Enterprise',
        notes: 'Manufacturing company expanding operations. Interest: Industrial Warehouses, Budget: $2M-$6M, Location: South West'
      },
      {
        name: 'Robert Kim',
        email: 'robert.kim@kimholdings.com',
        phone_number: '+61467890123',
        company: 'Kim Holdings',
        notes: 'Korean investment group, interested in retail properties. Interest: Retail Shopping Centers, Budget: $10M-$25M, Location: Metropolitan'
      },
      {
        name: 'Jessica Murphy',
        email: 'j.murphy@murphydev.com',
        phone_number: '+61478901234',
        company: 'Murphy Development',
        notes: 'Boutique developer, focuses on high-end mixed use. Interest: Mixed-Use Development, Budget: $5M-$12M, Location: Eastern Suburbs'
      },
      {
        name: 'Thomas Liu',
        email: 'thomas@liuinvestments.com',
        phone_number: '+61489012345',
        company: 'Liu Investments',
        notes: 'Specializes in student housing near universities. Interest: Student Accommodation, Budget: $3M-$8M, Location: University Areas'
      },
      {
        name: 'Helen Anderson',
        email: 'helen.anderson@outlook.com',
        phone_number: '+61490123456',
        company: 'Anderson Holdings',
        notes: 'Early stage inquiry, needs nurturing. Interest: Office Buildings, Budget: $1M-$4M, Location: CBD Fringe'
      },
      {
        name: 'James Wright',
        email: 'james.wright@wrightco.com',
        phone_number: '+61401234567',
        company: 'Wright & Co',
        notes: 'Manufacturing expansion plans, long-term timeline. Interest: Industrial Land, Budget: $500K-$2M, Location: Outer Suburbs'
      }
    ];

    // Insert all contacts into Supabase
    const { data, error } = await supabase
      .from('contacts')
      .insert(pipedriveContacts)
      .select();

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      message: `Successfully imported ${pipedriveContacts.length} contacts from Pipedrive`,
      contacts_imported: data.length,
      contacts: data
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import Pipedrive contacts',
      details: error.message
    });
  }
}