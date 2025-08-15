import { useState, useEffect, useRef } from 'react';
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  CalendarIcon
} from '@heroicons/react/24/solid';

// Cross-reference component that shows before ANY contact
export default function ContactCrossReference({ 
  contactId, 
  contactInfo,
  mode, // 'call', 'email', 'sms', 'whatsapp'
  onProceed,
  onCancel,
  isInbound = false
}) {
  const [lastInteraction, setLastInteraction] = useState(null);
  const [interactionHistory, setInteractionHistory] = useState([]);
  const [aiSummary, setAiSummary] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [mustAcknowledge, setMustAcknowledge] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch all interaction history
  useEffect(() => {
    const fetchInteractionHistory = async () => {
      setLoading(true);
      
      try {
        // Get all interactions from multiple sources
        const [calls, emails, sms, activities, notes] = await Promise.all([
          fetch(`/api/interactions/calls?contactId=${contactId}`).then(r => r.json()),
          fetch(`/api/interactions/emails?contactId=${contactId}`).then(r => r.json()),
          fetch(`/api/interactions/sms?contactId=${contactId}`).then(r => r.json()),
          fetch(`/api/interactions/activities?contactId=${contactId}`).then(r => r.json()),
          fetch(`/api/interactions/notes?contactId=${contactId}`).then(r => r.json())
        ]);

        // Combine and sort all interactions by date
        const allInteractions = [
          ...calls.map(c => ({ ...c, type: 'call' })),
          ...emails.map(e => ({ ...e, type: 'email' })),
          ...sms.map(s => ({ ...s, type: 'sms' })),
          ...activities.map(a => ({ ...a, type: 'activity' })),
          ...notes.map(n => ({ ...n, type: 'note' }))
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setInteractionHistory(allInteractions);
        
        // Get last interaction
        if (allInteractions.length > 0) {
          setLastInteraction(allInteractions[0]);
          
          // Generate AI summary
          const summary = await generateAISummary(allInteractions);
          setAiSummary(summary);
          
          // Check for warnings and recommendations
          const { warnings, recommendations, requiresAcknowledgment } = analyzeHistory(allInteractions, mode);
          setWarnings(warnings);
          setRecommendations(recommendations);
          setMustAcknowledge(requiresAcknowledgment && !isInbound);
        }
        
      } catch (error) {
        console.error('Failed to fetch interaction history:', error);
      } finally {
        setLoading(false);
      }
    };

    if (contactId) {
      fetchInteractionHistory();
    }
  }, [contactId, mode, isInbound]);

  // Generate AI summary of all interactions
  const generateAISummary = async (interactions) => {
    // Offline AI summary generation
    const recentInteractions = interactions.slice(0, 5);
    
    const summary = {
      totalInteractions: interactions.length,
      lastContact: interactions[0]?.timestamp,
      daysSinceContact: Math.floor((Date.now() - new Date(interactions[0]?.timestamp)) / (1000 * 60 * 60 * 24)),
      
      // Key points from last interaction
      lastInteractionSummary: interactions[0] ? {
        type: interactions[0].type,
        outcome: interactions[0].outcome || 'No outcome recorded',
        notes: interactions[0].notes || interactions[0].summary || 'No notes available',
        sentiment: interactions[0].sentiment || 'neutral',
        nextSteps: interactions[0].next_steps || null
      } : null,
      
      // Relationship insights
      relationshipStatus: calculateRelationshipStatus(interactions),
      
      // Communication patterns
      preferredChannel: getMostUsedChannel(interactions),
      bestTimeToContact: getBestContactTime(interactions),
      avgResponseTime: getAverageResponseTime(interactions),
      
      // Deal status
      dealStage: interactions[0]?.deal_stage || 'prospecting',
      lastDiscussedTopics: extractTopics(interactions.slice(0, 3)),
      
      // Action items
      pendingActions: interactions.filter(i => i.pending_action).map(i => i.pending_action),
      
      // Key facts to remember
      importantNotes: extractImportantNotes(interactions)
    };

    return summary;
  };

  // Analyze history for warnings and recommendations
  const analyzeHistory = (interactions, contactMode) => {
    const warnings = [];
    const recommendations = [];
    let requiresAcknowledgment = false;

    if (!interactions.length) {
      recommendations.push({
        type: 'info',
        message: 'First contact - introduce yourself and company clearly'
      });
      return { warnings, recommendations, requiresAcknowledgment };
    }

    const lastInteraction = interactions[0];
    const daysSinceContact = Math.floor((Date.now() - new Date(lastInteraction.timestamp)) / (1000 * 60 * 60 * 24));
    const hoursSinceContact = Math.floor((Date.now() - new Date(lastInteraction.timestamp)) / (1000 * 60 * 60));

    // Check for too frequent contact
    if (hoursSinceContact < 24 && contactMode === 'call') {
      warnings.push({
        type: 'frequency',
        severity: 'high',
        message: `Called ${hoursSinceContact} hours ago - may seem pushy`
      });
      requiresAcknowledgment = true;
    }

    // Check for unresolved issues
    if (lastInteraction.outcome === 'issue' || lastInteraction.sentiment === 'negative') {
      warnings.push({
        type: 'unresolved',
        severity: 'high',
        message: 'Previous interaction had unresolved issues - address these first'
      });
      requiresAcknowledgment = true;
    }

    // Check for do-not-contact flags
    if (lastInteraction.do_not_contact) {
      warnings.push({
        type: 'do_not_contact',
        severity: 'critical',
        message: 'Contact has requested not to be contacted'
      });
      requiresAcknowledgment = true;
    }

    // Check for pending callbacks
    if (lastInteraction.callback_scheduled) {
      const callbackDate = new Date(lastInteraction.callback_scheduled);
      if (callbackDate > new Date()) {
        warnings.push({
          type: 'scheduled',
          severity: 'medium',
          message: `Callback already scheduled for ${callbackDate.toLocaleDateString()}`
        });
      }
    }

    // Recommendations based on history
    if (daysSinceContact > 30) {
      recommendations.push({
        type: 'reengagement',
        message: 'Been a while - start with friendly check-in'
      });
    }

    if (lastInteraction.next_steps) {
      recommendations.push({
        type: 'follow_up',
        message: `Follow up on: ${lastInteraction.next_steps}`
      });
      requiresAcknowledgment = true;
    }

    // Channel-specific recommendations
    if (contactMode !== getMostUsedChannel(interactions)) {
      recommendations.push({
        type: 'channel',
        message: `Customer usually prefers ${getMostUsedChannel(interactions)}`
      });
    }

    return { warnings, recommendations, requiresAcknowledgment };
  };

  // Helper functions
  const calculateRelationshipStatus = (interactions) => {
    const recentInteractions = interactions.filter(i => {
      const days = Math.floor((Date.now() - new Date(i.timestamp)) / (1000 * 60 * 60 * 24));
      return days < 30;
    });

    if (recentInteractions.length > 5) return 'highly_engaged';
    if (recentInteractions.length > 2) return 'engaged';
    if (recentInteractions.length > 0) return 'warm';
    return 'cold';
  };

  const getMostUsedChannel = (interactions) => {
    const channels = {};
    interactions.forEach(i => {
      channels[i.type] = (channels[i.type] || 0) + 1;
    });
    return Object.entries(channels).sort((a, b) => b[1] - a[1])[0]?.[0] || 'call';
  };

  const getBestContactTime = (interactions) => {
    const successfulInteractions = interactions.filter(i => i.outcome === 'success' || i.answered);
    const hours = successfulInteractions.map(i => new Date(i.timestamp).getHours());
    
    if (hours.length === 0) return 'No data';
    
    const avgHour = Math.round(hours.reduce((a, b) => a + b, 0) / hours.length);
    return `${avgHour}:00 - ${avgHour + 1}:00`;
  };

  const getAverageResponseTime = (interactions) => {
    const responseTimes = interactions
      .filter(i => i.response_time)
      .map(i => i.response_time);
    
    if (responseTimes.length === 0) return 'No data';
    
    const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    return `${Math.round(avg / 60)} minutes`;
  };

  const extractTopics = (interactions) => {
    const topics = new Set();
    interactions.forEach(i => {
      if (i.topics) topics.add(...i.topics);
      if (i.notes) {
        // Extract key topics from notes (simplified)
        const keyWords = ['price', 'location', 'financing', 'timeline', 'budget', 'requirements'];
        keyWords.forEach(word => {
          if (i.notes.toLowerCase().includes(word)) topics.add(word);
        });
      }
    });
    return Array.from(topics);
  };

  const extractImportantNotes = (interactions) => {
    const importantNotes = [];
    interactions.forEach(i => {
      if (i.important_note) importantNotes.push(i.important_note);
      if (i.personal_info) importantNotes.push(i.personal_info);
    });
    return importantNotes.slice(0, 3);
  };

  // Format time ago
  const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return new Date(date).toLocaleDateString();
  };

  // Handle proceed with contact
  const handleProceed = () => {
    if (mustAcknowledge && !acknowledged) {
      alert('Please acknowledge the previous interaction details before proceeding');
      return;
    }
    
    // Log the cross-reference check
    const crossReferenceLog = {
      contactId,
      mode,
      timestamp: new Date().toISOString(),
      lastInteraction: lastInteraction?.timestamp,
      acknowledged,
      warnings: warnings.length,
      proceeded: true
    };
    
    // Save to local storage for audit
    const logs = JSON.parse(localStorage.getItem('cross_reference_logs') || '[]');
    logs.push(crossReferenceLog);
    localStorage.setItem('cross_reference_logs', JSON.stringify(logs));
    
    onProceed();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#636B56] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading interaction history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#636B56]">Contact Cross-Reference</h2>
            <p className="text-gray-600 mt-1">
              {isInbound ? 'Incoming' : 'Preparing'} {mode} 
              {contactInfo && ` with ${contactInfo.name}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getModeIcon(mode)}
            {lastInteraction && (
              <span className="text-sm text-gray-500">
                Last: {timeAgo(lastInteraction.timestamp)}
              </span>
            )}
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="p-6 bg-red-50 border-b">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 mb-2">Warnings</h3>
                {warnings.map((warning, idx) => (
                  <div key={idx} className="mb-2">
                    <p className="text-red-700">{warning.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Summary */}
        {aiSummary && (
          <div className="p-6 border-b">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-[#636B56]" />
              AI Summary
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Relationship Status</p>
                <p className="font-semibold capitalize">{aiSummary.relationshipStatus.replace('_', ' ')}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Days Since Contact</p>
                <p className="font-semibold">{aiSummary.daysSinceContact || 'Never'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Preferred Channel</p>
                <p className="font-semibold capitalize">{aiSummary.preferredChannel}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Best Time</p>
                <p className="font-semibold">{aiSummary.bestTimeToContact}</p>
              </div>
            </div>

            {/* Last Interaction Details */}
            {aiSummary.lastInteractionSummary && (
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Last Interaction</h4>
                <p className="text-sm text-blue-700 mb-1">
                  <strong>Type:</strong> {aiSummary.lastInteractionSummary.type}
                </p>
                <p className="text-sm text-blue-700 mb-1">
                  <strong>Outcome:</strong> {aiSummary.lastInteractionSummary.outcome}
                </p>
                {aiSummary.lastInteractionSummary.notes && (
                  <p className="text-sm text-blue-700 mt-2">
                    <strong>Notes:</strong> {aiSummary.lastInteractionSummary.notes}
                  </p>
                )}
                {aiSummary.lastInteractionSummary.nextSteps && (
                  <p className="text-sm text-blue-700 mt-2 font-semibold">
                    <strong>Next Steps:</strong> {aiSummary.lastInteractionSummary.nextSteps}
                  </p>
                )}
              </div>
            )}

            {/* Important Notes */}
            {aiSummary.importantNotes?.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Remember</h4>
                <ul className="list-disc list-inside text-sm text-yellow-700">
                  {aiSummary.importantNotes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Topics Discussed */}
            {aiSummary.lastDiscussedTopics?.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">Recent Topics:</span>
                {aiSummary.lastDiscussedTopics.map((topic, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-200 rounded text-xs">
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="p-6 bg-green-50 border-b">
            <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              <InformationCircleIcon className="h-5 w-5 text-green-600" />
              Recommendations
            </h3>
            {recommendations.map((rec, idx) => (
              <p key={idx} className="text-green-700 mb-1">• {rec.message}</p>
            ))}
          </div>
        )}

        {/* Recent Interaction Timeline */}
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-800 mb-4">Recent Interactions</h3>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {interactionHistory.slice(0, 5).map((interaction, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getInteractionIcon(interaction.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{interaction.type.toUpperCase()}</p>
                      <p className="text-xs text-gray-600">{timeAgo(interaction.timestamp)}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      interaction.outcome === 'success' ? 'bg-green-100 text-green-700' :
                      interaction.outcome === 'issue' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {interaction.outcome || 'No outcome'}
                    </span>
                  </div>
                  {interaction.notes && (
                    <p className="text-sm text-gray-700 mt-2">{interaction.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Acknowledgment Section */}
        {mustAcknowledge && !isInbound && (
          <div className="p-6 bg-yellow-50 border-b">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1"
              />
              <div>
                <p className="font-semibold text-yellow-800">
                  I acknowledge the previous interaction details
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  I have reviewed the last contact summary and understand the context before proceeding.
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleProceed}
            disabled={mustAcknowledge && !acknowledged}
            className={`px-6 py-2 rounded-lg font-semibold ${
              mustAcknowledge && !acknowledged
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#636B56] text-white hover:bg-[#7a8365]'
            }`}
          >
            {isInbound ? 'View Details' : `Proceed with ${mode}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to get mode icon
function getModeIcon(mode) {
  switch (mode) {
    case 'call':
      return <PhoneIcon className="h-6 w-6 text-green-600" />;
    case 'email':
      return <EnvelopeIcon className="h-6 w-6 text-blue-600" />;
    case 'sms':
    case 'whatsapp':
      return <ChatBubbleLeftRightIcon className="h-6 w-6 text-purple-600" />;
    default:
      return null;
  }
}

// Helper function to get interaction icon
function getInteractionIcon(type) {
  switch (type) {
    case 'call':
      return <PhoneIcon className="h-4 w-4 text-green-600" />;
    case 'email':
      return <EnvelopeIcon className="h-4 w-4 text-blue-600" />;
    case 'sms':
      return <ChatBubbleLeftRightIcon className="h-4 w-4 text-purple-600" />;
    case 'activity':
      return <CalendarIcon className="h-4 w-4 text-orange-600" />;
    case 'note':
      return <DocumentTextIcon className="h-4 w-4 text-gray-600" />;
    default:
      return <InformationCircleIcon className="h-4 w-4 text-gray-400" />;
  }
}