// PipeDrive Migration Interface
import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { 
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  UserGroupIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  DocumentDuplicateIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

export default function PipeDriveMigration() {
  const [apiKey, setApiKey] = useState('03648df313fd7b592cca520407a20f3bd749afa9');
  const [testStatus, setTestStatus] = useState(null);
  const [migrationStatus, setMigrationStatus] = useState('idle'); // idle, testing, migrating, completed, error
  const [migrationProgress, setMigrationProgress] = useState({});
  const [selectedOptions, setSelectedOptions] = useState({
    contacts: true,
    deals: true,
    activities: true,
    notes: true,
    organizations: true,
    customFields: true
  });
  const [accountInfo, setAccountInfo] = useState(null);
  const [migrationReport, setMigrationReport] = useState(null);

  // Test PipeDrive connection
  const testConnection = async () => {
    if (!apiKey) {
      alert('Please enter your PipeDrive API key');
      return;
    }

    setMigrationStatus('testing');
    setTestStatus(null);

    try {
      const response = await fetch('/api/migrate/pipedrive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipedriveApiKey: apiKey,
          action: 'test'
        })
      });

      const data = await response.json();

      if (data.success) {
        setTestStatus('success');
        setAccountInfo(data.accountInfo);
        setMigrationStatus('idle');
      } else {
        setTestStatus('error');
        setMigrationStatus('idle');
        alert(data.error || 'Connection test failed');
      }
    } catch (error) {
      console.error('Test error:', error);
      setTestStatus('error');
      setMigrationStatus('idle');
      alert('Failed to test connection');
    }
  };

  // Start migration
  const startMigration = async () => {
    if (!apiKey) {
      alert('Please enter your PipeDrive API key');
      return;
    }

    if (testStatus !== 'success') {
      alert('Please test your connection first');
      return;
    }

    const confirmed = confirm(
      `This will migrate the following data from PipeDrive to VoiCRM:\n\n` +
      `${selectedOptions.contacts ? '✓ Contacts\n' : ''}` +
      `${selectedOptions.deals ? '✓ Deals\n' : ''}` +
      `${selectedOptions.activities ? '✓ Activities\n' : ''}` +
      `${selectedOptions.notes ? '✓ Notes\n' : ''}` +
      `${selectedOptions.organizations ? '✓ Organizations\n' : ''}` +
      `${selectedOptions.customFields ? '✓ Custom Fields\n' : ''}` +
      `\nContinue?`
    );

    if (!confirmed) return;

    setMigrationStatus('migrating');
    setMigrationProgress({});
    setMigrationReport(null);

    try {
      const response = await fetch('/api/migrate/pipedrive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipedriveApiKey: apiKey,
          action: 'migrate',
          options: selectedOptions
        })
      });

      const data = await response.json();

      if (data.success) {
        setMigrationStatus('completed');
        setMigrationReport(data.report);
        setMigrationProgress(data.report.stats);
      } else {
        setMigrationStatus('error');
        alert(data.error || 'Migration failed');
      }
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationStatus('error');
      alert('Migration failed: ' + error.message);
    }
  };

  // Check migration status periodically
  useEffect(() => {
    let interval;
    
    if (migrationStatus === 'migrating') {
      interval = setInterval(async () => {
        try {
          const response = await fetch('/api/migrate/pipedrive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'status' })
          });

          const data = await response.json();
          if (data.success && data.status) {
            setMigrationProgress(data.status);
          }
        } catch (error) {
          console.error('Status check error:', error);
        }
      }, 2000); // Check every 2 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [migrationStatus]);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#636B56] mb-2" style={{ fontFamily: 'Forum, serif' }}>
            PipeDrive Data Migration
          </h1>
          <p className="text-[#7a7a7a]" style={{ fontFamily: 'Avenir, sans-serif' }}>
            Import your existing data from PipeDrive to VoiCRM
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* API Key Input */}
            <div className="bg-white rounded-xl p-6 border border-[#B28354]/20 shadow-lg">
              <h2 className="text-xl font-semibold text-[#1a1a1a] mb-4" style={{ fontFamily: 'Forum, serif' }}>
                Connection Setup
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4a4a4a] mb-2" style={{ fontFamily: 'Avenir, sans-serif' }}>
                    PipeDrive API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your PipeDrive API key"
                    className="w-full px-4 py-3 border border-[#B28354]/20 rounded-lg focus:ring-2 focus:ring-[#636B56]/20 focus:border-[#636B56] transition-all"
                    style={{ fontFamily: 'Avenir, sans-serif' }}
                  />
                  <p className="mt-2 text-xs text-[#7a7a7a]" style={{ fontFamily: 'Avenir, sans-serif' }}>
                    Find your API key in PipeDrive: Settings → Personal → API
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={testConnection}
                    disabled={migrationStatus !== 'idle' || !apiKey}
                    className="px-6 py-3 bg-gradient-to-r from-[#636B56] to-[#864936] text-[#F8F2E7] rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{ fontFamily: 'Avenir, sans-serif' }}
                  >
                    {migrationStatus === 'testing' ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <CloudArrowUpIcon className="h-5 w-5" />
                        Test Connection
                      </>
                    )}
                  </button>

                  {testStatus === 'success' && (
                    <div className="flex items-center gap-2 text-[#636B56]">
                      <CheckCircleIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">Connected</span>
                    </div>
                  )}

                  {testStatus === 'error' && (
                    <div className="flex items-center gap-2 text-[#864936]">
                      <ExclamationCircleIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">Failed</span>
                    </div>
                  )}
                </div>

                {accountInfo && (
                  <div className="mt-4 p-4 bg-[#636B56]/5 rounded-lg">
                    <p className="text-sm text-[#4a4a4a]" style={{ fontFamily: 'Avenir, sans-serif' }}>
                      <span className="font-semibold">Company:</span> {accountInfo.companyName || 'N/A'}
                    </p>
                    <p className="text-sm text-[#4a4a4a]" style={{ fontFamily: 'Avenir, sans-serif' }}>
                      <span className="font-semibold">Total Contacts:</span> {accountInfo.totalContacts?.toLocaleString() || 0}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Migration Options */}
            <div className="bg-white rounded-xl p-6 border border-[#B28354]/20 shadow-lg">
              <h2 className="text-xl font-semibold text-[#1a1a1a] mb-4" style={{ fontFamily: 'Forum, serif' }}>
                Data to Migrate
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'contacts', label: 'Contacts', icon: UserGroupIcon },
                  { key: 'deals', label: 'Deals', icon: BriefcaseIcon },
                  { key: 'activities', label: 'Activities', icon: CalendarDaysIcon },
                  { key: 'notes', label: 'Notes', icon: DocumentTextIcon },
                  { key: 'organizations', label: 'Organizations', icon: BuildingOfficeIcon },
                  { key: 'customFields', label: 'Custom Fields', icon: DocumentDuplicateIcon }
                ].map(({ key, label, icon: Icon }) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 p-3 border border-[#B28354]/20 rounded-lg hover:bg-[#636B56]/5 cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={selectedOptions[key]}
                      onChange={(e) => setSelectedOptions({
                        ...selectedOptions,
                        [key]: e.target.checked
                      })}
                      className="h-5 w-5 text-[#636B56] rounded border-[#B28354]/30 focus:ring-[#636B56]/20"
                    />
                    <Icon className="h-5 w-5 text-[#7a7a7a]" />
                    <span className="text-sm font-medium text-[#4a4a4a]" style={{ fontFamily: 'Avenir, sans-serif' }}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>

              <button
                onClick={startMigration}
                disabled={migrationStatus !== 'idle' || testStatus !== 'success'}
                className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-[#B28354] to-[#864936] text-[#F8F2E7] rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ fontFamily: 'Avenir, sans-serif' }}
              >
                {migrationStatus === 'migrating' ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    Migrating Data...
                  </>
                ) : migrationStatus === 'completed' ? (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    Migration Completed
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="h-5 w-5" />
                    Start Migration
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column - Progress & Stats */}
          <div className="space-y-6">
            {/* Migration Progress */}
            {(migrationStatus === 'migrating' || migrationStatus === 'completed') && (
              <div className="bg-white rounded-xl p-6 border border-[#B28354]/20 shadow-lg">
                <h2 className="text-xl font-semibold text-[#1a1a1a] mb-4" style={{ fontFamily: 'Forum, serif' }}>
                  Migration Progress
                </h2>

                <div className="space-y-4">
                  {Object.keys(migrationProgress).map((entity) => {
                    const stats = migrationProgress[entity];
                    const percentage = stats.total > 0 
                      ? Math.round((stats.migrated / stats.total) * 100) 
                      : 0;

                    return (
                      <div key={entity}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize text-[#4a4a4a] font-medium">
                            {entity}
                          </span>
                          <span className="text-[#7a7a7a]">
                            {stats.migrated || 0} / {stats.total || 0}
                          </span>
                        </div>
                        <div className="w-full bg-[#F8F2E7] rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-[#636B56] to-[#864936] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        {stats.failed > 0 && (
                          <p className="text-xs text-[#864936] mt-1">
                            {stats.failed} failed
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Migration Report */}
            {migrationReport && (
              <div className="bg-white rounded-xl p-6 border border-[#B28354]/20 shadow-lg">
                <h2 className="text-xl font-semibold text-[#1a1a1a] mb-4" style={{ fontFamily: 'Forum, serif' }}>
                  Migration Report
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#7a7a7a]">Start Time:</span>
                    <span className="text-[#4a4a4a] font-medium">
                      {new Date(migrationReport.startTime).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#7a7a7a]">End Time:</span>
                    <span className="text-[#4a4a4a] font-medium">
                      {new Date(migrationReport.endTime).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#7a7a7a]">Duration:</span>
                    <span className="text-[#4a4a4a] font-medium">
                      {migrationReport.duration} seconds
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#7a7a7a]">Status:</span>
                    <span className={`font-medium ${migrationReport.success ? 'text-[#636B56]' : 'text-[#864936]'}`}>
                      {migrationReport.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                </div>

                {migrationReport.success && (
                  <div className="mt-4 p-3 bg-[#636B56]/10 rounded-lg">
                    <p className="text-sm text-[#636B56] font-medium">
                      ✓ All data successfully migrated to VoiCRM
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            <div className="bg-[#F8F2E7] rounded-xl p-6 border border-[#B28354]/20">
              <h3 className="text-lg font-semibold text-[#1a1a1a] mb-3" style={{ fontFamily: 'Forum, serif' }}>
                How to Get Your API Key
              </h3>
              <ol className="space-y-2 text-sm text-[#4a4a4a]" style={{ fontFamily: 'Avenir, sans-serif' }}>
                <li>1. Log in to your PipeDrive account</li>
                <li>2. Go to Settings (gear icon)</li>
                <li>3. Navigate to Personal → API</li>
                <li>4. Copy your API token</li>
                <li>5. Paste it in the field above</li>
              </ol>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-[#636B56]/5 to-[#B28354]/5 rounded-xl p-6 border border-[#B28354]/20">
              <h3 className="text-lg font-semibold text-[#1a1a1a] mb-3" style={{ fontFamily: 'Forum, serif' }}>
                Migration Tips
              </h3>
              <ul className="space-y-2 text-sm text-[#4a4a4a]" style={{ fontFamily: 'Avenir, sans-serif' }}>
                <li>• Migration time depends on data size</li>
                <li>• Duplicate contacts are automatically updated</li>
                <li>• Australian phone numbers are formatted</li>
                <li>• Custom fields are preserved</li>
                <li>• You can run migration multiple times</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}