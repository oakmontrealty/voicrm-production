import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return calculateAndUpdateScores(req, res);
  } else if (req.method === 'GET') {
    return getPredictions(req, res);
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}

async function calculateAndUpdateScores(req, res) {
  try {
    // Fetch all contacts with their activity data
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*');

    if (error) throw error;

    // Fetch recent activities
    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch call logs
    const { data: callLogs } = await supabase
      .from('call_logs')
      .select('*');

    // Calculate predictive scores for each contact
    const updatedContacts = contacts.map(contact => {
      const score = calculatePredictiveScore(contact, activities, callLogs);
      return {
        ...contact,
        lead_score: score.overall,
        conversion_probability: score.conversionProbability,
        engagement_score: score.engagement,
        urgency_score: score.urgency,
        value_score: score.value,
        ai_insights: score.insights
      };
    });

    // Update contacts with new scores
    const updatePromises = updatedContacts.map(contact => 
      supabase
        .from('contacts')
        .update({
          lead_score: contact.lead_score,
          conversion_probability: contact.conversion_probability,
          engagement_score: contact.engagement_score,
          urgency_score: contact.urgency_score,
          value_score: contact.value_score,
          ai_insights: contact.ai_insights,
          score_updated_at: new Date().toISOString()
        })
        .eq('id', contact.id)
    );

    await Promise.all(updatePromises);

    // Return summary of predictions
    const summary = {
      totalContacts: contacts.length,
      hotLeads: updatedContacts.filter(c => c.lead_score >= 80).length,
      warmLeads: updatedContacts.filter(c => c.lead_score >= 60 && c.lead_score < 80).length,
      coldLeads: updatedContacts.filter(c => c.lead_score < 60).length,
      highConversionProbability: updatedContacts.filter(c => c.conversion_probability >= 70).length,
      urgentFollowups: updatedContacts.filter(c => c.urgency_score >= 80).length,
      topOpportunities: updatedContacts
        .sort((a, b) => b.value_score - a.value_score)
        .slice(0, 10)
        .map(c => ({
          id: c.id,
          name: c.name,
          score: c.lead_score,
          value: c.value_score,
          probability: c.conversion_probability
        }))
    };

    res.status(200).json({
      success: true,
      message: 'Predictive scores updated successfully',
      summary
    });

  } catch (error) {
    console.error('Predictive analytics error:', error);
    res.status(500).json({ error: 'Failed to calculate predictive scores', details: error.message });
  }
}

function calculatePredictiveScore(contact, activities, callLogs) {
  let engagementScore = 0;
  let urgencyScore = 0;
  let valueScore = 0;
  let conversionProbability = 0;
  const insights = [];

  // 1. ENGAGEMENT SCORING (0-100)
  // Recent activities
  const contactActivities = activities?.filter(a => a.contact_id === contact.id) || [];
  const recentActivities = contactActivities.filter(a => {
    const daysSince = (Date.now() - new Date(a.created_at)) / (1000 * 60 * 60 * 24);
    return daysSince <= 30;
  });

  engagementScore += Math.min(recentActivities.length * 10, 30); // Max 30 points for activities

  // Call history
  const contactCalls = callLogs?.filter(c => c.phone_number === contact.phone_number) || [];
  const completedCalls = contactCalls.filter(c => c.status === 'completed').length;
  engagementScore += Math.min(completedCalls * 5, 20); // Max 20 points for calls

  // Email opens (simulated based on email field)
  if (contact.email) engagementScore += 10;

  // Response rate (simulated)
  if (contactCalls.length > 0) {
    const responseRate = completedCalls / contactCalls.length;
    engagementScore += responseRate * 20; // Max 20 points for response rate
  }

  // Days since last contact
  if (contact.last_contact_date) {
    const daysSinceContact = (Date.now() - new Date(contact.last_contact_date)) / (1000 * 60 * 60 * 24);
    if (daysSinceContact <= 7) engagementScore += 20;
    else if (daysSinceContact <= 14) engagementScore += 10;
    else if (daysSinceContact <= 30) engagementScore += 5;
  }

  // 2. URGENCY SCORING (0-100)
  // Time-based factors
  if (contact.next_follow_up) {
    const daysUntilFollowup = (new Date(contact.next_follow_up) - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntilFollowup <= 0) {
      urgencyScore = 100; // Overdue
      insights.push('⚠️ Overdue for follow-up');
    } else if (daysUntilFollowup <= 1) {
      urgencyScore = 90;
      insights.push('📅 Follow-up due tomorrow');
    } else if (daysUntilFollowup <= 3) {
      urgencyScore = 70;
      insights.push('📅 Follow-up due soon');
    } else if (daysUntilFollowup <= 7) {
      urgencyScore = 50;
    } else {
      urgencyScore = 30;
    }
  }

  // Deal stage urgency
  if (contact.open_deals_count > 0) {
    urgencyScore = Math.min(urgencyScore + 30, 100);
    insights.push(`💼 ${contact.open_deals_count} active deal${contact.open_deals_count > 1 ? 's' : ''}`);
  }

  // 3. VALUE SCORING (0-100)
  // Based on deal potential
  const openDealsValue = (contact.open_deals_count || 0) * 30;
  const closedDealsValue = (contact.closed_deals_count || 0) * 40;
  valueScore = Math.min(openDealsValue + closedDealsValue, 70);

  // Company value indicator
  if (contact.company) {
    if (contact.company.toLowerCase().includes('realty') || 
        contact.company.toLowerCase().includes('properties') ||
        contact.company.toLowerCase().includes('group')) {
      valueScore += 20;
      insights.push('🏢 High-value company');
    } else {
      valueScore += 10;
    }
  }

  // Activity value
  if (contact.activities_count > 10) {
    valueScore += 10;
  } else if (contact.activities_count > 5) {
    valueScore += 5;
  }

  valueScore = Math.min(valueScore, 100);

  // 4. CONVERSION PROBABILITY (0-100)
  // Machine learning simulation based on patterns
  let probability = 20; // Base probability

  // Engagement factor
  probability += (engagementScore / 100) * 30;

  // Deal momentum
  if (contact.open_deals_count > 0) {
    probability += 20;
    if (contact.closed_deals_count > 0) {
      probability += 15; // Has history of closing
      insights.push('✅ Previous successful deals');
    }
  }

  // Recency factor
  if (contact.last_contact_date) {
    const daysSince = (Date.now() - new Date(contact.last_contact_date)) / (1000 * 60 * 60 * 24);
    if (daysSince <= 7) probability += 15;
    else if (daysSince <= 30) probability += 5;
    else probability -= 10;
  }

  // Communication quality (simulated based on available data)
  if (completedCalls > 3) {
    probability += 10;
    insights.push('📞 Strong phone engagement');
  }

  probability = Math.min(Math.max(probability, 0), 100);

  // 5. OVERALL LEAD SCORE
  // Weighted average with urgency boost
  const baseScore = (
    engagementScore * 0.3 +
    valueScore * 0.3 +
    probability * 0.4
  );

  // Apply urgency multiplier
  const urgencyMultiplier = 1 + (urgencyScore / 200); // Up to 1.5x for urgent leads
  const overallScore = Math.min(Math.round(baseScore * urgencyMultiplier), 100);

  // Add AI insights based on score
  if (overallScore >= 80) {
    insights.push('🔥 Hot lead - prioritize immediately');
  } else if (overallScore >= 60) {
    insights.push('♨️ Warm lead - maintain regular contact');
  } else if (overallScore >= 40) {
    insights.push('❄️ Cold lead - needs nurturing');
  } else {
    insights.push('🧊 Very cold - consider re-engagement campaign');
  }

  // Specific recommendations
  if (engagementScore < 30) {
    insights.push('💡 Low engagement - try different communication channel');
  }
  if (valueScore > 70 && probability < 50) {
    insights.push('💰 High value but low probability - needs attention');
  }
  if (!contact.last_contact_date || 
      (Date.now() - new Date(contact.last_contact_date)) / (1000 * 60 * 60 * 24) > 30) {
    insights.push('📱 No recent contact - reach out soon');
  }

  return {
    overall: overallScore,
    engagement: Math.round(engagementScore),
    urgency: Math.round(urgencyScore),
    value: Math.round(valueScore),
    conversionProbability: Math.round(probability),
    insights: insights.slice(0, 5) // Limit to top 5 insights
  };
}

async function getPredictions(req, res) {
  const { type = 'summary' } = req.query;

  try {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('id, name, company, phone_number, email, lead_score, conversion_probability, engagement_score, urgency_score, value_score, ai_insights, score_updated_at')
      .order('lead_score', { ascending: false });

    if (error) throw error;

    if (type === 'detailed') {
      // Return detailed predictions for each contact
      res.status(200).json({
        contacts: contacts.map(c => ({
          ...c,
          recommendation: getRecommendation(c)
        }))
      });
    } else {
      // Return summary statistics
      const summary = {
        scoreDistribution: {
          hot: contacts.filter(c => c.lead_score >= 80).length,
          warm: contacts.filter(c => c.lead_score >= 60 && c.lead_score < 80).length,
          cold: contacts.filter(c => c.lead_score >= 40 && c.lead_score < 60).length,
          veryCold: contacts.filter(c => c.lead_score < 40).length
        },
        conversionPredictions: {
          highProbability: contacts.filter(c => c.conversion_probability >= 70),
          mediumProbability: contacts.filter(c => c.conversion_probability >= 40 && c.conversion_probability < 70),
          lowProbability: contacts.filter(c => c.conversion_probability < 40)
        },
        urgentActions: contacts.filter(c => c.urgency_score >= 80),
        topOpportunities: contacts
          .filter(c => c.value_score >= 70)
          .slice(0, 20),
        recommendations: {
          immediateAction: contacts.filter(c => c.urgency_score >= 90).slice(0, 10),
          highValueTargets: contacts.filter(c => c.value_score >= 80 && c.conversion_probability >= 60).slice(0, 10),
          reEngagement: contacts.filter(c => c.engagement_score < 30 && c.value_score >= 50).slice(0, 10)
        }
      };

      res.status(200).json(summary);
    }
  } catch (error) {
    console.error('Get predictions error:', error);
    res.status(500).json({ error: 'Failed to get predictions', details: error.message });
  }
}

function getRecommendation(contact) {
  const recommendations = [];
  
  if (contact.urgency_score >= 90) {
    recommendations.push({ priority: 'HIGH', action: 'Call immediately', reason: 'Overdue follow-up' });
  }
  
  if (contact.conversion_probability >= 70 && contact.engagement_score >= 60) {
    recommendations.push({ priority: 'HIGH', action: 'Send proposal', reason: 'High conversion probability' });
  }
  
  if (contact.value_score >= 80 && contact.engagement_score < 40) {
    recommendations.push({ priority: 'MEDIUM', action: 'Re-engage with personalized outreach', reason: 'High value but low engagement' });
  }
  
  if (contact.engagement_score < 20) {
    recommendations.push({ priority: 'LOW', action: 'Add to nurture campaign', reason: 'Very low engagement' });
  }
  
  return recommendations;
}