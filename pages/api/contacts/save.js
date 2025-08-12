// API endpoint to save contacts to Supabase
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, phone, email, company, source, notes } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  try {
    // Check if contact already exists
    const { data: existing } = await supabase
      .from('contacts')
      .select('id, name')
      .eq('phone', phone)
      .single();

    if (existing) {
      // Update existing contact
      const { data, error } = await supabase
        .from('contacts')
        .update({
          name,
          email: email || existing.email,
          company: company || existing.company,
          notes: notes || existing.notes,
          last_contact: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Contact updated',
        contact: data
      });
    } else {
      // Create new contact
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          name,
          phone,
          email: email || null,
          company: company || null,
          source: source || 'Voice Input',
          notes: notes || null,
          status: 'New Lead',
          value: 0
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Contact created',
        contact: data
      });
    }
  } catch (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}