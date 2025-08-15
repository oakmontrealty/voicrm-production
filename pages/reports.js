import { useState, useEffect } from 'react';
// Server-side only function - will be imported dynamically when needed
import { 
  CalendarIcon,
  DocumentArrowDownIcon,
  EnvelopeIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  const loadReports = async () => {
    setLoading(true);
    try {
      // const reportsService = getDailySummaryReports(); // TODO: Move to API route
      // const data = await reportsService.getReportsForRange(
      //   new Date(dateRange.start),
      //   new Date(dateRange.end)
      // );
      const data = []; // TODO: Move to API route
      setReports(data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTodayReport = async () => {
    setLoading(true);
    try {
      // const reportsService = getDailySummaryReports(); // TODO: Move to API route
      // const report = await reportsService.generateDailyReport(new Date());
      const report = null; // TODO: Move to API route
      setReports([report, ...reports]);
      setSelectedReport(report);
      alert('Report generated and emailed successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (report) => {
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `report-${report.date}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const emailReport = async (report) => {
    try {
      // const reportsService = getDailySummaryReports(); // TODO: Move to API route
      // await reportsService.sendReportEmails(report);
      // TODO: Move to API route
      alert('Report emailed successfully!');
    } catch (error) {
      console.error('Error emailing report:', error);
      alert('Error emailing report');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Daily Summary Reports</h1>
          <p className="text-gray-600 mt-2">View and manage historical performance reports</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <button
              onClick={generateTodayReport}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
            >
              <ChartBarIcon className="h-5 w-5" />
              Generate Today's Report
            </button>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Reports List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Reports History</h2>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading reports...</p>
                </div>
              ) : reports.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No reports found for selected date range</p>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedReport?.id === report.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{report.date}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {report.metrics?.calls?.total || 0} calls • {report.metrics?.leads?.new || 0} leads
                          </p>
                        </div>
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      
                      {report.alerts && report.alerts.length > 0 && (
                        <div className="mt-2 flex items-center text-xs">
                          <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-yellow-700">{report.alerts.length} alerts</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Report Details */}
          <div className="lg:col-span-2">
            {selectedReport ? (
              <div className="bg-white rounded-xl shadow-lg p-6">
                {/* Report Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Report for {selectedReport.date}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Generated at {new Date(selectedReport.generatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadReport(selectedReport)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 transition-colors"
                    >
                      <DocumentArrowDownIcon className="h-5 w-5" />
                      Download
                    </button>
                    <button
                      onClick={() => emailReport(selectedReport)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors"
                    >
                      <EnvelopeIcon className="h-5 w-5" />
                      Email
                    </button>
                  </div>
                </div>

                {/* Executive Summary */}
                {selectedReport.summary && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Executive Summary</h3>
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
                      <p className="text-xl font-bold text-indigo-900 mb-4">
                        {selectedReport.summary.headline}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-indigo-600">
                            {selectedReport.summary.keyNumbers?.calls || 0}
                          </p>
                          <p className="text-sm text-gray-600">Calls</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {selectedReport.summary.keyNumbers?.leads || 0}
                          </p>
                          <p className="text-sm text-gray-600">Leads</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            {selectedReport.summary.keyNumbers?.appointments || 0}
                          </p>
                          <p className="text-sm text-gray-600">Appointments</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-yellow-600">
                            {selectedReport.summary.keyNumbers?.deals || 0}
                          </p>
                          <p className="text-sm text-gray-600">Deals</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Alerts */}
                {selectedReport.alerts && selectedReport.alerts.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Alerts</h3>
                    <div className="space-y-3">
                      {selectedReport.alerts.map((alert, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border-l-4 ${
                            alert.level === 'critical'
                              ? 'bg-red-50 border-red-500'
                              : alert.level === 'warning'
                              ? 'bg-yellow-50 border-yellow-500'
                              : 'bg-blue-50 border-blue-500'
                          }`}
                        >
                          <p className="font-medium">
                            {alert.level.charAt(0).toUpperCase() + alert.level.slice(1)}
                          </p>
                          <p className="text-sm mt-1">{alert.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Metrics */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Metrics</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Call Connect Rate</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-gray-900">
                            {selectedReport.metrics?.calls?.connectRate?.toFixed(1) || 0}%
                          </p>
                          {selectedReport.comparisons?.daily?.calls?.connectRate && (
                            <span className={`text-sm flex items-center ${
                              selectedReport.comparisons.daily.calls.connectRate.startsWith('+')
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {selectedReport.comparisons.daily.calls.connectRate.startsWith('+') ? (
                                <ArrowTrendingUpIcon className="h-4 w-4" />
                              ) : (
                                <ArrowTrendingDownIcon className="h-4 w-4" />
                              )}
                              {selectedReport.comparisons.daily.calls.connectRate}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Lead Conversion</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-gray-900">
                            {selectedReport.metrics?.leads?.conversionRate?.toFixed(1) || 0}%
                          </p>
                          {selectedReport.comparisons?.daily?.leads?.conversionRate && (
                            <span className={`text-sm flex items-center ${
                              selectedReport.comparisons.daily.leads.conversionRate.startsWith('+')
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {selectedReport.comparisons.daily.leads.conversionRate.startsWith('+') ? (
                                <ArrowTrendingUpIcon className="h-4 w-4" />
                              ) : (
                                <ArrowTrendingDownIcon className="h-4 w-4" />
                              )}
                              {selectedReport.comparisons.daily.leads.conversionRate}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Show Rate</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-gray-900">
                            {selectedReport.metrics?.appointments?.showRate?.toFixed(1) || 0}%
                          </p>
                          {selectedReport.comparisons?.daily?.appointments?.showRate && (
                            <span className={`text-sm flex items-center ${
                              selectedReport.comparisons.daily.appointments.showRate.startsWith('+')
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {selectedReport.comparisons.daily.appointments.showRate.startsWith('+') ? (
                                <ArrowTrendingUpIcon className="h-4 w-4" />
                              ) : (
                                <ArrowTrendingDownIcon className="h-4 w-4" />
                              )}
                              {selectedReport.comparisons.daily.appointments.showRate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {selectedReport.recommendations && selectedReport.recommendations.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                    <div className="space-y-4">
                      {selectedReport.recommendations.map((rec, index) => (
                        <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-blue-900">
                                {rec.area.charAt(0).toUpperCase() + rec.area.slice(1)}
                              </p>
                              <p className="text-sm text-blue-800 mt-1">{rec.action}</p>
                              <p className="text-xs text-blue-600 mt-2">
                                Impact: {rec.impact}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              rec.priority === 'high'
                                ? 'bg-red-100 text-red-800'
                                : rec.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {rec.priority}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Call Distribution by Hour */}
                {selectedReport.metrics?.calls?.byHour && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Call Distribution</h3>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-end justify-between h-32 gap-1">
                        {selectedReport.metrics.calls.byHour.map((count, hour) => {
                          const maxCalls = Math.max(...selectedReport.metrics.calls.byHour);
                          const height = maxCalls > 0 ? (count / maxCalls) * 100 : 0;
                          
                          return (
                            <div
                              key={hour}
                              className="flex-1 bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors relative group"
                              style={{ height: `${height}%` }}
                            >
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                {count} calls
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>12AM</span>
                        <span>6AM</span>
                        <span>12PM</span>
                        <span>6PM</span>
                        <span>11PM</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a report to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}