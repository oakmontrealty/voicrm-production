export default function StatsCard({ title, value, icon: Icon, change, changeType }) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">{value}</div>
                  {change && (
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                      changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {changeType === 'increase' ? '↑' : '↓'} {change}
                    </div>
                  )}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}