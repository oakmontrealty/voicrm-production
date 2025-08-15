import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  PlusIcon,
  CalendarIcon,
  UserCircleIcon,
  TagIcon,
  FunnelIcon,
  BellIcon,
  DocumentTextIcon,
  PhoneIcon,
  HomeIcon,
  EnvelopeIcon,
  UserGroupIcon,
  BriefcaseIcon,
  XMarkIcon,
  ChevronRightIcon,
  SparklesIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [viewMode, setViewMode] = useState('list');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '09:00',
    priority: 'medium',
    status: 'pending',
    category: 'follow-up',
    assignedTo: 'You',
    relatedTo: '',
    reminder: true,
    reminderBefore: 60, // minutes
    recurring: false,
    recurringInterval: 'weekly',
    attachments: [],
    notes: ''
  });

  const categories = {
    'follow-up': { name: 'Follow-up', icon: <PhoneIcon className="h-4 w-4" />, color: 'bg-blue-500' },
    'viewing': { name: 'Property Viewing', icon: <HomeIcon className="h-4 w-4" />, color: 'bg-green-500' },
    'documentation': { name: 'Documentation', icon: <DocumentTextIcon className="h-4 w-4" />, color: 'bg-purple-500' },
    'meeting': { name: 'Meeting', icon: <UserGroupIcon className="h-4 w-4" />, color: 'bg-indigo-500' },
    'email': { name: 'Email', icon: <EnvelopeIcon className="h-4 w-4" />, color: 'bg-pink-500' },
    'contract': { name: 'Contract', icon: <BriefcaseIcon className="h-4 w-4" />, color: 'bg-orange-500' },
    'other': { name: 'Other', icon: <TagIcon className="h-4 w-4" />, color: 'bg-gray-500' }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    filterAndSortTasks();
  }, [tasks, filter, sortBy]);

  const loadTasks = async () => {
    // Mock data - in production, load from Supabase
    const mockTasks = [
      {
        id: 1,
        title: 'Follow up with Sarah Chen',
        description: 'Send Gregory Hills property listings and financing options',
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        status: 'pending',
        category: 'follow-up',
        assignedTo: 'You',
        relatedTo: 'Lead #L-2024-001',
        reminder: true,
        reminderBefore: 30,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Property Viewing - Hartley Road',
        description: 'Show 3 properties to Chen family, starting at 10 AM',
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).setHours(10, 0, 0, 0),
        priority: 'high',
        status: 'pending',
        category: 'viewing',
        assignedTo: 'You',
        relatedTo: 'Property #P-2024-045',
        reminder: true,
        reminderBefore: 60,
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        title: 'Update CRM with new leads',
        description: 'Import leads from last week\'s open house',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        priority: 'medium',
        status: 'in-progress',
        category: 'documentation',
        assignedTo: 'You',
        createdAt: new Date().toISOString()
      },
      {
        id: 4,
        title: 'Team Meeting - Sales Review',
        description: 'Monthly sales review and strategy planning',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).setHours(14, 0, 0, 0),
        priority: 'medium',
        status: 'pending',
        category: 'meeting',
        assignedTo: 'Team',
        reminder: true,
        reminderBefore: 15,
        createdAt: new Date().toISOString()
      },
      {
        id: 5,
        title: 'Send contract to Anderson',
        description: 'Final purchase agreement for Leppington property',
        dueDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        status: 'overdue',
        category: 'contract',
        assignedTo: 'You',
        relatedTo: 'Deal #D-2024-012',
        createdAt: new Date().toISOString()
      }
    ];

    setTasks(mockTasks);
  };

  const filterAndSortTasks = () => {
    let filtered = [...tasks];

    // Apply filter
    switch(filter) {
      case 'pending':
        filtered = filtered.filter(t => t.status === 'pending');
        break;
      case 'in-progress':
        filtered = filtered.filter(t => t.status === 'in-progress');
        break;
      case 'completed':
        filtered = filtered.filter(t => t.status === 'completed');
        break;
      case 'overdue':
        filtered = filtered.filter(t => {
          const due = new Date(t.dueDate);
          return due < new Date() && t.status !== 'completed';
        });
        break;
      case 'today':
        filtered = filtered.filter(t => {
          const due = new Date(t.dueDate);
          const today = new Date();
          return due.toDateString() === today.toDateString();
        });
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'dueDate':
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    // Check for overdue tasks
    filtered = filtered.map(task => {
      const due = new Date(task.dueDate);
      if (due < new Date() && task.status !== 'completed') {
        return { ...task, status: 'overdue' };
      }
      return task;
    });

    setFilteredTasks(filtered);
  };

  const createTask = async () => {
    const task = {
      ...newTask,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      dueDate: `${newTask.dueDate}T${newTask.dueTime}:00`
    };

    setTasks([...tasks, task]);
    setShowModal(false);
    resetForm();
  };

  const updateTaskStatus = (taskId, newStatus) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: newStatus, completedAt: newStatus === 'completed' ? new Date().toISOString() : null }
        : task
    ));
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    setShowDetails(false);
    setSelectedTask(null);
  };

  const resetForm = () => {
    setNewTask({
      title: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '09:00',
      priority: 'medium',
      status: 'pending',
      category: 'follow-up',
      assignedTo: 'You',
      relatedTo: '',
      reminder: true,
      reminderBefore: 60,
      recurring: false,
      recurringInterval: 'weekly',
      attachments: [],
      notes: ''
    });
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <ClockIcon className="h-5 w-5 text-blue-600 animate-pulse" />;
      case 'overdue':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-400" />;
    }
  };

  const formatDueDate = (date) => {
    const due = new Date(date);
    const now = new Date();
    const diffHours = (due - now) / (1000 * 60 * 60);
    
    if (diffHours < 0 && diffHours > -24) return 'Overdue';
    if (diffHours >= 0 && diffHours < 1) return 'Due soon';
    if (diffHours >= 0 && diffHours < 24) return `Due in ${Math.round(diffHours)} hours`;
    if (diffHours >= 24 && diffHours < 48) return 'Tomorrow';
    
    return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
                Task Management
              </h1>
              <p className="text-[#7a7a7a] mt-1" style={{ fontFamily: 'Avenir, sans-serif' }}>
                Stay organized with smart task tracking
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-[#636B56] to-[#864936] text-white rounded-lg font-bold hover:shadow-lg transition-all flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Create Task
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-[#B28354]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#636B56]">{tasks.filter(t => t.status === 'pending').length}</p>
                <p className="text-sm text-[#7a7a7a]">Pending</p>
              </div>
              <ClockIcon className="h-8 w-8 text-[#636B56]/30" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-[#B28354]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{tasks.filter(t => t.status === 'in-progress').length}</p>
                <p className="text-sm text-[#7a7a7a]">In Progress</p>
              </div>
              <ArrowPathIcon className="h-8 w-8 text-blue-600/30" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-[#B28354]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{tasks.filter(t => t.status === 'overdue').length}</p>
                <p className="text-sm text-[#7a7a7a]">Overdue</p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600/30" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-[#B28354]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{tasks.filter(t => t.status === 'completed').length}</p>
                <p className="text-sm text-[#7a7a7a]">Completed</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-600/30" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-[#636B56] to-[#864936] rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{tasks.length}</p>
                <p className="text-sm opacity-90">Total Tasks</p>
              </div>
              <SparklesIcon className="h-8 w-8 text-white/50" />
            </div>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="bg-white rounded-xl p-4 mb-6 border border-[#B28354]/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-[#636B56]" />
            <div className="flex gap-2">
              {['all', 'pending', 'in-progress', 'overdue', 'completed', 'today'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    filter === f 
                      ? 'bg-[#636B56] text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#636B56]"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="created">Created</option>
            </select>
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#636B56] text-white' : 'bg-gray-100'}`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#636B56] text-white' : 'bg-gray-100'}`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Tasks List/Grid */}
        {viewMode === 'list' ? (
          <div className="bg-white rounded-xl border border-[#B28354]/20 overflow-hidden">
            <div className="divide-y divide-[#B28354]/20">
              {filteredTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="p-4 hover:bg-[#F8F2E7]/50 transition-colors cursor-pointer"
                  onClick={() => { setSelectedTask(task); setShowDetails(true); }}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed');
                      }}
                      className="flex-shrink-0"
                    >
                      {getStatusIcon(task.status)}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className={`font-semibold text-[#1a1a1a] ${
                          task.status === 'completed' ? 'line-through opacity-60' : ''
                        }`}>
                          {task.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${categories[task.category].color} text-white`}>
                          {categories[task.category].icon}
                          <span>{categories[task.category].name}</span>
                        </div>
                      </div>
                      <p className="text-sm text-[#7a7a7a] mb-2">{task.description}</p>
                      <div className="flex items-center gap-4 text-xs text-[#7a7a7a]">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span className={task.status === 'overdue' ? 'text-red-600 font-semibold' : ''}>
                            {formatDueDate(task.dueDate)}
                          </span>
                        </div>
                        {task.assignedTo && (
                          <div className="flex items-center gap-1">
                            <UserCircleIcon className="h-4 w-4" />
                            <span>{task.assignedTo}</span>
                          </div>
                        )}
                        {task.relatedTo && (
                          <div className="flex items-center gap-1">
                            <TagIcon className="h-4 w-4" />
                            <span>{task.relatedTo}</span>
                          </div>
                        )}
                        {task.reminder && (
                          <div className="flex items-center gap-1">
                            <BellIcon className="h-4 w-4 text-[#636B56]" />
                            <span>Reminder set</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <ChevronRightIcon className="h-5 w-5 text-[#7a7a7a] flex-shrink-0" />
                  </div>
                </div>
              ))}
              
              {filteredTasks.length === 0 && (
                <div className="p-12 text-center">
                  <CheckCircleIcon className="h-16 w-16 text-[#636B56]/30 mx-auto mb-4" />
                  <p className="text-[#7a7a7a]">No tasks found</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => (
              <div 
                key={task.id}
                className="bg-white rounded-lg border border-[#B28354]/20 p-4 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => { setSelectedTask(task); setShowDetails(true); }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${categories[task.category].color}`}>
                    <div className="text-white">{categories[task.category].icon}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed');
                    }}
                  >
                    {getStatusIcon(task.status)}
                  </button>
                </div>
                
                <h3 className={`font-semibold text-[#1a1a1a] mb-2 ${
                  task.status === 'completed' ? 'line-through opacity-60' : ''
                }`}>
                  {task.title}
                </h3>
                <p className="text-sm text-[#7a7a7a] mb-3 line-clamp-2">{task.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`text-xs ${task.status === 'overdue' ? 'text-red-600 font-semibold' : 'text-[#7a7a7a]'}`}>
                    {formatDueDate(task.dueDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Task Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#636B56]">Create New Task</h2>
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4a4a4a] mb-1">Title</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    className="w-full px-4 py-2 border border-[#B28354]/30 rounded-lg focus:outline-none focus:border-[#636B56]"
                    placeholder="Enter task title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4a4a4a] mb-1">Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    className="w-full px-4 py-2 border border-[#B28354]/30 rounded-lg focus:outline-none focus:border-[#636B56]"
                    rows="3"
                    placeholder="Enter task description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4a4a4a] mb-1">Due Date</label>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                      className="w-full px-4 py-2 border border-[#B28354]/30 rounded-lg focus:outline-none focus:border-[#636B56]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4a4a4a] mb-1">Due Time</label>
                    <input
                      type="time"
                      value={newTask.dueTime}
                      onChange={(e) => setNewTask({...newTask, dueTime: e.target.value})}
                      className="w-full px-4 py-2 border border-[#B28354]/30 rounded-lg focus:outline-none focus:border-[#636B56]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4a4a4a] mb-1">Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                      className="w-full px-4 py-2 border border-[#B28354]/30 rounded-lg focus:outline-none focus:border-[#636B56]"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4a4a4a] mb-1">Category</label>
                    <select
                      value={newTask.category}
                      onChange={(e) => setNewTask({...newTask, category: e.target.value})}
                      className="w-full px-4 py-2 border border-[#B28354]/30 rounded-lg focus:outline-none focus:border-[#636B56]"
                    >
                      {Object.entries(categories).map(([key, cat]) => (
                        <option key={key} value={key}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4a4a4a] mb-1">Related To</label>
                  <input
                    type="text"
                    value={newTask.relatedTo}
                    onChange={(e) => setNewTask({...newTask, relatedTo: e.target.value})}
                    className="w-full px-4 py-2 border border-[#B28354]/30 rounded-lg focus:outline-none focus:border-[#636B56]"
                    placeholder="e.g., Lead #L-2024-001, Property #P-2024-045"
                  />
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newTask.reminder}
                      onChange={(e) => setNewTask({...newTask, reminder: e.target.checked})}
                      className="rounded text-[#636B56]"
                    />
                    <span className="text-sm">Set reminder</span>
                  </label>
                  {newTask.reminder && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={newTask.reminderBefore}
                        onChange={(e) => setNewTask({...newTask, reminderBefore: parseInt(e.target.value)})}
                        className="w-20 px-2 py-1 border border-[#B28354]/30 rounded"
                      />
                      <span className="text-sm">minutes before</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4a4a4a] mb-1">Notes</label>
                  <textarea
                    value={newTask.notes}
                    onChange={(e) => setNewTask({...newTask, notes: e.target.value})}
                    className="w-full px-4 py-2 border border-[#B28354]/30 rounded-lg focus:outline-none focus:border-[#636B56]"
                    rows="2"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-6 py-2 border border-[#636B56] text-[#636B56] rounded-lg hover:bg-[#636B56]/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createTask}
                  disabled={!newTask.title}
                  className="px-6 py-2 bg-gradient-to-r from-[#636B56] to-[#864936] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Task Details Modal */}
        {showDetails && selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#636B56]">Task Details</h2>
                <button
                  onClick={() => { setShowDetails(false); setSelectedTask(null); }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${categories[selectedTask.category].color}`}>
                    <div className="text-white">{categories[selectedTask.category].icon}</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-[#1a1a1a]">{selectedTask.title}</h3>
                    <p className="text-sm text-[#7a7a7a]">{categories[selectedTask.category].name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(selectedTask.priority)}`}>
                    {selectedTask.priority} priority
                  </span>
                </div>

                <div className="bg-[#F8F2E7] rounded-lg p-4">
                  <p className="text-[#4a4a4a]">{selectedTask.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[#7a7a7a] mb-1">Due Date</p>
                    <p className="font-medium text-[#1a1a1a]">{formatDueDate(selectedTask.dueDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#7a7a7a] mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedTask.status)}
                      <span className="font-medium text-[#1a1a1a] capitalize">{selectedTask.status.replace('-', ' ')}</span>
                    </div>
                  </div>
                </div>

                {selectedTask.relatedTo && (
                  <div>
                    <p className="text-sm text-[#7a7a7a] mb-1">Related To</p>
                    <p className="font-medium text-[#636B56]">{selectedTask.relatedTo}</p>
                  </div>
                )}

                {selectedTask.notes && (
                  <div>
                    <p className="text-sm text-[#7a7a7a] mb-1">Notes</p>
                    <p className="text-[#4a4a4a]">{selectedTask.notes}</p>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t">
                  <button
                    onClick={() => {
                      deleteTask(selectedTask.id);
                    }}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Delete Task
                  </button>
                  <div className="flex gap-2">
                    {selectedTask.status !== 'completed' && (
                      <button
                        onClick={() => {
                          updateTaskStatus(selectedTask.id, 'in-progress');
                          setShowDetails(false);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Start Task
                      </button>
                    )}
                    <button
                      onClick={() => {
                        updateTaskStatus(selectedTask.id, selectedTask.status === 'completed' ? 'pending' : 'completed');
                        setShowDetails(false);
                      }}
                      className="px-4 py-2 bg-[#636B56] text-white rounded-lg hover:bg-[#636B56]/90 transition-colors"
                    >
                      {selectedTask.status === 'completed' ? 'Reopen' : 'Mark Complete'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}