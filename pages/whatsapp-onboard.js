import { useState } from 'react';
import Layout from '../components/Layout';
import { 
  CheckCircleIcon,
  ClipboardDocumentIcon,
  QrCodeIcon,
  ShareIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

export default function WhatsAppOnboard() {
  const [copied, setCopied] = useState(false);
  const whatsappNumber = '+61482080888';
  const optInMessage = 'Hi! Please add me to property updates';
  const whatsappLink = `https://wa.me/61482080888?text=${encodeURIComponent(optInMessage)}`;
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendInviteEmail = () => {
    const subject = 'Join Our Property WhatsApp Updates';
    const body = `Hi,\n\nTo receive WhatsApp updates about your property sale, please click this link:\n${whatsappLink}\n\nOr send "${optInMessage}" to ${whatsappNumber} on WhatsApp.\n\nBest regards,\nYour Real Estate Team`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const sendInviteSMS = () => {
    // This would integrate with your SMS API
    alert('SMS invite feature - would send: Join property updates on WhatsApp: ' + whatsappLink);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#25D366]">WhatsApp Client Onboarding</h1>
          <p className="text-gray-600 mt-2">Get your clients connected to WhatsApp property updates</p>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">How WhatsApp Property Groups Work</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-[#636B56] mb-3">For You (Agent):</h3>
              <ol className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-[#25D366] font-bold">1.</span>
                  Create a property group in VoiCRM
                </li>
                <li className="flex gap-2">
                  <span className="text-[#25D366] font-bold">2.</span>
                  Add all stakeholders (owners, solicitors, etc.)
                </li>
                <li className="flex gap-2">
                  <span className="text-[#25D366] font-bold">3.</span>
                  Send updates that broadcast to everyone
                </li>
                <li className="flex gap-2">
                  <span className="text-[#25D366] font-bold">4.</span>
                  Track all communications in one place
                </li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-semibold text-[#636B56] mb-3">For Clients:</h3>
              <ol className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-[#25D366] font-bold">1.</span>
                  They message your WhatsApp once to opt-in
                </li>
                <li className="flex gap-2">
                  <span className="text-[#25D366] font-bold">2.</span>
                  Receive all property updates instantly
                </li>
                <li className="flex gap-2">
                  <span className="text-[#25D366] font-bold">3.</span>
                  Can reply to ask questions anytime
                </li>
                <li className="flex gap-2">
                  <span className="text-[#25D366] font-bold">4.</span>
                  Stay informed throughout the sale process
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Quick Invite Methods */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Invite Methods</h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            {/* WhatsApp Link */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-[#25D366] rounded-lg flex items-center justify-center">
                  <ShareIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold">Direct Link</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Share this link with clients to join instantly
              </p>
              <div className="bg-gray-50 p-2 rounded text-xs break-all mb-2">
                {whatsappLink}
              </div>
              <button
                onClick={() => copyToClipboard(whatsappLink)}
                className="w-full bg-[#25D366] text-white px-3 py-2 rounded-lg text-sm hover:bg-[#22c55e] flex items-center justify-center gap-2"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            {/* Email Invite */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-[#636B56] rounded-lg flex items-center justify-center">
                  <ShareIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold">Email Invite</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Send a professional email invitation
              </p>
              <button
                onClick={sendInviteEmail}
                className="w-full bg-[#636B56] text-white px-3 py-2 rounded-lg text-sm hover:bg-[#7a8365]"
              >
                Send Email Invite
              </button>
            </div>

            {/* SMS Invite */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <PhoneIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold">SMS Invite</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Text them the join link directly
              </p>
              <button
                onClick={sendInviteSMS}
                className="w-full bg-blue-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-600"
              >
                Send SMS Invite
              </button>
            </div>
          </div>
        </div>

        {/* Template Messages */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Copy & Paste Templates</h2>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-2">Initial Property Listing Message</h3>
              <div className="bg-gray-50 p-3 rounded text-sm">
                Hi [Name], I'm excited to be handling the sale of your property at [Address]. 
                To keep you updated throughout the process via WhatsApp, please click this link: {whatsappLink}
              </div>
              <button
                onClick={() => copyToClipboard(`Hi [Name], I'm excited to be handling the sale of your property at [Address]. To keep you updated throughout the process via WhatsApp, please click this link: ${whatsappLink}`)}
                className="mt-2 text-[#25D366] text-sm hover:underline"
              >
                Copy Template
              </button>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-2">For Solicitors/Conveyancers</h3>
              <div className="bg-gray-50 p-3 rounded text-sm">
                Hi, I'm managing the sale of [Address] for [Client Name]. 
                Please join our WhatsApp updates for quick communication during the sale: {whatsappLink}
              </div>
              <button
                onClick={() => copyToClipboard(`Hi, I'm managing the sale of [Address] for [Client Name]. Please join our WhatsApp updates for quick communication during the sale: ${whatsappLink}`)}
                className="mt-2 text-[#25D366] text-sm hover:underline"
              >
                Copy Template
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Important Notes:</h3>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            <li>Clients must message you first (WhatsApp requirement)</li>
            <li>Once they opt-in, you can message them anytime for 24 hours</li>
            <li>After 24 hours of no response, use approved template messages</li>
            <li>Each "group" member receives individual messages (appears like a group to you)</li>
            <li>All messages are tracked in your VoiCRM property group</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}