// Property Analysis Dashboard
import { useState } from 'react';
import Layout from '../components/Layout';
import { 
  HomeIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
  FunnelIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function PropertyAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(100);
  const [filter, setFilter] = useState('all');

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/analyze-properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'analyze',
          limit: parseInt(limit)
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setReport(data.report);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportResults = async () => {
    try {
      const response = await fetch('/api/analyze-properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export' })
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'property-analysis.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Export failed: ' + err.message);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getFilteredResults = () => {
    if (!report?.results) return [];
    
    switch (filter) {
      case 'successful':
        return report.results.filter(r => r.analysis !== null);
      case 'failed':
        return report.results.filter(r => r.analysis === null);
      case 'high-value':
        return report.results.filter(r => r.analysis?.estimatedValue > 1000000);
      case 'growth':
        return report.results.filter(r => 
          r.analysis?.insights?.some(i => i.type === 'strong_growth')
        );
      default:
        return report.results;
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <HomeIcon className="h-10 w-10 text-[#636B56]" />
            <div>
              <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
                Property Valuation Analysis
              </h1>
              <p className="text-[#7a7a7a]">
                Automated property search and valuation across realestate.com.au, Domain, Homely & OnTheHouse
              </p>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        {!report && (
          <div className="bg-white rounded-xl p-8 border border-[#B28354]/20 shadow-lg mb-8">
            <h2 className="text-xl font-bold text-[#636B56] mb-6">Analysis Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#4a4a4a] mb-2">
                  Number of Contacts to Analyze
                </label>
                <select
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="w-full px-4 py-2 border border-[#B28354]/30 rounded-lg focus:outline-none focus:border-[#636B56]"
                >
                  <option value="50">First 50 contacts</option>
                  <option value="100">First 100 contacts</option>
                  <option value="250">First 250 contacts</option>
                  <option value="500">First 500 contacts</option>
                  <option value="1000">First 1000 contacts</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#4a4a4a] mb-2">
                  Exclusions
                </label>
                <div className="text-sm text-[#7a7a7a] space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    <span>Excludes "inquiry" names</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    <span>Excludes contacts without addresses</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#4a4a4a] mb-2">
                  Data Sources
                </label>
                <div className="text-sm text-[#7a7a7a] space-y-1">
                  <div className="flex items-center gap-2">
                    <MagnifyingGlassIcon className="h-4 w-4 text-[#636B56]" />
                    <span>realestate.com.au (35%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MagnifyingGlassIcon className="h-4 w-4 text-[#636B56]" />
                    <span>domain.com.au (35%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MagnifyingGlassIcon className="h-4 w-4 text-[#636B56]" />
                    <span>homely.com.au (15%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MagnifyingGlassIcon className="h-4 w-4 text-[#636B56]" />
                    <span>onthehouse.com.au (15%)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#F8F2E7] rounded-lg p-4 mb-6">
              <p className="text-sm text-[#4a4a4a]">
                <strong>Note:</strong> This analysis will search each valid property address across multiple property websites
                to provide comprehensive valuation estimates and market insights. The process may take several minutes depending
                on the number of contacts selected.
              </p>
            </div>

            <button
              onClick={startAnalysis}
              disabled={isAnalyzing}
              className="w-full py-3 bg-gradient-to-r from-[#636B56] to-[#864936] text-white rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isAnalyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  Analyzing Properties...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <SparklesIcon className="h-5 w-5" />
                  Start Property Analysis
                </span>
              )}
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {report && (
          <>
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg p-4 border border-[#B28354]/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#7a7a7a]">Properties Analyzed</span>
                  <HomeIcon className="h-5 w-5 text-[#636B56]" />
                </div>
                <p className="text-2xl font-bold text-[#636B56]">{report.summary.successful}</p>
                <p className="text-xs text-[#7a7a7a] mt-1">
                  {report.summary.failed} failed
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-[#B28354]/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#7a7a7a]">Average Value</span>
                  <CurrencyDollarIcon className="h-5 w-5 text-[#864936]" />
                </div>
                <p className="text-2xl font-bold text-[#864936]">
                  {formatCurrency(report.summary.averageValue)}
                </p>
                <p className="text-xs text-[#7a7a7a] mt-1">
                  Range: {formatCurrency(report.summary.valueRange.min)} - {formatCurrency(report.summary.valueRange.max)}
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-[#B28354]/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#7a7a7a]">High-Value Properties</span>
                  <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {report.summary.highValueProperties.length}
                </p>
                <p className="text-xs text-[#7a7a7a] mt-1">
                  Over $1M
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-[#B28354]/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#7a7a7a]">Growth Opportunities</span>
                  <ChartBarIcon className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {report.summary.growthOpportunities.length}
                </p>
                <p className="text-xs text-[#7a7a7a] mt-1">
                  Strong appreciation
                </p>
              </div>
            </div>

            {/* Recommendations */}
            {report.recommendations && report.recommendations.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-[#B28354]/20 shadow-lg mb-8">
                <h2 className="text-xl font-bold text-[#636B56] mb-4">AI Recommendations</h2>
                <div className="space-y-4">
                  {report.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-[#F8F2E7] rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        rec.priority === 'high' ? 'bg-red-500' :
                        rec.priority === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#1a1a1a]">{rec.title}</h3>
                        <p className="text-sm text-[#4a4a4a] mt-1">{rec.description}</p>
                        {rec.contacts && (
                          <div className="mt-2 text-xs text-[#7a7a7a]">
                            Focus contacts: {rec.contacts.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filter and Export Controls */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'all' 
                      ? 'bg-[#636B56] text-white' 
                      : 'bg-white border border-[#636B56] text-[#636B56] hover:bg-[#636B56]/5'
                  }`}
                >
                  All ({report.results.length})
                </button>
                <button
                  onClick={() => setFilter('successful')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'successful' 
                      ? 'bg-[#636B56] text-white' 
                      : 'bg-white border border-[#636B56] text-[#636B56] hover:bg-[#636B56]/5'
                  }`}
                >
                  Successful ({report.summary.successful})
                </button>
                <button
                  onClick={() => setFilter('high-value')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'high-value' 
                      ? 'bg-[#636B56] text-white' 
                      : 'bg-white border border-[#636B56] text-[#636B56] hover:bg-[#636B56]/5'
                  }`}
                >
                  High Value ({report.summary.highValueProperties.length})
                </button>
                <button
                  onClick={() => setFilter('growth')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'growth' 
                      ? 'bg-[#636B56] text-white' 
                      : 'bg-white border border-[#636B56] text-[#636B56] hover:bg-[#636B56]/5'
                  }`}
                >
                  Growth ({report.summary.growthOpportunities.length})
                </button>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={exportResults}
                  className="px-4 py-2 bg-[#864936] text-white rounded-lg font-medium hover:bg-[#864936]/90 transition-colors flex items-center gap-2"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  Export CSV
                </button>
                <button
                  onClick={() => setReport(null)}
                  className="px-4 py-2 bg-white border border-[#636B56] text-[#636B56] rounded-lg font-medium hover:bg-[#636B56]/5 transition-colors"
                >
                  New Analysis
                </button>
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-xl border border-[#B28354]/20 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F8F2E7]">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#4a4a4a]">Contact</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#4a4a4a]">Owner</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#4a4a4a]">Address</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#4a4a4a]">Est. Value</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#4a4a4a]">Range</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#4a4a4a]">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#4a4a4a]">Confidence</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#4a4a4a]">Insights</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredResults().slice(0, 50).map((result, index) => (
                      <tr key={index} className="border-b border-[#F8F2E7] hover:bg-[#F8F2E7]/30 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-medium text-[#1a1a1a] text-sm">{result.contactName}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-[#636B56]">{result.contactOwner}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <MapPinIcon className="h-4 w-4 text-[#7a7a7a]" />
                            <span className="text-sm text-[#4a4a4a]">{result.address}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {result.analysis ? (
                            <span className="font-bold text-[#864936]">
                              {formatCurrency(result.analysis.estimatedValue)}
                            </span>
                          ) : (
                            <span className="text-[#7a7a7a] text-sm">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {result.analysis?.valuationRange ? (
                            <span className="text-xs text-[#7a7a7a]">
                              {formatCurrency(result.analysis.valuationRange.min)} -
                              {formatCurrency(result.analysis.valuationRange.max)}
                            </span>
                          ) : (
                            <span className="text-[#7a7a7a] text-sm">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-[#4a4a4a]">
                            {result.analysis?.propertyDetails?.propertyType || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {result.analysis ? (
                            <div className="flex items-center gap-2">
                              <div className="w-12 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{ width: `${result.analysis.confidence}%` }}
                                />
                              </div>
                              <span className="text-xs text-[#7a7a7a]">
                                {result.analysis.confidence}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#7a7a7a] text-sm">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {result.analysis?.insights && result.analysis.insights.length > 0 ? (
                            <div className="space-y-1">
                              {result.analysis.insights.slice(0, 2).map((insight, i) => (
                                <span key={i} className={`text-xs px-2 py-1 rounded-full inline-block ${
                                  insight.importance === 'high' 
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {insight.type.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          ) : result.error ? (
                            <span className="text-xs text-red-600">{result.error}</span>
                          ) : (
                            <span className="text-[#7a7a7a] text-sm">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {getFilteredResults().length > 50 && (
                <div className="p-4 bg-[#F8F2E7] text-center">
                  <p className="text-sm text-[#7a7a7a]">
                    Showing 50 of {getFilteredResults().length} results. Export to CSV to see all.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}