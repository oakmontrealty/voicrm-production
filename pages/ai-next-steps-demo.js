// AI Next Steps Demo Page
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  ClipboardDocumentListIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  DocumentCheckIcon,
  UserGroupIcon,
  BellAlertIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ChevronRightIcon,
  LightBulbIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function AINextStepsDemo() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [nextSteps, setNextSteps] = useState(null);
  const [selectedStep, setSelectedStep] = useState(null);
  const [showDemo, setShowDemo] = useState(false);

  // Sample call transcript for demo
  const sampleCall = {
    transcript: `Agent: Good morning! This is Sarah from our real estate office. I'm calling about your inquiry on the Gregory Hills property.

Customer: Oh yes, hi Sarah! We're very interested in that 4-bedroom house on Hartley Road.

Agent: Wonderful! It's a beautiful property. Are you looking to move soon?

Customer: Yes, our lease ends in about 6 weeks, so we need to find something quickly.

Agent: Perfect timing! The property is still available and the sellers are motivated. Would you like to view it this weekend?

Customer: That would be great! Saturday morning would work best for us.

Agent: Excellent! How about 10 AM on Saturday? I can also show you two similar properties nearby if you're interested.

Customer: 10 AM works perfectly. And yes, we'd love to see the other properties too.

Agent: Great! I'll send you an email confirmation with all the details including the addresses and parking information. Also, I'll prepare a comparison sheet of all three properties with recent sales data.

Customer: That sounds very helpful. Also, we're pre-approved for $850,000. Is that within range?

Agent: Yes, that's definitely within range for these properties. I'll also include financing options from our preferred brokers in the information packet.

Customer: Perfect. Oh, one more thing - we have two dogs. Are pets allowed?

Agent: I'll need to confirm the pet policy for each property and include that in the email. I'll have that information to you by end of day today.

Customer: Thank you so much, Sarah. Looking forward to Saturday!

Agent: My pleasure! I'll send the confirmation within the hour, and I'll call you Friday afternoon to confirm everything. Have a great day!`,
    metadata: {
      callId: 'call_demo_12345',
      agentId: 'agent_sarah',
      agentName: 'Sarah Mitchell',
      customerId: 'cust_98765',
      customerName: 'John & Mary Chen',
      customerPhone: '+61412345678',
      customerEmail: 'jmchen@email.com',
      propertyAddress: '45 Hartley Road, Gregory Hills NSW 2557',
      callDate: new Date().toISOString()
    },
    callScore: 92,
    duration: 245 // seconds
  };

  const startDemo = async () => {
    setIsProcessing(true);
    setShowDemo(true);
    
    // Simulate API call
    setTimeout(() => {
      const generatedSteps = {
        callId: sampleCall.metadata.callId,
        timestamp: new Date(),
        agent: sampleCall.metadata.agentName,
        customer: sampleCall.metadata.customerName,
        nextSteps: [
          {
            id: 'step_1',
            type: 'email',
            title: 'Send viewing confirmation email',
            description: 'Send confirmation for Saturday 10 AM viewing with property details, addresses, and parking information',
            priority: { level: 1, color: '#dc2626', label: 'Urgent' },
            deadline: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
            assignee: { name: 'Sarah Mitchell' },
            customer: { name: 'John & Mary Chen', email: 'jmchen@email.com' },
            context: {
              propertyAddress: '45 Hartley Road, Gregory Hills NSW 2557',
              additionalNotes: 'Include 2 similar properties for viewing'
            },
            successCriteria: [
              'Email sent within 1 hour',
              'All 3 property addresses included',
              'Parking information provided',
              'Viewing time confirmed'
            ],
            canAutomate: true,
            status: 'pending',
            suggestions: [
              { type: 'template', message: 'Use viewing confirmation template #3' },
              { type: 'attachment', message: 'Attach property brochures' }
            ]
          },
          {
            id: 'step_2',
            type: 'research',
            title: 'Confirm pet policies for all properties',
            description: 'Check and confirm pet policies for the 3 properties, customer has 2 dogs',
            priority: { level: 1, color: '#dc2626', label: 'Urgent' },
            deadline: new Date(Date.now() + 8 * 60 * 60 * 1000), // End of day
            assignee: { name: 'Sarah Mitchell' },
            successCriteria: [
              'Pet policy confirmed for all 3 properties',
              'Information sent to customer',
              'Any restrictions documented'
            ],
            status: 'pending'
          },
          {
            id: 'step_3',
            type: 'document',
            title: 'Prepare property comparison sheet',
            description: 'Create comparison sheet with recent sales data for all 3 properties',
            priority: { level: 2, color: '#ea580c', label: 'High' },
            deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            assignee: { name: 'Sarah Mitchell' },
            successCriteria: [
              'Recent sales data included',
              'Key features compared',
              'Price analysis completed',
              'Financing options included'
            ],
            status: 'pending'
          },
          {
            id: 'step_4',
            type: 'property_viewing',
            title: 'Property viewing appointment',
            description: 'Show 3 properties to John & Mary Chen, starting at Gregory Hills',
            priority: { level: 2, color: '#ea580c', label: 'High' },
            deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).setHours(10, 0, 0, 0), // Saturday 10 AM
            assignee: { name: 'Sarah Mitchell' },
            customer: { name: 'John & Mary Chen', phone: '+61412345678' },
            context: {
              properties: [
                '45 Hartley Road, Gregory Hills',
                'Similar Property #1',
                'Similar Property #2'
              ]
            },
            successCriteria: [
              'All 3 properties shown',
              'Customer questions answered',
              'Next steps identified',
              'Feedback collected'
            ],
            status: 'pending'
          },
          {
            id: 'step_5',
            type: 'callback',
            title: 'Friday confirmation call',
            description: 'Call customer Friday afternoon to confirm Saturday viewing',
            priority: { level: 3, color: '#ca8a04', label: 'Medium' },
            deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).setHours(15, 0, 0, 0), // Friday 3 PM
            assignee: { name: 'Sarah Mitchell' },
            customer: { name: 'John & Mary Chen', phone: '+61412345678' },
            successCriteria: [
              'Viewing confirmed',
              'Any questions answered',
              'Reminder about what to bring'
            ],
            status: 'pending'
          },
          {
            id: 'step_6',
            type: 'document',
            title: 'Prepare financing options packet',
            description: 'Compile financing options from preferred brokers for $850k pre-approval',
            priority: { level: 3, color: '#ca8a04', label: 'Medium' },
            deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
            assignee: { name: 'Sarah Mitchell' },
            context: {
              preApprovalAmount: '$850,000',
              notes: 'Customer is pre-approved'
            },
            successCriteria: [
              'Multiple lender options provided',
              'Rate comparisons included',
              'Monthly payment calculations'
            ],
            status: 'pending'
          }
        ],
        reminders: [
          {
            type: 'pre_task',
            message: 'Send viewing confirmation email in 30 minutes',
            triggerTime: new Date(Date.now() + 30 * 60 * 1000)
          },
          {
            type: 'deadline',
            message: 'Pet policy research due by end of day',
            triggerTime: new Date(Date.now() + 8 * 60 * 60 * 1000)
          },
          {
            type: 'customer_expectation',
            message: 'Customer expecting viewing confirmation today',
            triggerTime: new Date(Date.now() + 2 * 60 * 60 * 1000)
          }
        ],
        summary: {
          total: 6,
          byPriority: { 'Urgent': 2, 'High': 2, 'Medium': 2 },
          byType: { 
            'email': 1, 
            'research': 1, 
            'document': 2, 
            'property_viewing': 1, 
            'callback': 1 
          },
          urgentActions: [
            { title: 'Send viewing confirmation email', deadline: new Date(Date.now() + 60 * 60 * 1000) },
            { title: 'Confirm pet policies', deadline: new Date(Date.now() + 8 * 60 * 60 * 1000) }
          ],
          automatedActions: 1
        },
        automatedActions: [
          {
            stepId: 'step_1',
            type: 'email',
            action: 'auto_email',
            scheduledFor: new Date(Date.now() + 30 * 60 * 1000),
            status: 'pending'
          }
        ],
        templates: {
          'step_1': {
            type: 'email',
            subject: 'Viewing Confirmation - Saturday 10 AM - Gregory Hills Properties',
            body: `Dear John & Mary,

Thank you for your interest in viewing properties this Saturday!

This email confirms your property viewing appointment:

📅 Date: Saturday, [Date]
⏰ Time: 10:00 AM
📍 Starting Location: 45 Hartley Road, Gregory Hills NSW 2557

We'll be viewing 3 properties in total:
1. 45 Hartley Road, Gregory Hills - 4 bed, 2 bath, double garage
2. [Similar Property 1 Address] - 4 bed, 2.5 bath, double garage  
3. [Similar Property 2 Address] - 4 bed, 2 bath, single garage + carport

Parking Information:
- Property 1: Street parking available directly in front
- Property 2: Visitor parking in driveway
- Property 3: Street parking on adjacent road

What to Bring:
- Photo ID
- Pre-approval letter (you mentioned $850k - perfect for these properties!)
- Any specific questions about the properties

I'll send through the pet policy information for all properties by end of day today, and will include a detailed comparison sheet tomorrow.

I'll give you a call Friday afternoon to confirm everything.

Looking forward to showing you these beautiful homes!

Best regards,
Sarah Mitchell
Real Estate Agent
0412 XXX XXX`,
            sendTime: new Date(Date.now() + 30 * 60 * 1000)
          }
        }
      };
      
      setNextSteps(generatedSteps);
      setIsProcessing(false);
    }, 2000);
  };

  const getTypeIcon = (type) => {
    const icons = {
      email: <EnvelopeIcon className="h-5 w-5" />,
      callback: <PhoneIcon className="h-5 w-5" />,
      document: <DocumentTextIcon className="h-5 w-5" />,
      research: <MagnifyingGlassIcon className="h-5 w-5" />,
      property_viewing: <HomeIcon className="h-5 w-5" />,
      appointment: <CalendarIcon className="h-5 w-5" />,
      contract: <DocumentCheckIcon className="h-5 w-5" />,
      referral: <UserGroupIcon className="h-5 w-5" />
    };
    return icons[type] || <ClipboardDocumentListIcon className="h-5 w-5" />;
  };

  const formatDeadline = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffHours = (deadlineDate - now) / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      return `${Math.round(diffHours * 60)} minutes`;
    } else if (diffHours < 24) {
      return `${Math.round(diffHours)} hours`;
    } else {
      const diffDays = Math.round(diffHours / 24);
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <ClipboardDocumentListIcon className="h-10 w-10 text-[#636B56]" />
            <div>
              <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
                AI Next Steps Generator
              </h1>
              <p className="text-[#7a7a7a]">Automatically generate follow-up tasks from calls</p>
            </div>
          </div>
        </div>

        {/* Demo Control */}
        {!showDemo && (
          <div className="bg-gradient-to-r from-[#636B56] to-[#864936] rounded-xl p-12 text-white text-center">
            <SparklesIcon className="h-20 w-20 mx-auto mb-6 animate-pulse" />
            <h2 className="text-2xl font-bold mb-4">See AI Generate Smart Next Steps</h2>
            <p className="text-lg mb-8 opacity-90">
              Watch how AI analyzes a call and creates actionable follow-up tasks with deadlines, templates, and automation
            </p>
            <button
              onClick={startDemo}
              className="px-8 py-4 bg-white text-[#636B56] rounded-lg font-bold text-lg hover:shadow-lg transition-all"
            >
              Generate Next Steps from Call
            </button>
          </div>
        )}

        {/* Processing Animation */}
        {isProcessing && (
          <div className="bg-white rounded-xl p-12 text-center">
            <ArrowPathIcon className="h-16 w-16 mx-auto text-[#636B56] animate-spin mb-4" />
            <h3 className="text-xl font-semibold text-[#1a1a1a] mb-2">Analyzing Call Transcript...</h3>
            <p className="text-[#7a7a7a]">Identifying commitments, extracting action items, setting priorities...</p>
          </div>
        )}

        {/* Next Steps Display */}
        {nextSteps && !isProcessing && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-[#B28354]/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#7a7a7a]">Total Tasks</span>
                  <ClipboardDocumentListIcon className="h-5 w-5 text-[#636B56]" />
                </div>
                <p className="text-2xl font-bold text-[#636B56]">{nextSteps.summary.total}</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#7a7a7a]">Urgent Actions</span>
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                </div>
                <p className="text-2xl font-bold text-red-600">{nextSteps.summary.byPriority['Urgent'] || 0}</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#7a7a7a]">Automated</span>
                  <SparklesIcon className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-blue-600">{nextSteps.summary.automatedActions}</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#7a7a7a]">Reminders Set</span>
                  <BellAlertIcon className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-green-600">{nextSteps.reminders.length}</p>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tasks List */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl border border-[#B28354]/20 shadow-lg">
                  <div className="p-6 border-b border-[#B28354]/20">
                    <h2 className="text-xl font-bold text-[#636B56]">Generated Next Steps</h2>
                    <p className="text-sm text-[#7a7a7a] mt-1">Click on a task to see details</p>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {nextSteps.nextSteps.map((step) => (
                      <div
                        key={step.id}
                        onClick={() => setSelectedStep(step)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                          selectedStep?.id === step.id 
                            ? 'border-[#636B56] bg-[#636B56]/5' 
                            : 'border-gray-200 hover:border-[#B28354]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            step.priority.level === 1 ? 'bg-red-100 text-red-600' :
                            step.priority.level === 2 ? 'bg-orange-100 text-orange-600' :
                            'bg-yellow-100 text-yellow-600'
                          }`}>
                            {getTypeIcon(step.type)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-[#1a1a1a]">{step.title}</h3>
                              {step.canAutomate && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                  Auto
                                </span>
                              )}
                            </div>
                            
                            <p className="text-sm text-[#7a7a7a] mb-2">{step.description}</p>
                            
                            <div className="flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-1">
                                <ClockIcon className="h-4 w-4 text-[#7a7a7a]" />
                                <span className="text-[#4a4a4a]">Due in {formatDeadline(step.deadline)}</span>
                              </div>
                              
                              <span className={`px-2 py-1 rounded-full font-medium`} 
                                style={{ backgroundColor: `${step.priority.color}20`, color: step.priority.color }}>
                                {step.priority.label}
                              </span>
                              
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                step.status === 'completed' ? 'bg-green-100 text-green-700' :
                                step.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {step.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Details Panel */}
              <div>
                {selectedStep ? (
                  <div className="bg-white rounded-xl border border-[#B28354]/20 shadow-lg p-6">
                    <h3 className="text-lg font-bold text-[#636B56] mb-4">Task Details</h3>
                    
                    {/* Success Criteria */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-[#4a4a4a] mb-2">Success Criteria</h4>
                      <ul className="space-y-2">
                        {selectedStep.successCriteria.map((criteria, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircleIcon className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-[#1a1a1a]">{criteria}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Suggestions */}
                    {selectedStep.suggestions && selectedStep.suggestions.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-[#4a4a4a] mb-2">AI Suggestions</h4>
                        <div className="space-y-2">
                          {selectedStep.suggestions.map((suggestion, index) => (
                            <div key={index} className="flex items-start gap-2 p-2 bg-[#F8F2E7] rounded">
                              <LightBulbIcon className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-[#4a4a4a]">{suggestion.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="space-y-2">
                      <button className="w-full py-2 px-4 bg-[#636B56] text-white rounded-lg font-medium hover:bg-[#636B56]/90 transition-colors">
                        Mark as Complete
                      </button>
                      {selectedStep.canAutomate && (
                        <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                          Execute Automation
                        </button>
                      )}
                      <button className="w-full py-2 px-4 border border-[#636B56] text-[#636B56] rounded-lg font-medium hover:bg-[#636B56]/5 transition-colors">
                        Edit Task
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#F8F2E7] rounded-xl p-6">
                    <h3 className="text-lg font-bold text-[#636B56] mb-4">How It Works</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <ChevronRightIcon className="h-5 w-5 text-[#636B56] flex-shrink-0" />
                        <span className="text-sm text-[#4a4a4a]">AI analyzes call transcripts in real-time</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRightIcon className="h-5 w-5 text-[#636B56] flex-shrink-0" />
                        <span className="text-sm text-[#4a4a4a]">Identifies commitments and action items</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRightIcon className="h-5 w-5 text-[#636B56] flex-shrink-0" />
                        <span className="text-sm text-[#4a4a4a]">Sets smart deadlines based on urgency</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRightIcon className="h-5 w-5 text-[#636B56] flex-shrink-0" />
                        <span className="text-sm text-[#4a4a4a]">Generates email/text templates</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRightIcon className="h-5 w-5 text-[#636B56] flex-shrink-0" />
                        <span className="text-sm text-[#4a4a4a]">Creates automated reminders</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRightIcon className="h-5 w-5 text-[#636B56] flex-shrink-0" />
                        <span className="text-sm text-[#4a4a4a]">Checks for scheduling conflicts</span>
                      </li>
                    </ul>
                  </div>
                )}

                {/* Email Template Preview */}
                {selectedStep?.id === 'step_1' && nextSteps.templates['step_1'] && (
                  <div className="mt-6 bg-white rounded-xl border border-[#B28354]/20 shadow-lg p-6">
                    <h3 className="text-lg font-bold text-[#636B56] mb-4">Email Template</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-semibold text-[#4a4a4a] mb-2">Subject:</p>
                      <p className="text-sm text-[#1a1a1a] mb-4">{nextSteps.templates['step_1'].subject}</p>
                      <p className="text-sm font-semibold text-[#4a4a4a] mb-2">Body:</p>
                      <pre className="text-xs text-[#1a1a1a] whitespace-pre-wrap font-sans">
                        {nextSteps.templates['step_1'].body}
                      </pre>
                    </div>
                    <button className="w-full mt-4 py-2 px-4 bg-[#636B56] text-white rounded-lg font-medium hover:bg-[#636B56]/90 transition-colors">
                      Send Email Now
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Reminders Section */}
            {nextSteps.reminders && nextSteps.reminders.length > 0 && (
              <div className="bg-white rounded-xl border border-[#B28354]/20 shadow-lg p-6">
                <h3 className="text-lg font-bold text-[#636B56] mb-4">
                  <BellAlertIcon className="h-6 w-6 inline mr-2" />
                  Automated Reminders
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {nextSteps.reminders.map((reminder, index) => (
                    <div key={index} className="p-4 bg-[#F8F2E7] rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <BellAlertIcon className="h-5 w-5 text-[#864936]" />
                        <span className="text-sm font-semibold text-[#864936] capitalize">
                          {reminder.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-[#4a4a4a] mb-1">{reminder.message}</p>
                      <p className="text-xs text-[#7a7a7a]">
                        {new Date(reminder.triggerTime).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}