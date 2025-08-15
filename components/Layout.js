import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import UniversalSearch from './UniversalSearch';
import NewsTicker from './NewsTicker';
import { 
  HomeIcon, 
  PhoneIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  SparklesIcon,
  PuzzlePieceIcon,
  UsersIcon,
  DevicePhoneMobileIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BoltIcon,
  ChartPieIcon,
  BuildingOffice2Icon,
  MicrophoneIcon,
  RocketLaunchIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function Layout({ children }) {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [sidebarLocked, setSidebarLocked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  // Global search handler - searches both navigation and contacts
  const handleGlobalSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = [];
    const searchTerm = query.toLowerCase();

    // Search navigation items
    navigationSections.forEach(section => {
      if (section.single) {
        if (section.name.toLowerCase().includes(searchTerm)) {
          results.push({ name: section.name, href: section.href });
        }
      } else if (section.subItems) {
        section.subItems.forEach(item => {
          if (item.name.toLowerCase().includes(searchTerm) || 
              item.subheading.toLowerCase().includes(searchTerm)) {
            results.push({ 
              name: item.name, 
              href: item.href, 
              subheading: item.subheading 
            });
          }
        });
      }
    });

    // Mock contact search (in production, this would query the database)
    const mockContacts = [
      { name: 'John Smith', href: '/contacts?search=John%20Smith' },
      { name: 'Sarah Wilson', href: '/contacts?search=Sarah%20Wilson' },
      { name: 'Michael Chen', href: '/contacts?search=Michael%20Chen' },
      { name: 'Emma Thompson', href: '/contacts?search=Emma%20Thompson' },
      { name: 'David Brown', href: '/contacts?search=David%20Brown' },
    ];

    mockContacts.forEach(contact => {
      if (contact.name.toLowerCase().includes(searchTerm)) {
        results.push({
          name: contact.name,
          href: contact.href,
          subheading: 'Contact'
        });
      }
    });

    // Mock property search
    const mockProperties = [
      { name: '123 Main St, Parramatta', href: '/properties?search=123%20Main' },
      { name: '456 Church St, Westmead', href: '/properties?search=456%20Church' },
      { name: '789 George St, Liverpool', href: '/properties?search=789%20George' },
    ];

    mockProperties.forEach(property => {
      if (property.name.toLowerCase().includes(searchTerm)) {
        results.push({
          name: property.name,
          href: property.href,
          subheading: 'Property'
        });
      }
    });

    setSearchResults(results.slice(0, 10)); // Limit to 10 results
  };

  const navigationSections = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: HomeIcon,
      single: true 
    },
    { 
      name: 'Calendar', 
      href: '/calendar', 
      icon: CalendarIcon,
      single: true 
    },
    { 
      name: 'Tasks', 
      href: '/tasks', 
      icon: ClipboardDocumentListIcon,
      single: true 
    },
    {
      name: 'Communications',
      icon: ChatBubbleLeftRightIcon,
      subItems: [
        { name: 'Text Messenger', href: '/messages', subheading: 'SMS & MMS with Media' },
        { name: 'Mass Texter', href: '/messages?type=mass', subheading: 'Bulk Campaigns' },
        { name: 'Email', href: '/email', subheading: 'Email Center' },
        { name: 'Templates', href: '/templates', subheading: 'Message Templates' },
      ]
    },
    {
      name: 'Phone System',
      icon: PhoneIcon,
      subItems: [
        { name: 'Call Logs', href: '/calls', subheading: 'Call History' },
        { name: 'Speed Dialer', href: '/powerdialer', subheading: 'Quick Dial' },
        { name: 'Browser Phone', href: '/twilio-browser-phone', subheading: 'Browser Calling' },
        { name: 'Phone Numbers', href: '/phone-numbers', subheading: 'Number Carousel' },
        { name: 'AI Voice Agent', href: '/ai-voice-agent', subheading: 'Virtual Assistant' },
        { name: 'Whisperer', href: '/whisperer', subheading: 'Live Call AI' },
      ]
    },
    {
      name: 'CRM',
      icon: UserGroupIcon,
      subItems: [
        { name: 'Contacts', href: '/contacts', subheading: 'Contact Management' },
        { name: 'Leads', href: '/leads', subheading: 'Lead Pipeline' },
        { name: 'Teams', href: '/teams', subheading: 'Team Management' },
        { name: 'Appointments', href: '/appointments', subheading: 'Booking System' },
      ]
    },
    {
      name: 'Real Estate',
      icon: BuildingOfficeIcon,
      subItems: [
        { name: 'Properties', href: '/properties', subheading: 'Listings' },
        { name: 'Mapping', href: '/mapping', subheading: 'Property Maps' },
        { name: 'Inspections', href: '/inspections', subheading: 'Property Inspections' },
        { name: 'CMA Studio', href: '/cma-studio', subheading: 'Market Analysis' },
        { name: 'Depositions', href: '/depositions', subheading: 'Legal Documents' },
        { name: 'Contracts', href: '/contracts', subheading: 'Documents' },
        { name: 'Compliance', href: '/compliance', subheading: 'Regulations' },
      ]
    },
    {
      name: 'Marketing',
      icon: RocketLaunchIcon,
      subItems: [
        { name: 'Campaigns', href: '/campaigns', subheading: 'Marketing Campaigns' },
        { name: 'Prospecting', href: '/prospecting', subheading: 'Lead Generation' },
        { name: 'Digital Business Cards', href: '/digital-cards', subheading: 'Virtual Cards' },
        { name: 'Workflows', href: '/workflows', subheading: 'Automation' },
        { name: 'Emails', href: '/email-campaigns', subheading: 'Email Marketing' },
        { name: 'Property Campaigns', href: '/property-campaigns', subheading: 'Listing Promotion' },
      ]
    },
    {
      name: 'Analytics',
      icon: ChartBarIcon,
      subItems: [
        { name: 'Overview', href: '/analytics', subheading: 'Analytics Dashboard' },
        { name: 'Workplace', href: '/workplace', subheading: 'Team Analytics' },
        { name: 'Reports', href: '/reports', subheading: 'Custom Reports' },
      ]
    },
    {
      name: 'Integrations',
      icon: PuzzlePieceIcon,
      href: '/integrations',
      single: true
    },
    {
      name: 'Settings',
      icon: Cog6ToothIcon,
      subItems: [
        { name: 'Personal Preferences', href: '/settings/personal', subheading: 'Your Settings' },
        { name: 'Company Settings', href: '/settings/company', subheading: 'Organization' },
        { name: 'Profile', href: '/settings/profile', subheading: 'Account Info' },
        { name: 'Security', href: '/settings/security', subheading: '2FA & Access' },
        { name: 'User Management', href: '/settings/users', subheading: 'Team Profiles' },
      ]
    },
  ];

  // Always start collapsed, expand on hover or when locked open
  const isExpanded = mounted ? (sidebarLocked || sidebarHovered) : false;

  return (
    <div className="min-h-screen bg-[#F8F2E7]">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#636B56]/5 via-transparent to-[#B28354]/5 pointer-events-none" />
      
      {/* Modern Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-full ${isExpanded ? 'w-72' : 'w-16'} bg-[#F8F2E7] border-r border-[#B28354]/20 shadow-2xl z-40 transition-all duration-500 overflow-hidden`}
        style={{ fontFamily: 'Avenir, sans-serif' }}
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
      >
        <div className={`${isExpanded ? 'p-6' : 'p-2'}`}>
          {/* Logo and Toggle */}
          <div className={`mb-10 ${isExpanded ? '' : 'text-center'}`}>
            <div className="flex items-center justify-between">
              {isExpanded ? (
                <div className="flex-1">
                  <h1 className="text-2xl font-black text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
                    VoiCRM
                  </h1>
                  <p className="text-xs text-[#864936] mt-1 font-medium italic" style={{ fontFamily: 'Avenir, sans-serif' }}>
                    Every Second Counts
                  </p>
                </div>
              ) : (
                <div className="text-2xl font-black text-[#636B56] flex-1 text-center" style={{ fontFamily: 'Forum, serif' }}>
                  V
                </div>
              )}
              <button
                onClick={() => setSidebarLocked(!sidebarLocked)}
                className={`p-1.5 rounded-lg hover:bg-[#636B56]/10 transition-colors ${isExpanded ? '' : 'mx-auto'}`}
                title={sidebarLocked ? 'Unlock sidebar' : 'Lock sidebar open'}
              >
                {sidebarLocked ? (
                  <XMarkIcon className="w-5 h-5 text-[#636B56]" />
                ) : (
                  <Bars3Icon className="w-5 h-5 text-[#636B56]" />
                )}
              </button>
            </div>
          </div>

          {/* Search Bar - Only show when expanded */}
          {isExpanded && (
            <div className="relative mb-8">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#7a7a7a]" />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-[#B28354]/20 rounded-xl text-sm text-[#1a1a1a] placeholder-[#7a7a7a] focus:outline-none focus:ring-2 focus:ring-[#636B56]/20 focus:border-[#636B56]/50 transition-all"
                style={{ fontFamily: 'Avenir, sans-serif' }}
                onChange={(e) => handleGlobalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchResults.length > 0) {
                    router.push(searchResults[0].href);
                  }
                }}
              />
              {searchQuery && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white border border-[#B28354]/20 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <Link
                      key={index}
                      href={result.href}
                      className="block px-4 py-2 hover:bg-[#636B56]/10 text-sm transition-colors"
                      onClick={() => setSearchQuery('')}
                    >
                      <div className="font-medium">{result.name}</div>
                      {result.subheading && (
                        <div className="text-xs text-gray-500">{result.subheading}</div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <nav className={`space-y-1 ${isExpanded ? 'overflow-y-auto max-h-[calc(100vh-300px)]' : 'overflow-hidden'}`}>
            {navigationSections.map((section) => {
              const isExpandedSection = expandedSections[section.name];
              const isSectionActive = section.single 
                ? router.pathname === section.href
                : section.subItems?.some(item => router.pathname === item.href);
              
              return (
                <div key={section.name}>
                  {section.single ? (
                    <Link
                      href={section.href}
                      className={`
                        group flex items-center ${isExpanded ? 'px-4' : 'px-2 justify-center'} py-3 rounded-xl transition-all duration-300
                        ${router.pathname === section.href 
                          ? 'bg-gradient-to-r from-[#636B56] to-[#864936] text-[#F8F2E7] shadow-lg shadow-[#636B56]/25' 
                          : 'hover:bg-[#636B56]/10 text-[#4a4a4a]'
                        }
                      `}
                      title={!isExpanded ? section.name : ''}
                    >
                      <section.icon className={`${isExpanded ? 'h-5 w-5 mr-3' : 'h-10 w-10'} ${router.pathname === section.href ? 'text-[#F8F2E7]' : 'text-[#7a7a7a] group-hover:text-[#636B56]'}`} />
                      {isExpanded && (
                        <>
                          <span className="font-medium" style={{ fontFamily: 'Avenir, sans-serif' }}>{section.name}</span>
                          {router.pathname === section.href && (
                            <div className="ml-auto h-2 w-2 rounded-full bg-[#F8F2E7] animate-pulse" />
                          )}
                        </>
                      )}
                    </Link>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleSection(section.name)}
                        className={`
                          w-full group flex items-center ${isExpanded ? 'px-4' : 'px-2 justify-center'} py-3 rounded-xl transition-all duration-300
                          ${isSectionActive 
                            ? 'bg-[#636B56]/20 text-[#636B56]' 
                            : 'hover:bg-[#636B56]/10 text-[#4a4a4a]'
                          }
                        `}
                        title={!isExpanded ? section.name : ''}
                      >
                        <section.icon className={`${isExpanded ? 'h-5 w-5 mr-3' : 'h-10 w-10'} ${isSectionActive ? 'text-[#636B56]' : 'text-[#7a7a7a] group-hover:text-[#636B56]'}`} />
                        {isExpanded && (
                          <>
                            <span className="font-medium flex-1 text-left" style={{ fontFamily: 'Avenir, sans-serif' }}>{section.name}</span>
                            {isExpandedSection ? (
                              <ChevronDownIcon className="h-4 w-4 text-[#7a7a7a]" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4 text-[#7a7a7a]" />
                            )}
                          </>
                        )}
                      </button>
                      {isExpanded && isExpandedSection && (
                        <div className="ml-4 mt-1 space-y-1">
                          {section.subItems.map((item) => {
                            const isActive = router.pathname === item.href || 
                                           (item.href.includes('?') && router.pathname === item.href.split('?')[0] && router.asPath.includes(item.href.split('?')[1]));
                            return (
                              <Link
                                key={item.name}
                                href={item.href}
                                className={`
                                  group flex flex-col px-4 py-2 rounded-lg transition-all duration-300
                                  ${isActive 
                                    ? 'bg-gradient-to-r from-[#636B56] to-[#864936] text-[#F8F2E7]' 
                                    : 'hover:bg-[#636B56]/10 text-[#4a4a4a]'
                                  }
                                `}
                              >
                                <span className="font-medium text-sm" style={{ fontFamily: 'Avenir, sans-serif' }}>{item.name}</span>
                                <span className={`text-xs mt-0.5 ${isActive ? 'text-[#F8F2E7]/80' : 'text-[#7a7a7a]'}`}>
                                  {item.subheading}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* User Profile Section */}
        <div className={`absolute bottom-0 left-0 right-0 ${isExpanded ? 'p-6' : 'p-2'} border-t border-[#B28354]/20`}>
          <div className={`flex items-center ${isExpanded ? 'space-x-3' : 'justify-center'}`}>
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#636B56] to-[#864936] flex items-center justify-center text-[#F8F2E7] font-bold" style={{ fontFamily: 'Forum, serif' }}>
              JD
            </div>
            {isExpanded && (
              <>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1a1a1a]" style={{ fontFamily: 'Avenir, sans-serif' }}>John Doe</p>
                  <p className="text-xs text-[#7a7a7a]" style={{ fontFamily: 'Avenir, sans-serif' }}>Agent</p>
                </div>
                <BellIcon className="h-5 w-5 text-[#7a7a7a] hover:text-[#636B56] cursor-pointer transition-colors" />
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`${isExpanded ? 'ml-72' : 'ml-16'} min-h-screen transition-all duration-500`}>
        {/* Top Bar */}
        <header className={`fixed top-0 ${isExpanded ? 'left-72' : 'left-16'} right-0 z-30 bg-[#F8F2E7]/90 backdrop-blur-xl border-b border-[#B28354]/20 transition-all duration-500`}>
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1">
                <h2 className="text-2xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
                  {(() => {
                    // Find the current page title from navigation sections
                    for (const section of navigationSections) {
                      if (section.single && router.pathname === section.href) {
                        return section.name === 'Dashboard' ? 'Dash' : section.name;
                      }
                      if (section.subItems) {
                        const currentItem = section.subItems.find(item => {
                          const pathMatch = router.pathname === item.href.split('?')[0];
                          if (item.href.includes('?') && pathMatch) {
                            return router.asPath.includes(item.href.split('?')[1]);
                          }
                          return router.pathname === item.href;
                        });
                        if (currentItem) {
                          return currentItem.name;
                        }
                      }
                    }
                    return 'Dash';
                  })()}
                </h2>
                
                {/* News Ticker */}
                <div className="flex-1 mx-6">
                  <NewsTicker />
                </div>
                
              </div>
              
              {/* Quick Stats */}
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>24</p>
                  <p className="text-xs text-[#7a7a7a]" style={{ fontFamily: 'Avenir, sans-serif' }}>Active Calls</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#864936]" style={{ fontFamily: 'Forum, serif' }}>142</p>
                  <p className="text-xs text-[#7a7a7a]" style={{ fontFamily: 'Avenir, sans-serif' }}>Leads Today</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#B28354]" style={{ fontFamily: 'Forum, serif' }}>89%</p>
                  <p className="text-xs text-[#7a7a7a]" style={{ fontFamily: 'Avenir, sans-serif' }}>Connect Rate</p>
                </div>
                
                {/* Search Bar on Far Right */}
                <div className="ml-6">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#7a7a7a]" />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="w-80 pl-10 pr-4 py-2.5 bg-white border border-[#B28354]/20 rounded-lg text-sm text-[#1a1a1a] placeholder-[#7a7a7a] focus:outline-none focus:ring-2 focus:ring-[#636B56]/20 focus:border-[#636B56]/50 transition-all"
                      style={{ fontFamily: 'Avenir, sans-serif' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 pt-24">
          {children}
        </div>
      </main>
    </div>
  );
}