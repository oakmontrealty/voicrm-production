import { useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, PhoneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import ContactModal from './ContactModal';
import BrowserPhone from '../voice/BrowserPhone';
import SMSInterface from '../sms/SMSInterface';

export default function ContactList({ contacts, onUpdate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [callingContact, setCallingContact] = useState(null);
  const [messagingContact, setMessagingContact] = useState(null);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  );

  const handleEdit = (contact) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedContact(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedContact(null);
  };

  const handleModalSave = (contactData) => {
    onUpdate(contactData);
    handleModalClose();
  };

  const handleCall = (e, contact) => {
    e.stopPropagation(); // Prevent opening edit modal
    setCallingContact(contact);
  };

  const handleCallEnd = (duration) => {
    console.log(`Call ended. Duration: ${duration} seconds`);
    setCallingContact(null);
  };

  const handleMessage = (e, contact) => {
    e.stopPropagation();
    setMessagingContact(contact);
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4">
          <button
            onClick={handleAdd}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Contact
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredContacts.map((contact) => (
            <li key={contact.id}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer" onClick={() => handleEdit(contact)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                        <span className="text-white font-medium">
                          {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                      <div className="text-sm text-gray-500">{contact.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col items-end">
                      <div className="text-sm text-gray-900">{contact.phone}</div>
                      <div className="text-sm text-gray-500">{contact.status}</div>
                    </div>
                    <button
                      onClick={(e) => handleCall(e, contact)}
                      className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                      title="Call contact"
                    >
                      <PhoneIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleMessage(e, contact)}
                      className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
                      title="Send SMS"
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {isModalOpen && (
        <ContactModal
          contact={selectedContact}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}

      {callingContact && (
        <BrowserPhone
          contact={callingContact}
          onCallEnd={handleCallEnd}
        />
      )}

      {messagingContact && (
        <SMSInterface
          contact={messagingContact}
          isOpen={true}
          onClose={() => setMessagingContact(null)}
        />
      )}
    </div>
  );
}