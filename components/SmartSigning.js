import { useState, useEffect, useRef } from 'react';
import { 
  DocumentTextIcon,
  PencilIcon,
  CheckCircleIcon,
  XMarkIcon,
  ShareIcon,
  EyeIcon,
  DownloadIcon,
  PrinterIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  DocumentArrowUpIcon,
  CameraIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  SparklesIcon,
  CalendarIcon,
  BellIcon
} from '@heroicons/react/24/solid';

export default function SmartSigning() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [signingMode, setSigningMode] = useState(false);
  const [signatures, setSignatures] = useState([]);
  const [currentSignature, setCurrentSignature] = useState(null);
  const [signatureFields, setSignatureFields] = useState([]);
  const [documentStatus, setDocumentStatus] = useState('draft'); // draft, sent, signed, completed
  const [recipients, setRecipients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [signingProgress, setSigningProgress] = useState(0);
  const [auditTrail, setAuditTrail] = useState([]);
  const [mobileOptimized, setMobileOptimized] = useState(true);
  const [reminderSettings, setReminderSettings] = useState({
    enabled: true,
    frequency: 'daily',
    maxReminders: 5
  });
  
  const canvasRef = useRef(null);
  const documentViewerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState('');

  // Real estate document templates
  const documentTemplates = [
    {
      id: 'listing_agreement',
      name: 'Listing Agreement',
      category: 'Listing',
      description: 'Standard exclusive listing agreement',
      fields: ['seller_signature', 'agent_signature', 'date', 'property_address', 'listing_price', 'commission_rate'],
      requiredFields: ['seller_signature', 'property_address', 'listing_price'],
      estimatedTime: '5 minutes'
    },
    {
      id: 'purchase_contract',
      name: 'Purchase Contract',
      category: 'Sales',
      description: 'Standard purchase and sale agreement',
      fields: ['buyer_signature', 'seller_signature', 'agent_signature', 'purchase_price', 'settlement_date', 'conditions'],
      requiredFields: ['buyer_signature', 'seller_signature', 'purchase_price'],
      estimatedTime: '10 minutes'
    },
    {
      id: 'property_management',
      name: 'Property Management Agreement',
      category: 'Management',
      description: 'Property management service agreement',
      fields: ['owner_signature', 'manager_signature', 'property_details', 'management_fee', 'term_length'],
      requiredFields: ['owner_signature', 'property_details'],
      estimatedTime: '7 minutes'
    },
    {
      id: 'rental_application',
      name: 'Rental Application',
      category: 'Rental',
      description: 'Tenant rental application form',
      fields: ['applicant_signature', 'guarantor_signature', 'employment_details', 'income_verification'],
      requiredFields: ['applicant_signature', 'employment_details'],
      estimatedTime: '8 minutes'
    },
    {
      id: 'disclosure_statement',
      name: 'Property Disclosure Statement',
      category: 'Legal',
      description: 'Mandatory property condition disclosure',
      fields: ['seller_signature', 'agent_signature', 'property_conditions', 'known_defects'],
      requiredFields: ['seller_signature', 'property_conditions'],
      estimatedTime: '6 minutes'
    },
    {
      id: 'commission_agreement',
      name: 'Commission Split Agreement',
      category: 'Internal',
      description: 'Agent commission sharing agreement',
      fields: ['agent1_signature', 'agent2_signature', 'split_percentage', 'property_details'],
      requiredFields: ['agent1_signature', 'agent2_signature', 'split_percentage'],
      estimatedTime: '3 minutes'
    }
  ];

  useEffect(() => {
    loadDocuments();
    loadTemplates();
    initializeSignaturePad();
  }, []);

  // Load existing documents
  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/documents/signing');
      const data = await response.json();
      setDocuments(data.documents || getSampleDocuments());
    } catch (error) {
      console.error('Failed to load documents:', error);
      setDocuments(getSampleDocuments());
    }
  };

  // Load document templates
  const loadTemplates = () => {
    setTemplates(documentTemplates);
  };

  // Sample documents for demo
  const getSampleDocuments = () => {
    return [
      {
        id: 'doc_001',
        name: 'Listing Agreement - 123 Oak Street',
        type: 'listing_agreement',
        status: 'pending_signature',
        created: '2024-01-15T10:00:00Z',
        deadline: '2024-01-20T23:59:59Z',
        property: '123 Oak Street, Parramatta NSW 2150',
        client: {
          name: 'John Smith',
          email: 'john.smith@email.com',
          phone: '+61412345678'
        },
        agent: {
          name: 'Terence Houhoutas',
          email: 'terence@oakmontrealty.com',
          phone: '+61494102414'
        },
        signaturesRequired: 2,
        signaturesCompleted: 0,
        lastActivity: '2024-01-15T10:00:00Z',
        url: '/documents/listing_123_oak.pdf',
        signatureFields: [
          {
            id: 'field_001',
            type: 'signature',
            label: 'Seller Signature',
            required: true,
            position: { x: 100, y: 500, width: 200, height: 50 },
            assignedTo: 'client',
            signed: false
          },
          {
            id: 'field_002',
            type: 'signature',
            label: 'Agent Signature',
            required: true,
            position: { x: 350, y: 500, width: 200, height: 50 },
            assignedTo: 'agent',
            signed: false
          },
          {
            id: 'field_003',
            type: 'date',
            label: 'Date',
            required: true,
            position: { x: 100, y: 600, width: 100, height: 30 },
            assignedTo: 'auto',
            value: new Date().toLocaleDateString()
          }
        ]
      },
      {
        id: 'doc_002',
        name: 'Purchase Contract - 456 Pine Avenue',
        type: 'purchase_contract',
        status: 'completed',
        created: '2024-01-10T14:30:00Z',
        deadline: '2024-01-15T23:59:59Z',
        completedDate: '2024-01-14T16:45:00Z',
        property: '456 Pine Avenue, Westmead NSW 2145',
        client: {
          name: 'Sarah Johnson',
          email: 'sarah.j@email.com',
          phone: '+61423456789'
        },
        signaturesRequired: 3,
        signaturesCompleted: 3,
        lastActivity: '2024-01-14T16:45:00Z',
        url: '/documents/purchase_456_pine.pdf'
      }
    ];
  };

  // Initialize signature pad
  const initializeSignaturePad = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
    }
  };

  // Create new document from template
  const createFromTemplate = async (template) => {
    const newDocument = {
      id: `doc_${Date.now()}`,
      name: `${template.name} - New Document`,
      type: template.id,
      status: 'draft',
      created: new Date().toISOString(),
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      signaturesRequired: template.requiredFields.filter(f => f.includes('signature')).length,
      signaturesCompleted: 0,
      signatureFields: generateSignatureFields(template),
      estimatedTime: template.estimatedTime
    };
    
    setDocuments(prev => [...prev, newDocument]);
    setSelectedDocument(newDocument);
    setShowTemplates(false);
  };

  // Generate signature fields from template
  const generateSignatureFields = (template) => {
    const fields = [];
    let yPosition = 500;
    
    template.fields.forEach((field, index) => {
      if (field.includes('signature')) {
        fields.push({
          id: `field_${Date.now()}_${index}`,
          type: 'signature',
          label: field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          required: template.requiredFields.includes(field),
          position: { x: 100 + (index * 250), y: yPosition, width: 200, height: 50 },
          assignedTo: field.includes('agent') ? 'agent' : 'client',
          signed: false
        });
      } else if (field === 'date') {
        fields.push({
          id: `field_${Date.now()}_${index}`,
          type: 'date',
          label: 'Date',
          required: true,
          position: { x: 100, y: yPosition + 100, width: 100, height: 30 },
          assignedTo: 'auto',
          value: new Date().toLocaleDateString()
        });
      }
    });
    
    return fields;
  };

  // Send document for signing
  const sendForSigning = async (document) => {
    try {
      const response = await fetch('/api/documents/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          recipients: recipients,
          reminderSettings: reminderSettings,
          mobileOptimized: mobileOptimized
        })
      });
      
      if (response.ok) {
        // Update document status
        setDocuments(prev => prev.map(doc => 
          doc.id === document.id 
            ? { ...doc, status: 'sent', sentDate: new Date().toISOString() }
            : doc
        ));
        
        // Add to audit trail
        addToAuditTrail('document_sent', `Document sent to ${recipients.length} recipients`);
        
        // Send notifications
        await sendNotifications(document, recipients);
        
        alert('Document sent successfully!');
      }
    } catch (error) {
      console.error('Failed to send document:', error);
      alert('Failed to send document. Please try again.');
    }
  };

  // Send notifications to recipients
  const sendNotifications = async (document, recipients) => {
    const notifications = recipients.map(recipient => ({
      type: recipient.preferred_method || 'email',
      to: recipient.email || recipient.phone,
      template: 'signature_request',
      data: {
        documentName: document.name,
        senderName: 'Terence Houhoutas',
        deadline: document.deadline,
        signingUrl: `${window.location.origin}/sign/${document.id}?token=${generateSigningToken(recipient)}`,
        estimatedTime: document.estimatedTime || '5 minutes'
      }
    }));
    
    // Send via email and SMS
    await Promise.all(notifications.map(notification => 
      fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification)
      })
    ));
  };

  // Generate secure signing token
  const generateSigningToken = (recipient) => {
    return btoa(JSON.stringify({
      recipientId: recipient.id,
      email: recipient.email,
      timestamp: Date.now(),
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    }));
  };

  // Start signature drawing
  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  // Draw signature
  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  // Stop drawing
  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignatureData(canvasRef.current.toDataURL());
    }
  };

  // Clear signature
  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData('');
  };

  // Apply signature to field
  const applySignature = (fieldId) => {
    if (!signatureData) {
      alert('Please create a signature first');
      return;
    }
    
    setSignatureFields(prev => prev.map(field => 
      field.id === fieldId 
        ? { ...field, signed: true, signatureData: signatureData, signedAt: new Date().toISOString() }
        : field
    ));
    
    // Update document
    if (selectedDocument) {
      const updatedFields = selectedDocument.signatureFields.map(field => 
        field.id === fieldId 
          ? { ...field, signed: true, signatureData: signatureData, signedAt: new Date().toISOString() }
          : field
      );
      
      const completedSignatures = updatedFields.filter(f => f.signed).length;
      const progress = (completedSignatures / updatedFields.filter(f => f.required).length) * 100;
      
      setSelectedDocument(prev => ({
        ...prev,
        signatureFields: updatedFields,
        signaturesCompleted: completedSignatures,
        status: progress === 100 ? 'completed' : 'partial'
      }));
      
      setSigningProgress(progress);
      addToAuditTrail('signature_added', `Signature applied to ${field.label}`);
    }
    
    setSigningMode(false);
    clearSignature();
  };

  // Add entry to audit trail
  const addToAuditTrail = (action, description) => {
    setAuditTrail(prev => [...prev, {
      id: Date.now(),
      action: action,
      description: description,
      timestamp: new Date().toISOString(),
      user: 'Current User',
      ipAddress: '192.168.1.1' // In production, get real IP
    }]);
  };

  // Complete document signing
  const completeDocument = async () => {
    if (!selectedDocument) return;
    
    const requiredFields = selectedDocument.signatureFields.filter(f => f.required);
    const signedFields = requiredFields.filter(f => f.signed);
    
    if (signedFields.length !== requiredFields.length) {
      alert('Please complete all required signatures before finishing');
      return;
    }
    
    try {
      const response = await fetch('/api/documents/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedDocument.id,
          signatures: selectedDocument.signatureFields,
          auditTrail: auditTrail
        })
      });
      
      if (response.ok) {
        setSelectedDocument(prev => ({
          ...prev,
          status: 'completed',
          completedDate: new Date().toISOString()
        }));
        
        addToAuditTrail('document_completed', 'All signatures completed');
        
        // Send completion notifications
        await sendCompletionNotifications();
        
        alert('Document completed successfully!');
      }
    } catch (error) {
      console.error('Failed to complete document:', error);
      alert('Failed to complete document. Please try again.');
    }
  };

  // Send completion notifications
  const sendCompletionNotifications = async () => {
    // Notify all parties that document is complete
    // Implementation would send emails/SMS to all recipients
  };

  // Download completed document
  const downloadDocument = (document) => {
    // In production, this would generate a PDF with signatures
    const link = document.createElement('a');
    link.href = document.url || '/sample-document.pdf';
    link.download = `${document.name.replace(/\s+/g, '_')}.pdf`;
    link.click();
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'sent': return 'bg-blue-100 text-blue-700';
      case 'partial': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'expired': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return DocumentTextIcon;
      case 'sent': return ShareIcon;
      case 'partial': return ClockIcon;
      case 'completed': return CheckCircleIcon;
      case 'expired': return ExclamationTriangleIcon;
      default: return DocumentTextIcon;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-[#636B56] flex items-center gap-2">
            <DocumentTextIcon className="h-7 w-7" />
            Smart Signing
          </h1>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Simple • Fast • Secure</span>
            <LockClosedIcon className="h-4 w-4 text-green-600" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTemplates(true)}
            className="px-4 py-2 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365] flex items-center gap-2"
          >
            <SparklesIcon className="h-4 w-4" />
            New Document
          </button>
          
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <DocumentArrowUpIcon className="h-4 w-4" />
            Upload
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Document List Sidebar */}
        <div className="w-80 bg-white border-r flex flex-col">
          {/* Quick Stats */}
          <div className="p-4 border-b bg-gray-50">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-[#636B56]">
                  {documents.filter(d => d.status === 'pending_signature' || d.status === 'sent').length}
                </p>
                <p className="text-xs text-gray-600">Pending</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {documents.filter(d => d.status === 'completed').length}
                </p>
                <p className="text-xs text-gray-600">Completed</p>
              </div>
            </div>
          </div>

          {/* Document List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Recent Documents</h3>
              
              {documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No documents yet</p>
                  <p className="text-sm">Create your first document from a template</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map(document => {
                    const StatusIcon = getStatusIcon(document.status);
                    return (
                      <div
                        key={document.id}
                        onClick={() => setSelectedDocument(document)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                          selectedDocument?.id === document.id ? 'bg-blue-50 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {document.name}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {document.property || 'No property specified'}
                            </p>
                          </div>
                          <StatusIcon className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                        </div>
                        
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(document.status)}`}>
                            {document.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-600">
                            {document.signaturesCompleted}/{document.signaturesRequired} signed
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-600">
                          <p>{document.client?.name || 'No client'}</p>
                          <p>{new Date(document.created).toLocaleDateString()}</p>
                        </div>
                        
                        {document.deadline && document.status !== 'completed' && (
                          <div className="mt-2 flex items-center gap-1 text-xs">
                            <ClockIcon className="h-3 w-3 text-orange-500" />
                            <span className="text-orange-600">
                              Due {new Date(document.deadline).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {selectedDocument ? (
            <>
              {/* Document Header */}
              <div className="bg-white border-b p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedDocument.name}</h2>
                    <p className="text-sm text-gray-600 mt-1">{selectedDocument.property}</p>
                    
                    <div className="flex items-center gap-4 mt-3">
                      <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(selectedDocument.status)}`}>
                        {selectedDocument.status.replace('_', ' ')}
                      </span>
                      
                      {selectedDocument.estimatedTime && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <ClockIcon className="h-4 w-4" />
                          {selectedDocument.estimatedTime}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <UserIcon className="h-4 w-4" />
                        {selectedDocument.signaturesCompleted}/{selectedDocument.signaturesRequired} signatures
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {selectedDocument.status === 'draft' && (
                      <button
                        onClick={() => sendForSigning(selectedDocument)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <ShareIcon className="h-4 w-4" />
                        Send for Signing
                      </button>
                    )}
                    
                    {selectedDocument.status === 'completed' && (
                      <button
                        onClick={() => downloadDocument(selectedDocument)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <DownloadIcon className="h-4 w-4" />
                        Download
                      </button>
                    )}
                    
                    <button className="p-2 border rounded-lg hover:bg-gray-50">
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    
                    <button className="p-2 border rounded-lg hover:bg-gray-50">
                      <PrinterIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* Progress Bar */}
                {selectedDocument.status !== 'completed' && selectedDocument.status !== 'draft' && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Signing Progress</span>
                      <span>{Math.round(signingProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[#636B56] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${signingProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Document Content */}
              <div className="flex-1 flex">
                {/* Document Viewer */}
                <div className="flex-1 p-4">
                  <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
                    <div className="p-4 border-b">
                      <h3 className="font-medium text-gray-800">Document Preview</h3>
                    </div>
                    
                    <div className="flex-1 p-4 relative">
                      {/* Mock Document Display */}
                      <div className="w-full h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                        <DocumentTextIcon className="h-16 w-16 text-gray-400 mb-4" />
                        <p className="text-gray-600 text-center">
                          Document Preview
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          {selectedDocument.name}
                        </p>
                        
                        {/* Mock Signature Fields */}
                        {selectedDocument.signatureFields?.map(field => (
                          <div
                            key={field.id}
                            className={`absolute border-2 border-dashed ${
                              field.signed ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                            } rounded cursor-pointer`}
                            style={{
                              left: field.position.x,
                              top: field.position.y,
                              width: field.position.width,
                              height: field.position.height
                            }}
                            onClick={() => {
                              if (!field.signed && field.assignedTo !== 'auto') {
                                setSigningMode(true);
                                setCurrentSignature(field);
                              }
                            }}
                          >
                            <div className="w-full h-full flex items-center justify-center text-xs font-medium">
                              {field.signed ? (
                                <span className="text-green-700">✓ {field.label}</span>
                              ) : (
                                <span className="text-red-700">Click to sign: {field.label}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signature Panel */}
                <div className="w-80 border-l bg-white">
                  <div className="p-4 border-b">
                    <h3 className="font-medium text-gray-800">Signature Fields</h3>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {selectedDocument.signatureFields?.map(field => (
                      <div
                        key={field.id}
                        className={`p-3 border rounded-lg ${
                          field.signed ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{field.label}</span>
                          {field.signed ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-600" />
                          ) : field.required ? (
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                          ) : null}
                        </div>
                        
                        <div className="text-xs text-gray-600 mb-2">
                          Assigned to: {field.assignedTo}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </div>
                        
                        {field.signed ? (
                          <div className="text-xs text-green-600">
                            ✓ Signed on {new Date(field.signedAt).toLocaleString()}
                          </div>
                        ) : field.assignedTo !== 'auto' ? (
                          <button
                            onClick={() => {
                              setSigningMode(true);
                              setCurrentSignature(field);
                            }}
                            className="w-full px-3 py-2 bg-[#636B56] text-white rounded text-sm hover:bg-[#7a8365]"
                          >
                            Sign Now
                          </button>
                        ) : (
                          <div className="text-xs text-gray-500">Auto-filled: {field.value}</div>
                        )}
                      </div>
                    ))}
                    
                    {selectedDocument.signatureFields?.every(f => f.signed || !f.required) && (
                      <button
                        onClick={completeDocument}
                        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                      >
                        Complete Document
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white">
              <div className="text-center">
                <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Document Selected</h3>
                <p className="text-gray-600 mb-4">Choose a document from the list or create a new one</p>
                <button
                  onClick={() => setShowTemplates(true)}
                  className="px-6 py-3 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365]"
                >
                  Create New Document
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#636B56]">Document Templates</h2>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {documentTemplates.map(template => (
                <div
                  key={template.id}
                  onClick={() => createFromTemplate(template)}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {template.category}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{template.fields.length} fields</span>
                    <span>{template.estimatedTime}</span>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-1">
                    {template.requiredFields.slice(0, 3).map(field => (
                      <span key={field} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {field.replace('_', ' ')}
                      </span>
                    ))}
                    {template.requiredFields.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        +{template.requiredFields.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {signingMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Sign: {currentSignature?.label}
              </h3>
              <button
                onClick={() => setSigningMode(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="border rounded-lg p-4 mb-4">
              <canvas
                ref={canvasRef}
                width="400"
                height="200"
                className="border rounded cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={clearSignature}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Clear
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setSigningMode(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => applySignature(currentSignature.id)}
                  className="px-4 py-2 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365]"
                >
                  Apply Signature
                </button>
              </div>
            </div>
            
            {/* Mobile Instructions */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 text-sm">
                <DevicePhoneMobileIcon className="h-4 w-4" />
                <span>On mobile: Use your finger to draw your signature</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}