import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://didmparfeydjbcuzgaif.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZG1wYXJmZXlkamJjdXpnYWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MzQ4MjMsImV4cCI6MjA2OTUxMDgyM30.3pQvnFHqjLJwEZhDkFsVs6-SPqe87DNf2m0YuVbEuvw'
const supabase = createClient(supabaseUrl, supabaseKey)

export default function VoiCRM() {
  const [contacts, setContacts] = useState([])
  const [currentCall, setCurrentCall] = useState(null)
  const [callTimer, setCallTimer] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [aiInsights, setAiInsights] = useState({
    leadScore: '--',
    sentiment: 'Neutral',
    intent: '--',
    urgency: '--'
  })
  const [coachingTips, setCoachingTips] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentFilter, setCurrentFilter] = useState('all')
  const [notifications, setNotifications] = useState([])

  const recognitionRef = useRef(null)
  const timerRef = useRef(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      recognitionRef.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
      recognitionRef.current.lang = 'en-AU'
      recognitionRef.current.interimResults = true
      recognitionRef.current.continuous = false

      recognitionRef.current.onstart = () => {
        setIsListening(true)
      }

      recognitionRef.current.onresult = async (event) => {
        const transcript = event.results[0][0].transcript
        if (event.results[0].isFinal) {
          await processVoiceCommand(transcript)
          
          // If in call, analyze conversation
          if (currentCall) {
            await analyzeConversation(transcript, currentCall.contactId, currentCall.callSid)
          }
        }
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }

    loadContacts()
  }, [])

  // Call timer effect
  useEffect(() => {
    if (currentCall) {
      timerRef.current = setInterval(() => {
        setCallTimer(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      setCallTimer(0)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [currentCall])

  // Load contacts from Supabase
  const loadContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          lead_scores (score, conversion_probability),
          communication_patterns (preferred_channel, engagement_score)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error('Error loading contacts:', error)
      showNotification('Error loading contacts', 'error')
    }
  }

  // Process voice commands
  const processVoiceCommand = async (transcript) => {
    try {
      // Parse "Log contact Name, Phone" format
      const logMatch = transcript.match(/log contact (.+),\s*(.+)/i)
      if (logMatch) {
        const [, name, phone] = logMatch
        await createContact(name.trim(), phone.trim())
        return
      }

      // Call command
      if (transcript.toLowerCase().includes('call')) {
        const phoneMatch = transcript.match(/call (.+)/i)
        if (phoneMatch) {
          const contact = contacts.find(c => 
            c.name?.toLowerCase().includes(phoneMatch[1].toLowerCase()) ||
            c.phone_number?.includes(phoneMatch[1])
          )
          if (contact) {
            startCall(contact)
          }
        }
      }
    } catch (error) {
      console.error('Error processing voice command:', error)
      showNotification('Error processing voice command', 'error')
    }
  }

  // AI conversation analysis
  const analyzeConversation = async (transcript, contactId, callSid) => {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/ai-conversation-intelligence`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          contactId,
          callSid,
          realTimeMode: true
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setAiInsights({
          leadScore: result.analysis.lead_score || '--',
          sentiment: result.analysis.sentiment_label?.charAt(0).toUpperCase() + 
                    result.analysis.sentiment_label?.slice(1) || 'Neutral',
          intent: result.analysis.intent?.replace('_', ' ') || '--',
          urgency: result.analysis.urgency?.charAt(0).toUpperCase() + 
                   result.analysis.urgency?.slice(1) || '--'
        })
        
        if (result.coaching_tips?.length > 0) {
          setCoachingTips(result.coaching_tips)
          setTimeout(() => setCoachingTips([]), 10000)
        }
      }
    } catch (error) {
      console.error('Error analyzing conversation:', error)
    }
  }

  // Create new contact
  const createContact = async (name, phone) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          name,
          phone_number: phone,
          status: 'lead',
          source: 'voice_command',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      setContacts(prev => [data, ...prev])
      showNotification(`Contact ${name} created successfully`, 'success')
      
      // Auto-assign lead score
      await calculateLeadScore(data.id)
    } catch (error) {
      console.error('Error creating contact:', error)
      showNotification('Error creating contact', 'error')
    }
  }

  // Calculate lead score using automation engine
  const calculateLeadScore = async (contactId) => {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/automation-engine/smart-routing`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contactId })
      })

      const result = await response.json()
      if (result.success) {
        await loadContacts()
      }
    } catch (error) {
      console.error('Error calculating lead score:', error)
    }
  }

  // Start call
  const startCall = (contact) => {
    setCurrentCall({
      contactId: contact.id,
      callSid: `call_${Date.now()}`,
      startTime: Date.now(),
      contact
    })
    setCallTimer(0)
    showNotification(`Call started with ${contact.name}`, 'success')
  }

  // End call
  const endCall = async () => {
    if (currentCall) {
      // Log call to database
      try {
        await supabase
          .from('call_logs')
          .insert({
            contact_id: currentCall.contactId,
            call_sid: currentCall.callSid,
            direction: 'outbound',
            duration: callTimer,
            status: 'completed',
            created_at: new Date(currentCall.startTime).toISOString()
          })
          
        // Update contact last contact date
        await supabase
          .from('contacts')
          .update({ 
            last_contact: new Date().toISOString(),
            last_contact_date: new Date().toISOString()
          })
          .eq('id', currentCall.contactId)
          
        await loadContacts()
      } catch (error) {
        console.error('Error logging call:', error)
      }

      showNotification(`Call ended - Duration: ${Math.floor(callTimer / 60)}:${(callTimer % 60).toString().padStart(2, '0')}`, 'success')
      setCurrentCall(null)
      setCallTimer(0)
      setCoachingTips([])
    }
  }

  // Voice recognition toggle
  const toggleVoiceRecognition = () => {
    if (isListening) {
      recognitionRef.current?.stop()
    } else {
      recognitionRef.current?.start()
    }
  }

  // Show notification
  const showNotification = (message, type = 'success') => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 4000)
  }

  // Filter contacts
  const getFilteredContacts = () => {
    let filtered = contacts

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(contact => 
        contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone_number?.includes(searchTerm) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply category filter
    switch (currentFilter) {
      case 'hot':
        filtered = filtered.filter(c => (c.lead_scores?.[0]?.score || c.lead_score || 0) >= 80)
        break
      case 'warm':
        filtered = filtered.filter(c => {
          const score = c.lead_scores?.[0]?.score || c.lead_score || 0
          return score >= 60 && score < 80
        })
        break
      case 'cold':
        filtered = filtered.filter(c => (c.lead_scores?.[0]?.score || c.lead_score || 0) < 60)
        break
      case 'recent':
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        filtered = filtered.filter(c => 
          c.last_contact && new Date(c.last_contact) > oneDayAgo
        )
        break
    }

    return filtered
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const filteredContacts = getFilteredContacts()
  const stats = {
    totalContacts: contacts.length,
    hotLeads: contacts.filter(c => (c.lead_scores?.[0]?.score || c.lead_score || 0) >= 80).length,
    callsToday: contacts.filter(c => {
      const today = new Date().toDateString()
      return c.last_contact && new Date(c.last_contact).toDateString() === today
    }).length
  }

  return (
    <>
      <Head>
        <title>VoiCRM - AI-Powered Real Estate Communication Platform</title>
        <meta name="description" content="Advanced VoIP-CRM platform with real-time AI conversation intelligence for Australian real estate professionals" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white font-['Inter']">
        {/* Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`px-6 py-3 rounded-lg shadow-lg text-white max-w-sm transform transition-all duration-300 ${
                notification.type === 'success' ? 'bg-green-500' :
                notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
              }`}
            >
              {notification.message}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 h-screen">
          {/* Sidebar */}
          <div className="lg:col-span-2 bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6">
            <div className="text-2xl font-bold mb-8 text-center">VoiCRM</div>
            <nav className="space-y-2">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-600 text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                </svg>
                <span>Contacts</span>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
                <span>Pipeline</span>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                </svg>
                <span>Analytics</span>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
                </svg>
                <span>Automation</span>
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-7 p-8 overflow-y-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Contact Management</h1>
                <div className="flex space-x-4">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg text-center shadow-lg">
                    <div className="text-2xl font-bold">{stats.totalContacts}</div>
                    <div className="text-xs uppercase tracking-wide opacity-90">Total Contacts</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg text-center shadow-lg">
                    <div className="text-2xl font-bold">{stats.hotLeads}</div>
                    <div className="text-xs uppercase tracking-wide opacity-90">Hot Leads</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-lg text-center shadow-lg">
                    <div className="text-2xl font-bold">{stats.callsToday}</div>
                    <div className="text-xs uppercase tracking-wide opacity-90">Calls Today</div>
                  </div>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search contacts by name, phone, or property interest..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg text-lg focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex space-x-3 mb-6 flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All Contacts' },
                  { key: 'hot', label: 'Hot Leads (80+)' },
                  { key: 'warm', label: 'Warm Leads (60-79)' },
                  { key: 'cold', label: 'Cold Leads (<60)' },
                  { key: 'recent', label: 'Recent Activity' }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setCurrentFilter(filter.key)}
                    className={`px-4 py-2 rounded-full border transition-colors ${
                      currentFilter === filter.key
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contacts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredContacts.map(contact => {
                const leadScore = contact.lead_scores?.[0]?.score || contact.lead_score || 50
                const scoreColor = leadScore >= 80 ? 'bg-green-500' : leadScore >= 60 ? 'bg-yellow-500' : 'bg-gray-500'
                const lastContact = contact.last_contact ? new Date(contact.last_contact).toLocaleDateString() : 'Never'

                return (
                  <div key={contact.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{contact.name || 'Unknown'}</h3>
                        <p className="text-gray-600 font-mono">{contact.phone_number || ''}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${scoreColor}`}>
                        {leadScore}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                        </svg>
                        {contact.email || 'No email'}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                        </svg>
                        Last contact: {lastContact}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        {contact.status?.replace('_', ' ') || 'lead'}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => startCall(contact)}
                        disabled={currentCall !== null}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                        </svg>
                        <span>Call</span>
                      </button>
                      <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                        </svg>
                        <span>SMS</span>
                      </button>
                      <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* AI Panel */}
          <div className="lg:col-span-3 bg-gradient-to-b from-indigo-900 to-purple-900 text-white p-6">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold mb-2">AI Assistant</h2>
              <p className="text-indigo-200 text-sm">Real-time conversation intelligence</p>
            </div>

            {/* AI Status */}
            <div className={`p-4 rounded-lg border mb-6 text-center ${
              currentCall 
                ? 'bg-blue-500/20 border-blue-400' 
                : 'bg-green-500/20 border-green-400'
            }`}>
              {currentCall ? '📞 Call active - AI analyzing conversation' : '🤖 AI Ready - Start a conversation'}
            </div>

            {/* AI Insights */}
            <div className="bg-white/10 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-3">Live Insights</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs uppercase tracking-wide opacity-70">Lead Score</div>
                  <div className="text-lg font-bold">{aiInsights.leadScore}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide opacity-70">Sentiment</div>
                  <div className="text-lg font-bold">{aiInsights.sentiment}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide opacity-70">Intent</div>
                  <div className="text-lg font-bold">{aiInsights.intent}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide opacity-70">Urgency</div>
                  <div className="text-lg font-bold">{aiInsights.urgency}</div>
                </div>
              </div>
            </div>

            {/* Coaching Tips */}
            {coachingTips.length > 0 && (
              <div className="bg-yellow-500/20 border border-yellow-400 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-3 flex items-center">
                  💡 Real-time Coaching
                </h3>
                <div className="space-y-2">
                  {coachingTips.map((tip, index) => (
                    <div key={index} className="text-sm">
                      • {tip.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Controls */}
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <button
                onClick={toggleVoiceRecognition}
                className={`w-20 h-20 rounded-full mb-4 text-2xl transition-all duration-300 ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-blue-500 hover:bg-blue-600 hover:scale-110'
                }`}
              >
                🎤
              </button>
              <div className="text-sm mb-3">Voice Commands</div>
              <div className="bg-black/30 rounded-lg p-3 min-h-[60px] text-sm">
                {isListening 
                  ? 'Listening for your voice...' 
                  : 'Say "Log contact [Name], [Phone]" to create new contact'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Call Interface */}
        {currentCall && (
          <div className="fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl p-6 min-w-[300px] border border-gray-200">
            <div className="text-center mb-4">
              <div className="text-lg font-semibold">{currentCall.contact.name}</div>
              <div className="text-3xl font-mono font-bold text-blue-600">{formatTime(callTimer)}</div>
              <div className="text-sm text-gray-500">Crystal Clear Quality</div>
            </div>
            
            <div className="flex justify-center space-x-3">
              <button className="w-12 h-12 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors flex items-center justify-center">
                🔇
              </button>
              <button 
                onClick={endCall}
                className="w-12 h-12 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center"
              >
                📞
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}