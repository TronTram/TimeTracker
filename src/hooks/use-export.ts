/**
 * Export Hook
 * Hook for managing export operations and status
 */

import { useState, useCallback } from 'react';
import { ExportOptions, ExportProgress, ExportResult, ExportFormat, ExportData } from '@/types/export';
import { ExportService } from '@/services/export-service';
import { exportAnalyticsData } from '@/actions/analytics-actions';
import { exportSessionsData } from '@/actions/session-actions';
import { toast } from 'sonner';

interface UseExportOptions {
  onSuccess?: (result: ExportResult) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: ExportProgress) => void;
}

interface UseExportReturn {
  isExporting: boolean;
  progress: ExportProgress | null;
  exportData: (options: ExportOptions) => Promise<void>;
  downloadSample: (format: ExportFormat) => void;
  cancelExport: () => void;
  estimateFileSize: (options: ExportOptions) => Promise<number>;
  canExport: (options: ExportOptions) => Promise<{ allowed: boolean; reason?: string }>;
}

export function useExport(options: UseExportOptions = {}): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [currentController, setCurrentController] = useState<AbortController | null>(null);

  const { onSuccess, onError, onProgress } = options;

  const updateProgress = useCallback((newProgress: ExportProgress) => {
    setProgress(newProgress);
    onProgress?.(newProgress);
  }, [onProgress]);

  const exportData = useCallback(async (exportOptions: ExportOptions) => {
    try {
      setIsExporting(true);
      const controller = new AbortController();
      setCurrentController(controller);

      // Phase 1: Preparing
      updateProgress({
        phase: 'preparing',
        percentage: 10,
        message: 'Preparing export...',
      });

      // Validate options
      const validation = await validateExportOptions(exportOptions);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Phase 2: Processing
      updateProgress({
        phase: 'processing',
        percentage: 30,
        message: 'Fetching data...',
      });

      // Fetch data based on options
      const exportData = await fetchExportData(exportOptions);

      if (controller.signal.aborted) {
        throw new Error('Export cancelled');
      }

      // Phase 3: Generating
      updateProgress({
        phase: 'generating',
        percentage: 70,
        message: 'Generating file...',
      });

      // Generate export file
      const result = await ExportService.exportData(
        exportData,
        exportOptions.format,
        exportOptions.filename
      );

      if (!result.success) {
        throw new Error(result.error || 'Export failed');
      }

      if (controller.signal.aborted) {
        throw new Error('Export cancelled');
      }

      // Phase 4: Complete
      updateProgress({
        phase: 'complete',
        percentage: 100,
        message: 'Export complete!',
      });

      // Download the file
      if (result.data && result.filename) {
        ExportService.downloadExport(result.data, result.filename, exportOptions.format);
      }

      onSuccess?.(result);
      toast.success(`Export completed: ${result.filename}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      
      updateProgress({
        phase: 'error',
        percentage: 0,
        message: 'Export failed',
        error: errorMessage,
      });

      onError?.(errorMessage);
      
      if (errorMessage !== 'Export cancelled') {
        toast.error(`Export failed: ${errorMessage}`);
      }
    } finally {
      setIsExporting(false);
      setCurrentController(null);
      
      // Clear progress after a delay
      setTimeout(() => {
        setProgress(null);
      }, 3000);
    }
  }, [onSuccess, onError, updateProgress]);

  const downloadSample = useCallback((format: ExportFormat) => {
    try {
      const sampleData = ExportService.createSampleData();
      const filename = `sample-export.${format}`;
      
      ExportService.exportData(sampleData, format, filename).then(result => {
        if (result.success && result.data) {
          ExportService.downloadExport(result.data, filename, format);
          toast.success('Sample export downloaded');
        } else {
          toast.error('Failed to generate sample export');
        }
      });
    } catch (error) {
      toast.error('Failed to download sample');
    }
  }, []);

  const cancelExport = useCallback(() => {
    if (currentController) {
      currentController.abort();
      setIsExporting(false);
      setProgress(null);
      setCurrentController(null);
      toast.info('Export cancelled');
    }
  }, [currentController]);

  const estimateFileSize = useCallback(async (exportOptions: ExportOptions): Promise<number> => {
    try {
      const exportData = await fetchExportData(exportOptions);
      return ExportService.estimateFileSize(exportData, exportOptions.format);
    } catch (error) {
      return 0;
    }
  }, []);

  const canExport = useCallback(async (exportOptions: ExportOptions): Promise<{ allowed: boolean; reason?: string }> => {
    try {
      const validation = await validateExportOptions(exportOptions);
      if (!validation.valid) {
        return { allowed: false, reason: validation.error };
      }

      const exportData = await fetchExportData(exportOptions);
      return ExportService.canExport(exportData, exportOptions.format);
    } catch (error) {
      return { 
        allowed: false, 
        reason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  return {
    isExporting,
    progress,
    exportData,
    downloadSample,
    cancelExport,
    estimateFileSize,
    canExport,
  };
}

/**
 * Validate export options
 */
async function validateExportOptions(options: ExportOptions): Promise<{ valid: boolean; error?: string }> {
  // Check date range
  if (options.dateTo < options.dateFrom) {
    return { valid: false, error: 'End date must be after start date' };
  }

  // Check date range size
  const daysDiff = Math.ceil((options.dateTo.getTime() - options.dateFrom.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > 365) {
    return { valid: false, error: 'Date range cannot exceed 1 year' };
  }

  // Check if at least one data type is selected
  if (!options.includeSessions && !options.includeProjects && !options.includeAnalytics) {
    return { valid: false, error: 'At least one data type must be selected' };
  }

  return { valid: true };
}

/**
 * Fetch export data based on options
 */
async function fetchExportData(options: ExportOptions): Promise<ExportData> {
  const promises: Promise<any>[] = [];
  
  // Prepare parameters
  const params = {
    dateFrom: options.dateFrom.toISOString().split('T')[0] || options.dateFrom.toDateString(),
    dateTo: options.dateTo.toISOString().split('T')[0] || options.dateTo.toDateString(),
  };

  // Fetch sessions data
  if (options.includeSessions) {
    promises.push(
      exportSessionsData({
        format: 'json',
        ...params,
      })
    );
  } else {
    promises.push(Promise.resolve({ success: true, data: [] }));
  }

  // Fetch analytics data
  if (options.includeAnalytics) {
    promises.push(
      exportAnalyticsData({
        timeRange: 'custom',
        ...params,
      })
    );
  } else {
    promises.push(Promise.resolve({ success: true, data: null }));
  }

  // Fetch projects data (this would need to be implemented in project actions)
  const projectsData = options.includeProjects ? [] : [];

  try {
    const [sessionsResult, analyticsResult] = await Promise.all(promises);

    // Transform data for export
    const exportData: ExportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        dateRange: {
          from: params.dateFrom,
          to: params.dateTo,
        },
        totalRecords: (sessionsResult.data?.length || 0) + projectsData.length,
        format: options.format,
        userId: 'current-user', // This should come from auth context
      },
      sessions: sessionsResult.success && sessionsResult.data ? 
        ExportService.transformSessionsForExport(sessionsResult.data) : undefined,
      projects: projectsData.length > 0 ? 
        ExportService.transformProjectsForExport(projectsData) : undefined,
      analytics: analyticsResult.success && analyticsResult.data ? 
        ExportService.transformAnalyticsForExport(analyticsResult.data) : undefined,
    };

    return exportData;
  } catch (error) {
    throw new Error(`Failed to fetch export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get export format display name
 */
export function getFormatDisplayName(format: ExportFormat): string {
  switch (format) {
    case 'csv':
      return 'CSV (Comma Separated Values)';
    case 'json':
      return 'JSON (JavaScript Object Notation)';
    case 'pdf':
      return 'PDF (Portable Document Format)';
    default:
      return String(format).toUpperCase();
  }
}

/**
 * Get export format icon
 */
export function getFormatIcon(format: ExportFormat): string {
  switch (format) {
    case 'csv':
      return '📊';
    case 'json':
      return '📄';
    case 'pdf':
      return '📋';
    default:
      return '📁';
  }
}
