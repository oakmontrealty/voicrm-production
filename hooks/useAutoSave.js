import { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';

/**
 * Custom hook for auto-saving form data
 * @param {Object} data - The form data to auto-save
 * @param {Function} onSave - Callback function to save the data
 * @param {Object} options - Configuration options
 * @param {number} options.delay - Debounce delay in milliseconds (default: 1000)
 * @param {boolean} options.enabled - Whether auto-save is enabled (default: true)
 * @param {string} options.storageKey - Local storage key for backup (optional)
 */
export default function useAutoSave(data, onSave, options = {}) {
  const {
    delay = 1000,
    enabled = true,
    storageKey = null,
    onSuccess = null,
    onError = null
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const previousDataRef = useRef();
  const saveTimeoutRef = useRef();
  const isFirstRender = useRef(true);

  // Create debounced save function
  const debouncedSave = useRef(
    debounce(async (dataToSave) => {
      if (!enabled) return;

      setIsSaving(true);
      setSaveError(null);

      try {
        // Save to local storage first (if enabled)
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify({
            data: dataToSave,
            timestamp: new Date().toISOString()
          }));
        }

        // Call the save function
        await onSave(dataToSave);

        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        
        if (onSuccess) {
          onSuccess(dataToSave);
        }

        // Clear local storage backup after successful save
        if (storageKey) {
          localStorage.removeItem(`${storageKey}_backup`);
        }
      } catch (error) {
        console.error('Auto-save error:', error);
        setSaveError(error.message);
        
        // Keep backup in local storage on error
        if (storageKey) {
          localStorage.setItem(`${storageKey}_backup`, JSON.stringify({
            data: dataToSave,
            timestamp: new Date().toISOString(),
            error: error.message
          }));
        }
        
        if (onError) {
          onError(error);
        }
      } finally {
        setIsSaving(false);
      }
    }, delay)
  ).current;

  // Load from local storage on mount
  useEffect(() => {
    if (storageKey && isFirstRender.current) {
      const stored = localStorage.getItem(storageKey);
      const backup = localStorage.getItem(`${storageKey}_backup`);
      
      if (backup) {
        const { data: backupData, timestamp } = JSON.parse(backup);
        console.log(`Restored unsaved data from ${timestamp}`);
        // You might want to merge this with current data or prompt user
      }
    }
    isFirstRender.current = false;
  }, [storageKey]);

  // Monitor data changes and trigger auto-save
  useEffect(() => {
    if (!enabled) return;

    // Skip first render
    if (previousDataRef.current === undefined) {
      previousDataRef.current = data;
      return;
    }

    // Check if data has actually changed
    const hasChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);
    
    if (hasChanged) {
      setHasUnsavedChanges(true);
      debouncedSave(data);
      previousDataRef.current = data;
    }
  }, [data, enabled, debouncedSave]);

  // Save on unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      if (hasUnsavedChanges && enabled) {
        // Cancel debounced save
        debouncedSave.cancel();
        
        // Save immediately
        if (storageKey) {
          localStorage.setItem(`${storageKey}_backup`, JSON.stringify({
            data: previousDataRef.current,
            timestamp: new Date().toISOString(),
            reason: 'unmount'
          }));
        }
      }
    };
  }, [hasUnsavedChanges, enabled, storageKey, debouncedSave]);

  // Handle beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges && enabled) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, enabled]);

  // Manual save function
  const saveNow = async () => {
    debouncedSave.cancel();
    await debouncedSave(data);
  };

  // Restore from backup
  const restoreFromBackup = () => {
    if (!storageKey) return null;
    
    const backup = localStorage.getItem(`${storageKey}_backup`);
    if (backup) {
      const { data } = JSON.parse(backup);
      return data;
    }
    return null;
  };

  // Clear backup
  const clearBackup = () => {
    if (storageKey) {
      localStorage.removeItem(`${storageKey}_backup`);
    }
  };

  return {
    isSaving,
    lastSaved,
    saveError,
    hasUnsavedChanges,
    saveNow,
    restoreFromBackup,
    clearBackup,
    status: isSaving ? 'saving' : saveError ? 'error' : hasUnsavedChanges ? 'unsaved' : 'saved'
  };
}

/**
 * Auto-save status indicator component
 */
export function AutoSaveIndicator({ status, lastSaved, error }) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'saving':
        return (
          <div className="flex items-center text-blue-600">
            <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Saving...
          </div>
        );
      
      case 'saved':
        return (
          <div className="flex items-center text-green-600">
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved {lastSaved && `at ${new Date(lastSaved).toLocaleTimeString()}`}
          </div>
        );
      
      case 'unsaved':
        return (
          <div className="flex items-center text-yellow-600">
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Unsaved changes
          </div>
        );
      
      case 'error':
        return (
          <div className="flex items-center text-red-600">
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error || 'Save failed'}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="text-sm">
      {getStatusDisplay()}
    </div>
  );
}