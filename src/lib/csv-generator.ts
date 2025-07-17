/**
 * CSV Generator Utilities
 * Utilities for generating CSV files from data
 */

import { CSVColumn, CSVExportOptions, SessionExportData, ProjectExportData } from '@/types/export';

export class CSVGenerator {
  private static readonly DEFAULT_OPTIONS: CSVExportOptions = {
    columns: [],
    includeHeaders: true,
    delimiter: ',',
    encoding: 'utf-8',
  };

  /**
   * Generate CSV from array of objects
   */
  static generateCSV<T extends Record<string, any>>(
    data: T[],
    columns: CSVColumn[],
    options: Partial<CSVExportOptions> = {}
  ): string {
    if (!data.length) {
      return '';
    }

    const config = { ...this.DEFAULT_OPTIONS, ...options, columns };
    const lines: string[] = [];

    // Add headers if enabled
    if (config.includeHeaders) {
      const headers = columns.map(col => this.escapeCSVValue(col.header));
      lines.push(headers.join(config.delimiter));
    }

    // Add data rows
    data.forEach(row => {
      const values = columns.map(col => {
        const value = row[col.key];
        const formattedValue = col.formatter ? col.formatter(value) : value;
        return this.escapeCSVValue(formattedValue);
      });
      lines.push(values.join(config.delimiter));
    });

    return lines.join('\n');
  }

  /**
   * Generate CSV for sessions data
   */
  static generateSessionsCSV(sessions: SessionExportData[]): string {
    const columns: CSVColumn[] = [
      { key: 'id', header: 'ID' },
      { key: 'startTime', header: 'Start Time' },
      { key: 'endTime', header: 'End Time' },
      { key: 'durationMinutes', header: 'Duration (Minutes)', formatter: (val) => val?.toString() || '0' },
      { key: 'durationHours', header: 'Duration (Hours)', formatter: (val) => val?.toFixed(2) || '0.00' },
      { key: 'sessionType', header: 'Session Type' },
      { key: 'isPomodoro', header: 'Pomodoro', formatter: (val) => val ? 'Yes' : 'No' },
      { key: 'isCompleted', header: 'Completed', formatter: (val) => val ? 'Yes' : 'No' },
      { key: 'projectName', header: 'Project' },
      { key: 'description', header: 'Description' },
      { key: 'notes', header: 'Notes' },
      { key: 'tags', header: 'Tags', formatter: (val) => Array.isArray(val) ? val.join('; ') : val || '' },
      { key: 'createdAt', header: 'Created At' },
    ];

    return this.generateCSV(sessions, columns);
  }

  /**
   * Generate CSV for projects data
   */
  static generateProjectsCSV(projects: ProjectExportData[]): string {
    const columns: CSVColumn[] = [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Project Name' },
      { key: 'description', header: 'Description' },
      { key: 'color', header: 'Color' },
      { key: 'isActive', header: 'Active', formatter: (val) => val ? 'Yes' : 'No' },
      { key: 'totalTimeMinutes', header: 'Total Time (Minutes)', formatter: (val) => val?.toString() || '0' },
      { key: 'totalTimeHours', header: 'Total Time (Hours)', formatter: (val) => val?.toFixed(2) || '0.00' },
      { key: 'sessionsCount', header: 'Sessions Count', formatter: (val) => val?.toString() || '0' },
      { key: 'averageSessionLength', header: 'Avg Session (Minutes)', formatter: (val) => Math.round((val || 0) / 60).toString() },
      { key: 'createdAt', header: 'Created At' },
    ];

    return this.generateCSV(projects, columns);
  }

  /**
   * Generate combined CSV with multiple sheets worth of data
   */
  static generateCombinedCSV(data: {
    sessions?: SessionExportData[];
    projects?: ProjectExportData[];
  }): string {
    const sections: string[] = [];

    if (data.sessions?.length) {
      sections.push('SESSIONS');
      sections.push(this.generateSessionsCSV(data.sessions));
      sections.push(''); // Empty line separator
    }

    if (data.projects?.length) {
      sections.push('PROJECTS');
      sections.push(this.generateProjectsCSV(data.projects));
      sections.push(''); // Empty line separator
    }

    return sections.join('\n');
  }

  /**
   * Escape CSV values to handle commas, quotes, and newlines
   */
  private static escapeCSVValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);
    
    // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  /**
   * Create downloadable CSV blob
   */
  static createCSVBlob(csvContent: string, encoding: 'utf-8' | 'utf-16' = 'utf-8'): Blob {
    const BOM = encoding === 'utf-16' ? '\uFEFF' : '';
    const content = BOM + csvContent;
    
    return new Blob([content], {
      type: 'text/csv;charset=' + encoding,
    });
  }

  /**
   * Download CSV file
   */
  static downloadCSV(csvContent: string, filename: string): void {
    const blob = this.createCSVBlob(csvContent);
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    URL.revokeObjectURL(url);
  }

  /**
   * Validate CSV data before generation
   */
  static validateCSVData(data: any[]): { valid: boolean; error?: string } {
    if (!Array.isArray(data)) {
      return { valid: false, error: 'Data must be an array' };
    }

    if (data.length === 0) {
      return { valid: false, error: 'No data to export' };
    }

    if (data.length > 100000) {
      return { valid: false, error: 'Too many records (max 100,000)' };
    }

    return { valid: true };
  }

  /**
   * Format duration for CSV export
   */
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Format date for CSV export
   */
  static formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const isoString = d.toISOString().split('T');
    return isoString[0] || d.toDateString(); // YYYY-MM-DD format
  }

  /**
   * Format datetime for CSV export
   */
  static formatDateTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const isoString = d.toISOString().replace('T', ' ').split('.');
    return isoString[0] || d.toLocaleString(); // YYYY-MM-DD HH:mm:ss format
  }
}
