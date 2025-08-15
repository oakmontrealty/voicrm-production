import { PhoneIcon, EnvelopeIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

export default function LeadCard({ lead, onClick }) {
  const getStatusColor = (status) => {
    const colors = {
      'New': 'bg-blue-100 text-blue-800',
      'Contacted': 'bg-yellow-100 text-yellow-800',
      'Qualified': 'bg-green-100 text-green-800',
      'Lost': 'bg-red-100 text-red-800',
      'Converted': 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'High': 'text-red-600',
      'Medium': 'text-yellow-600',
      'Low': 'text-green-600',
    };
    return colors[priority] || 'text-gray-600';
  };

  return (
    <div 
      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onClick(lead)}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{lead.name}</h3>
          <p className="text-sm text-gray-500">{lead.company}</p>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
            {lead.status}
          </span>
          <span className={`text-xs font-medium ${getPriorityColor(lead.priority)}`}>
            {lead.priority} Priority
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <EnvelopeIcon className="h-4 w-4 mr-2" />
          {lead.email}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <PhoneIcon className="h-4 w-4 mr-2" />
          {lead.phone}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <CurrencyDollarIcon className="h-4 w-4 mr-2" />
          ${lead.value?.toLocaleString() || '0'}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Source: <span className="font-medium text-gray-700">{lead.source}</span>
        </p>
        <p className="text-sm text-gray-500">
          Assigned to: <span className="font-medium text-gray-700">{lead.assignedTo || 'Unassigned'}</span>
        </p>
      </div>
    </div>
  );
}