import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { EnvelopeIcon, PaperAirplaneIcon, StarIcon, TrashIcon, PaperClipIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

export default function Email() {
  const [emails, setEmails] = useState([
    {
      id: 1,
      from: 'John Smith',
      email: 'john.smith@email.com',
      subject: 'Property Inquiry - 123 Main St',
      preview: 'Hi, I am interested in viewing the property at 123 Main St. Is it still available?',
      date: '10:30 AM',
      read: false,
      starred: true,
      category: 'inquiry'
    },
    {
      id: 2,
      from: 'Sarah Wilson',
      email: 'sarah.wilson@email.com',
      subject: 'Re: Open House Schedule',
      preview: 'Thank you for the information. I will attend the open house on Saturday.',
      date: '9:15 AM',
      read: true,
      starred: false,
      category: 'response'
    },
    {
      id: 3,
      from: 'Michael Chen',
      email: 'michael.chen@email.com',
      subject: 'Contract Documents - 456 Oak Ave',
      preview: 'Please find attached the signed contract documents for review.',
      date: 'Yesterday',
      read: true,
      starred: false,
      hasAttachment: true,
      category: 'contract'
    },
    {
      id: 4,
      from: 'Emma Thompson',
      email: 'emma.t@email.com',
      subject: 'Market Analysis Request',
      preview: 'Could you provide a market analysis for properties in the Parramatta area?',
      date: 'Yesterday',
      read: false,
      starred: false,
      category: 'inquiry'
    }
  ]);

  const [selectedEmail, setSelectedEmail] = useState(null);
  const [composeMode, setComposeMode] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [composeData, setComposeData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    attachments: []
  });

  const folders = [
    { id: 'inbox', name: 'Inbox', count: emails.filter(e => !e.read).length, icon: '📥' },
    { id: 'sent', name: 'Sent', count: 0, icon: '📤' },
    { id: 'drafts', name: 'Drafts', count: 3, icon: '📝' },
    { id: 'starred', name: 'Starred', count: emails.filter(e => e.starred).length, icon: '⭐' },
    { id: 'trash', name: 'Trash', count: 0, icon: '🗑️' }
  ];

  const categories = [
    { id: 'inquiry', name: 'Property Inquiries', color: 'bg-blue-100 text-blue-800' },
    { id: 'contract', name: 'Contracts', color: 'bg-purple-100 text-purple-800' },
    { id: 'response', name: 'Responses', color: 'bg-green-100 text-green-800' },
    { id: 'marketing', name: 'Marketing', color: 'bg-yellow-100 text-yellow-800' }
  ];

  const emailTemplates = [
    { id: 1, name: 'Property Information', subject: 'Property Details - [ADDRESS]' },
    { id: 2, name: 'Viewing Confirmation', subject: 'Viewing Appointment Confirmed' },
    { id: 3, name: 'Contract Follow-up', subject: 'Contract Update - [PROPERTY]' },
    { id: 4, name: 'Market Report', subject: 'Monthly Market Report - [MONTH]' }
  ];

  const toggleStar = (emailId) => {
    setEmails(emails.map(email => 
      email.id === emailId ? { ...email, starred: !email.starred } : email
    ));
  };

  const markAsRead = (emailId) => {
    setEmails(emails.map(email => 
      email.id === emailId ? { ...email, read: true } : email
    ));
  };

  const deleteEmail = (emailId) => {
    setEmails(emails.filter(email => email.id !== emailId));
    setSelectedEmail(null);
  };

  const sendEmail = () => {
    // In production, this would send via email API
    alert('Email sent successfully!');
    setComposeMode(false);
    setComposeData({
      to: '',
      cc: '',
      bcc: '',
      subject: '',
      body: '',
      attachments: []
    });
  };

  const syncGmail = async () => {
    setIsSyncing(true);
    try {
      // Check if we need to authenticate first
      const authRes = await fetch('/api/gmail/auth');
      const authData = await authRes.json();
      
      if (!gmailConnected) {
        // Open Gmail auth in new window
        window.open(authData.authUrl, '_blank', 'width=500,height=600');
        setSyncStatus('Please authenticate with Gmail in the popup window');
        setIsSyncing(false);
        return;
      }
      
      // Use demo sync endpoint for now
      const syncRes = await fetch('/api/gmail/sync-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const syncData = await syncRes.json();
      
      if (syncData.success) {
        // Add Gmail emails to our email list
        const gmailEmails = syncData.emails.map(email => ({
          id: email.id,
          from: email.contactName || email.fromEmail.split('@')[0],
          email: email.fromEmail,
          subject: email.subject,
          preview: email.snippet,
          date: new Date(email.date).toLocaleString(),
          read: !email.isUnread,
          starred: email.isImportant,
          category: email.contactId ? 'contact' : 'general',
          hasAttachment: false
        }));
        
        setEmails([...gmailEmails, ...emails]);
        setSyncStatus(`Synced ${syncData.emails.length} emails from Gmail`);
        setGmailConnected(true);
      }
    } catch (error) {
      console.error('Gmail sync error:', error);
      setSyncStatus('Failed to sync Gmail. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredEmails = emails.filter(email => {
    if (selectedFolder === 'starred') return email.starred;
    if (selectedFolder === 'trash') return false; // Would show deleted emails
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return email.subject.toLowerCase().includes(query) ||
             email.from.toLowerCase().includes(query) ||
             email.preview.toLowerCase().includes(query);
    }
    return true;
  });

  return (
    <Layout>
      <div className="h-[calc(100vh-200px)] flex gap-4">
        {/* Sidebar */}
        <div className="w-64 bg-white rounded-xl shadow-sm p-4">
          <button
            onClick={() => setComposeMode(true)}
            className="w-full bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#7a8365] transition-colors mb-2 flex items-center justify-center gap-2"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
            Compose
          </button>
          
          {/* Gmail Sync Button */}
          <button
            onClick={() => syncGmail()}
            disabled={isSyncing}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mb-4 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSyncing ? (
              <>
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sync Gmail
              </>
            )}
          </button>
          
          {syncStatus && (
            <div className="mb-4 p-2 bg-green-100 text-green-700 rounded-lg text-sm">
              {syncStatus}
            </div>
          )}

          {/* Folders */}
          <div className="space-y-1 mb-6">
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                  selectedFolder === folder.id 
                    ? 'bg-[#636B56]/10 text-[#636B56]' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{folder.icon}</span>
                  <span>{folder.name}</span>
                </span>
                {folder.count > 0 && (
                  <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                    {folder.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Categories */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Categories</h3>
            <div className="space-y-1">
              {categories.map(category => (
                <div key={category.id} className="flex items-center gap-2 px-3 py-1">
                  <div className={`w-2 h-2 rounded-full ${category.color.split(' ')[0]}`} />
                  <span className="text-sm">{category.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Email List */}
        <div className="w-96 bg-white rounded-xl shadow-sm">
          {/* Search Bar */}
          <div className="p-4 border-b">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                style={{ color: '#636B56' }}  // Green font color for search input
              />
            </div>
          </div>

          {/* Email Items */}
          <div className="overflow-y-auto h-[calc(100%-80px)]">
            {filteredEmails.map(email => (
              <div
                key={email.id}
                onClick={() => {
                  setSelectedEmail(email);
                  markAsRead(email.id);
                }}
                className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                  !email.read ? 'bg-blue-50' : ''
                } ${selectedEmail?.id === email.id ? 'border-l-4 border-[#636B56]' : ''}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className={`font-medium ${!email.read ? 'font-bold' : ''}`}>
                    {email.from}
                  </h3>
                  <span className="text-xs text-gray-500">{email.date}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStar(email.id);
                    }}
                    className="text-yellow-500"
                  >
                    {email.starred ? <StarIconSolid className="h-4 w-4" /> : <StarIcon className="h-4 w-4" />}
                  </button>
                  <p className={`text-sm ${!email.read ? 'font-semibold' : ''}`}>
                    {email.subject}
                  </p>
                  {email.hasAttachment && <PaperClipIcon className="h-4 w-4 text-gray-400" />}
                </div>
                <p className="text-sm text-gray-600 truncate">{email.preview}</p>
                {email.category && (
                  <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs ${
                    categories.find(c => c.id === email.category)?.color || ''
                  }`}>
                    {categories.find(c => c.id === email.category)?.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Email Content / Compose */}
        <div className="flex-1 bg-white rounded-xl shadow-sm">
          {composeMode ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">New Message</h2>
                <button
                  onClick={() => setComposeMode(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div>
                    <input
                      type="email"
                      placeholder="To"
                      value={composeData.to}
                      onChange={(e) => setComposeData({...composeData, to: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Cc"
                      value={composeData.cc}
                      onChange={(e) => setComposeData({...composeData, cc: e.target.value})}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                    />
                    <input
                      type="email"
                      placeholder="Bcc"
                      value={composeData.bcc}
                      onChange={(e) => setComposeData({...composeData, bcc: e.target.value})}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <input
                      type="text"
                      placeholder="Subject"
                      value={composeData.subject}
                      onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <textarea
                      placeholder="Write your message..."
                      value={composeData.body}
                      onChange={(e) => setComposeData({...composeData, body: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent h-64 resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 text-gray-600 hover:text-[#636B56]">
                      <PaperClipIcon className="h-5 w-5" />
                      Attach Files
                    </button>
                    <select className="px-3 py-1 border border-gray-300 rounded-lg text-sm">
                      <option value="">Use Template...</option>
                      {emailTemplates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t flex justify-between">
                <div className="flex gap-2">
                  <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    Save Draft
                  </button>
                  <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    Schedule
                  </button>
                </div>
                <button
                  onClick={sendEmail}
                  className="px-6 py-2 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365] transition-colors flex items-center gap-2"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                  Send
                </button>
              </div>
            </div>
          ) : selectedEmail ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedEmail.subject}</h2>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>From: <strong>{selectedEmail.from}</strong> ({selectedEmail.email})</span>
                      <span>{selectedEmail.date}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleStar(selectedEmail.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      {selectedEmail.starred ? <StarIconSolid className="h-5 w-5 text-yellow-500" /> : <StarIcon className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={() => deleteEmail(selectedEmail.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="prose max-w-none">
                  <p>{selectedEmail.preview}</p>
                  <br />
                  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                  <br />
                  <p>Best regards,<br />{selectedEmail.from}</p>
                </div>
                
                {selectedEmail.hasAttachment && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2">Attachments</h3>
                    <div className="flex items-center gap-2">
                      <PaperClipIcon className="h-5 w-5 text-gray-500" />
                      <span className="text-sm">contract_documents.pdf (2.3 MB)</span>
                      <button className="text-[#636B56] hover:underline text-sm">Download</button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365] transition-colors">
                    Reply
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Reply All
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Forward
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <EnvelopeIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Select an email to read</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}