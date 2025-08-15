import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { 
  CalendarDaysIcon,
  MapIcon,
  ClockIcon,
  ChartBarIcon,
  LightBulbIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  FireIcon,
  TruckIcon,
  HomeIcon,
  PhoneIcon,
  DocumentTextIcon,
  UserGroupIcon
} from '@heroicons/react/24/solid';

export default function DayPlanner() {
  const [currentDay, setCurrentDay] = useState(new Date());
  const [dayPlan, setDayPlan] = useState(null);
  const [activities, setActivities] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [productivityScore, setProductivityScore] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [timeBlocks, setTimeBlocks] = useState([]);
  
  // Activity tracking
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  // Activity types with optimal time allocations
  const activityTypes = {
    prospecting: {
      name: 'Prospecting Calls',
      icon: PhoneIcon,
      color: 'blue',
      optimalTime: '9:00-11:00',
      energyLevel: 'high',
      duration: 30
    },
    viewings: {
      name: 'Property Viewings',
      icon: HomeIcon,
      color: 'green',
      optimalTime: '11:00-14:00',
      energyLevel: 'medium',
      duration: 45
    },
    admin: {
      name: 'Admin & Follow-ups',
      icon: DocumentTextIcon,
      color: 'gray',
      optimalTime: '14:00-15:00',
      energyLevel: 'low',
      duration: 60
    },
    meetings: {
      name: 'Client Meetings',
      icon: UserGroupIcon,
      color: 'purple',
      optimalTime: '15:00-17:00',
      energyLevel: 'medium',
      duration: 60
    },
    travel: {
      name: 'Travel Time',
      icon: TruckIcon,
      color: 'yellow',
      optimalTime: 'flexible',
      energyLevel: 'low',
      duration: 20
    }
  };

  // Load day plan on mount
  useEffect(() => {
    loadTodaysPlan();
    loadActivities();
    generateSuggestions();
    
    // Check for calendar integration
    checkCalendarSync();
    
    // Start productivity tracking
    startProductivityTracking();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Load today's plan
  const loadTodaysPlan = async () => {
    try {
      const response = await fetch(`/api/day-plan?date=${currentDay.toISOString()}`);
      const data = await response.json();
      
      if (data.plan) {
        setDayPlan(data.plan);
        setTimeBlocks(data.plan.timeBlocks || []);
      } else {
        // Generate AI-optimized plan
        generateOptimalPlan();
      }
    } catch (error) {
      console.error('Failed to load day plan:', error);
      generateOptimalPlan();
    }
  };

  // Load scheduled activities
  const loadActivities = async () => {
    try {
      // Load from calendar, CRM, and task list
      const [appointments, tasks, calls] = await Promise.all([
        fetch('/api/appointments?date=' + currentDay.toISOString()),
        fetch('/api/tasks?date=' + currentDay.toISOString()),
        fetch('/api/scheduled-calls?date=' + currentDay.toISOString())
      ]);
      
      const appointmentsData = await appointments.json();
      const tasksData = await tasks.json();
      const callsData = await calls.json();
      
      const allActivities = [
        ...appointmentsData.map(a => ({ ...a, type: 'appointment' })),
        ...tasksData.map(t => ({ ...t, type: 'task' })),
        ...callsData.map(c => ({ ...c, type: 'call' }))
      ].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      
      setActivities(allActivities);
      
      // Optimize route if there are location-based activities
      const locationActivities = allActivities.filter(a => a.location);
      if (locationActivities.length > 1) {
        optimizeRoute(locationActivities);
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
      // Use sample data
      setSampleActivities();
    }
  };

  // Set sample activities for demo
  const setSampleActivities = () => {
    const sampleActivities = [
      {
        id: 1,
        title: 'Morning Prospecting Calls',
        type: 'prospecting',
        startTime: '09:00',
        endTime: '10:30',
        priority: 'high',
        estimatedValue: 50000,
        contacts: 15
      },
      {
        id: 2,
        title: 'Property Viewing - 123 Oak St',
        type: 'viewings',
        startTime: '11:00',
        endTime: '11:45',
        location: '123 Oak Street, Parramatta',
        client: 'John Smith',
        priority: 'high',
        estimatedValue: 850000
      },
      {
        id: 3,
        title: 'Lunch & Travel',
        type: 'travel',
        startTime: '12:00',
        endTime: '13:00',
        priority: 'low'
      },
      {
        id: 4,
        title: 'Property Viewing - 456 Pine Ave',
        type: 'viewings',
        startTime: '13:30',
        endTime: '14:15',
        location: '456 Pine Avenue, Westmead',
        client: 'Sarah Johnson',
        priority: 'medium',
        estimatedValue: 1200000
      },
      {
        id: 5,
        title: 'Admin & Email Follow-ups',
        type: 'admin',
        startTime: '14:30',
        endTime: '15:30',
        priority: 'medium',
        tasks: 12
      },
      {
        id: 6,
        title: 'Listing Presentation',
        type: 'meetings',
        startTime: '16:00',
        endTime: '17:00',
        location: '789 Elm Court, Parramatta',
        client: 'Mike Chen',
        priority: 'high',
        estimatedValue: 950000
      }
    ];
    
    setActivities(sampleActivities);
  };

  // Generate AI-optimized daily plan
  const generateOptimalPlan = () => {
    const plan = {
      date: currentDay.toISOString(),
      energyPeaks: [
        { time: '09:00-11:00', level: 'high', recommendation: 'Focus on high-value calls and negotiations' },
        { time: '14:00-16:00', level: 'medium', recommendation: 'Schedule viewings and client meetings' }
      ],
      timeBlocks: [
        {
          start: '08:00',
          end: '09:00',
          activity: 'Morning Prep & Review',
          type: 'prep',
          tasks: [
            'Review daily appointments',
            'Check overnight emails',
            'Prepare viewing materials',
            'Set daily goals'
          ]
        },
        {
          start: '09:00',
          end: '11:00',
          activity: 'High-Energy Prospecting',
          type: 'prospecting',
          tasks: [
            'Call hot leads',
            'Follow up on recent inquiries',
            'Reach out to past clients',
            'Update CRM with call outcomes'
          ],
          target: '20 calls'
        },
        {
          start: '11:00',
          end: '13:00',
          activity: 'Property Viewings',
          type: 'viewings',
          tasks: [
            'Conduct scheduled viewings',
            'Capture feedback',
            'Schedule follow-ups'
          ]
        },
        {
          start: '13:00',
          end: '14:00',
          activity: 'Lunch & Recharge',
          type: 'break',
          tasks: ['Healthy lunch', 'Quick walk', 'Mental reset']
        },
        {
          start: '14:00',
          end: '15:30',
          activity: 'Admin & Documentation',
          type: 'admin',
          tasks: [
            'Process paperwork',
            'Update listings',
            'Respond to emails',
            'Prepare contracts'
          ]
        },
        {
          start: '15:30',
          end: '17:00',
          activity: 'Client Meetings',
          type: 'meetings',
          tasks: [
            'Listing presentations',
            'Negotiation meetings',
            'Contract reviews'
          ]
        },
        {
          start: '17:00',
          end: '18:00',
          activity: 'Day Wrap-up',
          type: 'review',
          tasks: [
            'Log daily activities',
            'Update pipeline',
            'Plan tomorrow',
            'Send follow-up messages'
          ]
        }
      ],
      goals: {
        calls: 20,
        viewings: 3,
        listings: 1,
        followUps: 15
      },
      estimatedRevenue: 25000,
      productivityTarget: 85
    };
    
    setDayPlan(plan);
    setTimeBlocks(plan.timeBlocks);
  };

  // Optimize route for property viewings
  const optimizeRoute = async (locations) => {
    // In production, use Google Maps API for actual route optimization
    // For demo, we'll create a simple optimized route
    
    const optimized = {
      totalDistance: '24.5 km',
      totalTime: '45 minutes',
      fuelSaved: '2.3L',
      timeSaved: '15 minutes',
      route: locations.map((loc, idx) => ({
        ...loc,
        order: idx + 1,
        distance: idx === 0 ? '0 km' : `${(Math.random() * 5 + 2).toFixed(1)} km`,
        duration: idx === 0 ? '0 min' : `${Math.floor(Math.random() * 10 + 5)} min`,
        arrival: new Date(Date.now() + idx * 45 * 60000).toTimeString().slice(0, 5)
      })),
      mapUrl: '/api/route-map',
      alternatives: [
        {
          name: 'Fastest Route',
          time: '42 min',
          distance: '26.1 km'
        },
        {
          name: 'Shortest Route',
          time: '48 min',
          distance: '22.8 km'
        }
      ]
    };
    
    setOptimizedRoute(optimized);
  };

  // Generate AI suggestions
  const generateSuggestions = () => {
    const suggestions = [
      {
        id: 1,
        type: 'optimization',
        title: 'Batch Similar Tasks',
        description: 'Group all phone calls between 9-11 AM when energy is highest',
        impact: 'high',
        timesSaved: '30 min/day'
      },
      {
        id: 2,
        type: 'opportunity',
        title: 'Gap in Schedule',
        description: 'You have 30 minutes free at 2:30 PM - perfect for follow-up calls',
        impact: 'medium',
        action: 'Schedule calls'
      },
      {
        id: 3,
        type: 'efficiency',
        title: 'Route Optimization Available',
        description: 'Reorder viewings to save 15 minutes of driving',
        impact: 'medium',
        action: 'Optimize route'
      },
      {
        id: 4,
        type: 'reminder',
        title: 'High-Value Follow-up',
        description: 'John Smith viewed 3 properties last week - schedule follow-up',
        impact: 'high',
        value: '$850,000'
      },
      {
        id: 5,
        type: 'wellness',
        title: 'Energy Management',
        description: 'Schedule a 10-minute break at 3 PM to maintain productivity',
        impact: 'low',
        benefit: 'Avoid afternoon slump'
      }
    ];
    
    setSuggestions(suggestions);
  };

  // Start productivity tracking
  const startProductivityTracking = () => {
    // Update productivity score every minute
    timerRef.current = setInterval(() => {
      calculateProductivityScore();
    }, 60000);
    
    // Initial calculation
    calculateProductivityScore();
  };

  // Calculate productivity score
  const calculateProductivityScore = () => {
    const now = new Date();
    const hour = now.getHours();
    
    // Factors for productivity score
    const factors = {
      tasksCompleted: 0.3,
      onSchedule: 0.25,
      highValueActivities: 0.25,
      energyAlignment: 0.2
    };
    
    // Calculate each component
    const completed = activities.filter(a => a.status === 'completed').length;
    const total = activities.length || 1;
    const completionRate = (completed / total) * 100;
    
    // Check if on schedule
    const currentBlock = timeBlocks.find(block => {
      const blockStart = parseInt(block.start.split(':')[0]);
      const blockEnd = parseInt(block.end.split(':')[0]);
      return hour >= blockStart && hour < blockEnd;
    });
    
    const onScheduleScore = currentBlock ? 100 : 50;
    
    // High-value activity score
    const highValueScore = currentBlock?.type === 'prospecting' || currentBlock?.type === 'meetings' ? 100 : 70;
    
    // Energy alignment score
    const energyScore = (hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16) ? 100 : 70;
    
    // Calculate weighted score
    const score = 
      completionRate * factors.tasksCompleted +
      onScheduleScore * factors.onSchedule +
      highValueScore * factors.highValueActivities +
      energyScore * factors.energyAlignment;
    
    setProductivityScore(Math.round(score));
  };

  // Check calendar sync
  const checkCalendarSync = async () => {
    try {
      const response = await fetch('/api/calendar/sync-status');
      const data = await response.json();
      
      if (data.synced) {
        console.log('Calendar synced:', data.provider);
      }
    } catch (error) {
      console.log('Calendar sync not configured');
    }
  };

  // Start activity tracking
  const startActivity = (activity) => {
    setCurrentActivity(activity);
    setIsTracking(true);
    startTimeRef.current = Date.now();
    
    // Log activity start
    logActivity({
      ...activity,
      startedAt: new Date().toISOString(),
      status: 'in_progress'
    });
  };

  // Complete activity
  const completeActivity = () => {
    if (!currentActivity) return;
    
    const duration = Date.now() - startTimeRef.current;
    
    // Update activity status
    setActivities(prev => prev.map(a => 
      a.id === currentActivity.id 
        ? { ...a, status: 'completed', actualDuration: duration }
        : a
    ));
    
    // Log completion
    logActivity({
      ...currentActivity,
      completedAt: new Date().toISOString(),
      status: 'completed',
      duration: Math.round(duration / 60000)
    });
    
    setCurrentActivity(null);
    setIsTracking(false);
    
    // Recalculate productivity
    calculateProductivityScore();
  };

  // Log activity to backend
  const logActivity = async (activity) => {
    try {
      await fetch('/api/activity-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity)
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  // Apply suggestion
  const applySuggestion = (suggestion) => {
    switch (suggestion.type) {
      case 'optimization':
        // Reorder activities
        generateOptimalPlan();
        break;
      case 'opportunity':
        // Add new activity
        console.log('Adding activity to gap');
        break;
      case 'efficiency':
        // Optimize route
        const locationActivities = activities.filter(a => a.location);
        optimizeRoute(locationActivities);
        break;
      default:
        console.log('Applying suggestion:', suggestion);
    }
    
    // Remove applied suggestion
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  // Get activity color
  const getActivityColor = (type) => {
    return activityTypes[type]?.color || 'gray';
  };

  // Format time
  const formatTime = (time) => {
    if (!time) return '';
    if (time.includes(':')) return time;
    return new Date(time).toTimeString().slice(0, 5);
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#636B56]">Day Planner</h1>
              <p className="text-gray-600 mt-1">AI-optimized daily structure for maximum productivity</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#636B56]">{productivityScore}%</p>
                <p className="text-xs text-gray-600">Productivity Score</p>
              </div>
              <button
                onClick={generateOptimalPlan}
                className="px-4 py-2 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365] flex items-center gap-2"
              >
                <ArrowPathIcon className="h-5 w-5" />
                Optimize Day
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Activities</p>
                <p className="text-2xl font-bold">{activities.length}</p>
              </div>
              <CalendarDaysIcon className="h-8 w-8 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {activities.filter(a => a.status === 'completed').length}
                </p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-200" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Est. Revenue</p>
                <p className="text-2xl font-bold text-[#636B56]">
                  ${(dayPlan?.estimatedRevenue || 0).toLocaleString()}
                </p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-green-200" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Time Saved</p>
                <p className="text-2xl font-bold text-blue-600">
                  {optimizedRoute ? optimizedRoute.timeSaved : '0 min'}
                </p>
              </div>
              <ClockIcon className="h-8 w-8 text-blue-200" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Time Blocks */}
          <div className="col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-[#636B56] mb-4">Today's Structure</h2>
              
              {/* Current Activity Tracker */}
              {isTracking && currentActivity && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-blue-800">Currently Working On:</p>
                      <p className="text-blue-600">{currentActivity.title}</p>
                    </div>
                    <button
                      onClick={completeActivity}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      Complete
                    </button>
                  </div>
                </div>
              )}
              
              {/* Time Blocks */}
              <div className="space-y-3">
                {timeBlocks.map((block, idx) => {
                  const Icon = activityTypes[block.type]?.icon || ClockIcon;
                  const color = getActivityColor(block.type);
                  const isActive = new Date().getHours() >= parseInt(block.start.split(':')[0]) &&
                                  new Date().getHours() < parseInt(block.end.split(':')[0]);
                  
                  return (
                    <div
                      key={idx}
                      className={`border rounded-lg p-4 transition-all ${
                        isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg bg-${color}-100`}>
                            <Icon className={`h-5 w-5 text-${color}-600`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{block.activity}</p>
                              {isActive && (
                                <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                                  NOW
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {block.start} - {block.end}
                            </p>
                            {block.tasks && (
                              <ul className="mt-2 space-y-1">
                                {block.tasks.slice(0, 3).map((task, tidx) => (
                                  <li key={tidx} className="text-sm text-gray-600 flex items-center gap-1">
                                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                    {task}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {block.target && (
                              <p className="text-sm font-medium text-green-600 mt-2">
                                Target: {block.target}
                              </p>
                            )}
                          </div>
                        </div>
                        {!isTracking && isActive && (
                          <button
                            onClick={() => startActivity({ ...block, id: idx })}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
                          >
                            <PlayIcon className="h-4 w-4" />
                            Start
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Route Optimization */}
            {optimizedRoute && (
              <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
                <h2 className="text-xl font-semibold text-[#864936] mb-4">Optimized Route</h2>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                  <p className="text-green-800 font-semibold">Route Optimized!</p>
                  <p className="text-sm text-green-600">
                    Saved {optimizedRoute.timeSaved} and {optimizedRoute.fuelSaved} fuel
                  </p>
                </div>
                <div className="space-y-3">
                  {optimizedRoute.route.map((stop, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {stop.order}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{stop.title || stop.location}</p>
                        <p className="text-sm text-gray-600">
                          {stop.distance} • {stop.duration} • Arrival: {stop.arrival}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                  <MapIcon className="h-5 w-5" />
                  Open in Maps
                </button>
              </div>
            )}
          </div>

          {/* AI Suggestions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-[#B28354] mb-4 flex items-center gap-2">
                <LightBulbIcon className="h-6 w-6 text-yellow-500" />
                AI Suggestions
              </h2>
              <div className="space-y-3">
                {suggestions.map(suggestion => (
                  <div key={suggestion.id} className="border rounded-lg p-3 hover:border-blue-500 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{suggestion.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                        {suggestion.timesSaved && (
                          <p className="text-xs text-green-600 mt-1">Saves {suggestion.timesSaved}</p>
                        )}
                        {suggestion.value && (
                          <p className="text-xs text-blue-600 mt-1">Value: {suggestion.value}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        suggestion.impact === 'high' ? 'bg-red-100 text-red-700' :
                        suggestion.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {suggestion.impact}
                      </span>
                    </div>
                    {suggestion.action && (
                      <button
                        onClick={() => applySuggestion(suggestion)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {suggestion.action} →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Energy Levels */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-[#636B56] mb-4 flex items-center gap-2">
                <FireIcon className="h-6 w-6 text-orange-500" />
                Energy Management
              </h2>
              <div className="space-y-3">
                {dayPlan?.energyPeaks?.map((peak, idx) => (
                  <div key={idx} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{peak.time}</p>
                      <span className={`px-2 py-1 text-xs rounded ${
                        peak.level === 'high' ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {peak.level} energy
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{peak.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Goals */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-[#864936] mb-4">Daily Goals</h2>
              <div className="space-y-3">
                {dayPlan?.goals && Object.entries(dayPlan.goals).map(([key, value]) => {
                  const completed = key === 'calls' ? 12 : 
                                  key === 'viewings' ? 2 :
                                  key === 'listings' ? 0 :
                                  key === 'followUps' ? 8 : 0;
                  const percentage = (completed / value) * 100;
                  
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{key}</span>
                        <span className="font-medium">{completed}/{value}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            percentage >= 100 ? 'bg-green-600' :
                            percentage >= 50 ? 'bg-yellow-600' :
                            'bg-red-600'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}