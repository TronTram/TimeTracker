/**
 * Export Service
 * Business logic for data export and formatting
 */

import { 
  ExportData, 
  ExportOptions, 
  ExportRequest, 
  ExportResult, 
  SessionExportData, 
  ProjectExportData, 
  AnalyticsExportData,
  ExportFormat,
  EXPORT_LIMITS,
  EXPORT_MIME_TYPES
} from '@/types/export';
import { CSVGenerator } from '@/lib/csv-generator';
import { PDFGenerator } from '@/lib/pdf-generator';
import { formatDuration } from '@/lib/time-utils';

export class ExportService {
  /**
   * Export data in the specified format
   */
  static async exportData(
    data: ExportData,
    format: ExportFormat,
    filename?: string
  ): Promise<ExportResult> {
    try {
      // Validate data size
      const validation = this.validateExportData(data);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Generate filename if not provided
      const exportFilename = filename || this.generateFilename(format);

      let result: Blob | string;
      
      switch (format) {
        case 'csv':
          result = this.exportToCSV(data);
          break;
        case 'json':
          result = this.exportToJSON(data);
          break;
        case 'pdf':
          result = await this.exportToPDF(data);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      return {
        success: true,
        data: result,
        filename: exportFilename,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }

  /**
   * Export to CSV format
   */
  private static exportToCSV(data: ExportData): Blob {
    const csvSections: string[] = [];

    // Add metadata
    csvSections.push('EXPORT METADATA');
    csvSections.push(`Export Date,${data.metadata.exportDate}`);
    csvSections.push(`Date Range,${data.metadata.dateRange.from} to ${data.metadata.dateRange.to}`);
    csvSections.push(`Total Records,${data.metadata.totalRecords}`);
    csvSections.push(`Format,${data.metadata.format}`);
    csvSections.push(''); // Empty line

    // Add sessions data
    if (data.sessions?.length) {
      csvSections.push('SESSIONS DATA');
      csvSections.push(CSVGenerator.generateSessionsCSV(data.sessions));
      csvSections.push(''); // Empty line
    }

    // Add projects data
    if (data.projects?.length) {
      csvSections.push('PROJECTS DATA');
      csvSections.push(CSVGenerator.generateProjectsCSV(data.projects));
      csvSections.push(''); // Empty line
    }

    // Add analytics summary
    if (data.analytics) {
      csvSections.push('ANALYTICS SUMMARY');
      csvSections.push('Metric,Value');
      csvSections.push(`Total Time,${formatDuration(data.analytics.summary.totalTime)}`);
      csvSections.push(`Total Sessions,${data.analytics.summary.totalSessions}`);
      csvSections.push(`Total Projects,${data.analytics.summary.totalProjects}`);
      csvSections.push(`Average Session Length,${formatDuration(data.analytics.summary.averageSessionLength)}`);
      csvSections.push(`Focus Ratio,${data.analytics.productivity.focusRatio.toFixed(1)}%`);
      csvSections.push(''); // Empty line
    }

    const csvContent = csvSections.join('\n');
    return CSVGenerator.createCSVBlob(csvContent);
  }

  /**
   * Export to JSON format
   */
  private static exportToJSON(data: ExportData): Blob {
    const jsonString = JSON.stringify(data, null, 2);
    return new Blob([jsonString], { type: EXPORT_MIME_TYPES.json });
  }

  /**
   * Export to PDF format
   */
  private static async exportToPDF(data: ExportData): Promise<Blob> {
    return await PDFGenerator.generateReport({
      sessions: data.sessions,
      projects: data.projects,
      analytics: data.analytics,
    });
  }

  /**
   * Transform sessions data for export
   */
  static transformSessionsForExport(sessions: any[]): SessionExportData[] {
    return sessions.map(session => ({
      id: session.id,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime?.toISOString(),
      duration: session.duration,
      durationMinutes: Math.round(session.duration / 60),
      durationHours: Math.round(session.duration / 3600 * 100) / 100,
      sessionType: session.sessionType || 'focus',
      isPomodoro: session.isPomodoro || false,
      isCompleted: session.isCompleted || false,
      projectId: session.projectId,
      projectName: session.project?.name,
      projectColor: session.project?.color,
      description: session.description,
      notes: session.notes,
      tags: session.tags || [],
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    }));
  }

  /**
   * Transform projects data for export
   */
  static transformProjectsForExport(projects: any[]): ProjectExportData[] {
    return projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      isActive: project.isActive,
      totalTime: project.totalTime || 0,
      totalTimeMinutes: Math.round((project.totalTime || 0) / 60),
      totalTimeHours: Math.round((project.totalTime || 0) / 3600 * 100) / 100,
      sessionsCount: project.sessionsCount || 0,
      averageSessionLength: project.averageSessionLength || 0,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    }));
  }

  /**
   * Transform analytics data for export
   */
  static transformAnalyticsForExport(analytics: any): AnalyticsExportData {
    return {
      summary: {
        totalTime: analytics.totalTime || 0,
        totalSessions: analytics.totalSessions || 0,
        totalProjects: analytics.totalProjects || 0,
        averageSessionLength: analytics.averageSessionLength || 0,
        mostProductiveDay: analytics.mostProductiveDay || 'No data',
        mostProductiveHour: analytics.mostProductiveHour || 0,
      },
      dailyStats: analytics.dailyStats || [],
      projectBreakdown: analytics.projectBreakdown || [],
      productivity: {
        focusRatio: analytics.productivity?.focusRatio || 0,
        streakData: {
          currentStreak: analytics.productivity?.streakData?.currentStreak || 0,
          longestStreak: analytics.productivity?.streakData?.longestStreak || 0,
        },
      },
    };
  }

  /**
   * Download exported data
   */
  static downloadExport(data: Blob | string, filename: string, format: ExportFormat): void {
    let blob: Blob;
    
    if (typeof data === 'string') {
      blob = new Blob([data], { type: EXPORT_MIME_TYPES[format] });
    } else {
      blob = data;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate filename for export
   */
  private static generateFilename(format: ExportFormat): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0] || now.toDateString(); // YYYY-MM-DD
    const timeStr = (now.toTimeString().split(' ')[0] || now.toLocaleTimeString()).replace(/:/g, '-'); // HH-MM-SS
    
    return `time-tracker-export_${dateStr}_${timeStr}.${format}`;
  }

  /**
   * Validate export data
   */
  private static validateExportData(data: ExportData): { valid: boolean; error?: string } {
    // Check total records limit
    if (data.metadata.totalRecords > EXPORT_LIMITS.MAX_RECORDS) {
      return {
        valid: false,
        error: `Too many records (${data.metadata.totalRecords}). Maximum allowed: ${EXPORT_LIMITS.MAX_RECORDS}`,
      };
    }

    // Check if data is empty
    const hasData = (data.sessions?.length || 0) + (data.projects?.length || 0) > 0 || data.analytics;
    if (!hasData) {
      return {
        valid: false,
        error: 'No data available for export',
      };
    }

    // Check date range
    const dateFrom = new Date(data.metadata.dateRange.from);
    const dateTo = new Date(data.metadata.dateRange.to);
    const daysDiff = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > EXPORT_LIMITS.MAX_DATE_RANGE_DAYS) {
      return {
        valid: false,
        error: `Date range too large (${daysDiff} days). Maximum allowed: ${EXPORT_LIMITS.MAX_DATE_RANGE_DAYS} days`,
      };
    }

    return { valid: true };
  }

  /**
   * Estimate export file size
   */
  static estimateFileSize(data: ExportData, format: ExportFormat): number {
    let estimatedSize = 0;

    switch (format) {
      case 'csv':
        // Rough estimate: ~200 bytes per session, ~150 bytes per project
        estimatedSize = (data.sessions?.length || 0) * 200 + (data.projects?.length || 0) * 150;
        break;
      case 'json':
        // JSON is typically larger due to structure
        estimatedSize = (data.sessions?.length || 0) * 400 + (data.projects?.length || 0) * 300;
        break;
      case 'pdf':
        // PDF base size + content
        estimatedSize = 50000 + (data.sessions?.length || 0) * 100 + (data.projects?.length || 0) * 80;
        break;
    }

    return estimatedSize;
  }

  /**
   * Check if export is allowed based on data size
   */
  static canExport(data: ExportData, format: ExportFormat): { allowed: boolean; reason?: string } {
    const estimatedSize = this.estimateFileSize(data, format);
    
    if (estimatedSize > EXPORT_LIMITS.MAX_FILE_SIZE) {
      return {
        allowed: false,
        reason: `Estimated file size (${Math.round(estimatedSize / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(EXPORT_LIMITS.MAX_FILE_SIZE / 1024 / 1024)}MB)`,
      };
    }

    const validation = this.validateExportData(data);
    if (!validation.valid) {
      return {
        allowed: false,
        reason: validation.error,
      };
    }

    return { allowed: true };
  }

  /**
   * Create sample export data for testing
   */
  static createSampleData(): ExportData {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      metadata: {
        exportDate: now.toISOString(),
        dateRange: {
          from: weekAgo.toISOString().split('T')[0] || weekAgo.toDateString(),
          to: now.toISOString().split('T')[0] || now.toDateString(),
        },
        totalRecords: 2,
        format: 'json',
        userId: 'sample-user',
      },
      sessions: [
        {
          id: 'session-1',
          startTime: now.toISOString(),
          endTime: new Date(now.getTime() + 25 * 60 * 1000).toISOString(),
          duration: 1500,
          durationMinutes: 25,
          durationHours: 0.42,
          sessionType: 'focus',
          isPomodoro: true,
          isCompleted: true,
          projectId: 'project-1',
          projectName: 'Sample Project',
          projectColor: '#3b82f6',
          description: 'Sample session',
          notes: '',
          tags: ['work', 'important'],
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ],
      projects: [
        {
          id: 'project-1',
          name: 'Sample Project',
          description: 'A sample project for testing',
          color: '#3b82f6',
          isActive: true,
          totalTime: 1500,
          totalTimeMinutes: 25,
          totalTimeHours: 0.42,
          sessionsCount: 1,
          averageSessionLength: 1500,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ],
      analytics: {
        summary: {
          totalTime: 1500,
          totalSessions: 1,
          totalProjects: 1,
          averageSessionLength: 1500,
          mostProductiveDay: 'Monday',
          mostProductiveHour: 9,
        },
        dailyStats: [],
        projectBreakdown: [],
        productivity: {
          focusRatio: 85,
          streakData: {
            currentStreak: 3,
            longestStreak: 7,
          },
        },
      },
    };
  }
}
