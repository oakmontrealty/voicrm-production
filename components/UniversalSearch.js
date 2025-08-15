import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function UniversalSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    // Close search results when clicking outside
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);
    
    try {
      // Search across multiple endpoints - handle errors gracefully
      const fetchWithFallback = async (url) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          return await res.json();
        } catch (e) {
          console.log('Search endpoint error:', e);
          return null;
        }
      };

      const [contacts, activities, calls] = await Promise.all([
        fetchWithFallback(`/api/contacts?search=${encodeURIComponent(query)}`),
        fetchWithFallback(`/api/activities/search?q=${encodeURIComponent(query)}`),
        fetchWithFallback(`/api/call-logs?search=${encodeURIComponent(query)}`)
      ]);

      // Combine and format results - EXACT MATCHING ONLY
      const results = [];
      const queryLower = query.toLowerCase();

      // Add contacts - EXACT MATCH ONLY
      if (contacts && Array.isArray(contacts)) {
        contacts.slice(0, 5).forEach(contact => {
          // Only include if name, phone, email, or company contains the exact search term
          const nameMatch = contact.name && contact.name.toLowerCase().includes(queryLower);
          const phoneMatch = contact.phone_number && contact.phone_number.includes(query);
          const emailMatch = contact.email && contact.email.toLowerCase().includes(queryLower);
          const companyMatch = contact.company && contact.company.toLowerCase().includes(queryLower);
          
          if (nameMatch || phoneMatch || emailMatch || companyMatch) {
            results.push({
              type: 'contact',
              id: contact.id,
              title: contact.name,
              subtitle: contact.phone_number || contact.email || contact.company,
              icon: '👤',
              url: `/contacts?id=${contact.id}`,
              action: () => {
                window.location.href = `/contacts?id=${contact.id}`;
              }
            });
          }
        });
      }

      // Add activities - EXACT MATCH ONLY
      if (activities?.callbacks) {
        activities.callbacks.slice(0, 3).forEach(callback => {
          // Only include if name contains the exact search term
          if (callback.name && callback.name.toLowerCase().includes(queryLower)) {
            results.push({
              type: 'callback',
              id: callback.id,
              title: `Callback: ${callback.name}`,
              subtitle: new Date(callback.scheduled_date).toLocaleDateString(),
              icon: '📅',
              url: `/calendar`,
              action: () => {
                window.location.href = `/calendar`;
              }
            });
          }
        });
      }

      // Add call logs - EXACT MATCH ONLY
      if (calls?.logs) {
        calls.logs.slice(0, 3).forEach(call => {
          // Only include if phone number contains the exact search term
          if (call.phone_number && call.phone_number.includes(query)) {
            results.push({
              type: 'call',
              id: call.id,
              title: `Call to ${call.phone_number}`,
              subtitle: `Duration: ${call.duration}s - ${new Date(call.timestamp).toLocaleString()}`,
              icon: '📞',
              url: `/calls`,
              action: () => {
                window.location.href = `/calls`;
              }
            });
          }
        });
      }

      // Add quick actions - EXACT WORD MATCH ONLY
      if (queryLower === 'call' || queryLower === 'make call' || queryLower === 'phone') {
        results.unshift({
          type: 'action',
          id: 'make-call',
          title: 'Make a Call',
          subtitle: 'Open the browser phone',
          icon: '📱',
          url: '/twilio-browser-phone',
          action: () => {
            window.location.href = '/twilio-browser-phone';
          }
        });
      }

      if (queryLower === 'calendar' || queryLower === 'callbacks' || queryLower === 'callback') {
        results.unshift({
          type: 'action',
          id: 'view-calendar',
          title: 'View Calendar',
          subtitle: 'See scheduled callbacks',
          icon: '📅',
          url: '/calendar',
          action: () => {
            window.location.href = '/calendar';
          }
        });
      }

      if (queryLower === 'contact' || queryLower === 'add contact' || queryLower === 'new contact') {
        results.unshift({
          type: 'action',
          id: 'add-contact',
          title: 'Add New Contact',
          subtitle: 'Create a new contact',
          icon: '➕',
          url: '/contacts',
          action: () => {
            window.location.href = '/contacts?action=add';
          }
        });
      }

      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Debounce search
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      // Navigate to first result
      searchResults[0].action();
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setSearchTerm('');
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchTerm) {
              setShowResults(true);
              performSearch(searchTerm);
            }
          }}
          placeholder="Search contacts, calls, activities, or type a command..."
          className="w-full px-4 py-2 pl-10 pr-4 border-2 rounded-lg focus:ring-2 focus:outline-none bg-white shadow-sm"
          style={{ 
            borderColor: '#B28354',
            fontFamily: "'Forum', serif",
            fontSize: '14px',
            color: '#636B56'  // Green font color for input text
          }}
        />
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
        
        {isSearching && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2" 
                 style={{ borderColor: '#636B56' }}></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border" 
             style={{ borderColor: '#B28354', maxHeight: '400px', overflowY: 'auto' }}>
          {searchResults.map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => {
                result.action();
                setShowResults(false);
                setSearchTerm('');
              }}
              className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b last:border-b-0 text-left"
              style={{ borderColor: '#F8F2E7' }}
            >
              <span className="text-2xl">{result.icon}</span>
              <div className="flex-1">
                <div className="font-semibold" style={{ color: '#636B56' }}>
                  {result.title}
                </div>
                {result.subtitle && (
                  <div className="text-sm text-gray-600">
                    {result.subtitle}
                  </div>
                )}
              </div>
              {result.type === 'action' && (
                <span className="text-xs px-2 py-1 rounded" 
                      style={{ backgroundColor: '#F8F2E7', color: '#864936' }}>
                  Quick Action
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {showResults && searchTerm && searchResults.length === 0 && !isSearching && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border p-4 text-center"
             style={{ borderColor: '#B28354' }}>
          <p className="text-gray-500">No results found for "{searchTerm}"</p>
          <p className="text-sm text-gray-400 mt-1">Try searching for contacts, phone numbers, or actions</p>
        </div>
      )}

      {/* Search Tips */}
      {showResults && !searchTerm && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border p-4"
             style={{ borderColor: '#B28354' }}>
          <p className="font-semibold mb-2" style={{ color: '#636B56' }}>Quick Tips:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Search by name, phone, or email</li>
            <li>• Type "call" to make a call</li>
            <li>• Type "calendar" to view callbacks</li>
            <li>• Type "add contact" to create new</li>
            <li>• Press Enter to select first result</li>
          </ul>
        </div>
      )}
    </div>
  );
}