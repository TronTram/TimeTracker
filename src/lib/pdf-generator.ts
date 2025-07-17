/**
 * PDF Generator Utilities
 * Utilities for generating PDF reports using jsPDF
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { PDFExportOptions, PDFSection, SessionExportData, ProjectExportData, AnalyticsExportData } from '@/types/export';
import { formatDuration } from '@/lib/time-utils';

export class PDFGenerator {
  private static readonly DEFAULT_OPTIONS: PDFExportOptions = {
    pageSize: 'A4',
    orientation: 'portrait',
    includeCharts: true,
    includeHeader: true,
    includeFooter: true,
    margins: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    },
  };

  /**
   * Generate PDF report from export data
   */
  static async generateReport(
    data: {
      sessions?: SessionExportData[];
      projects?: ProjectExportData[];
      analytics?: AnalyticsExportData;
    },
    options: Partial<PDFExportOptions> = {}
  ): Promise<Blob> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Create PDF document
    const pdf = new jsPDF({
      orientation: config.orientation,
      unit: 'mm',
      format: config.pageSize,
    });

    // Set up document properties
    pdf.setProperties({
      title: 'Time Tracker Report',
      subject: 'Productivity Report',
      author: 'Focus Timer',
      creator: 'Focus Timer Export',
    });

    // Track current position
    let currentY = config.margins.top;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - config.margins.left - config.margins.right;

    // Add header
    if (config.includeHeader) {
      currentY = await this.addHeader(pdf, currentY, config);
    }

    // Add summary section
    if (data.analytics) {
      currentY = await this.addSummarySection(pdf, data.analytics, currentY, config);
    }

    // Add projects section
    if (data.projects?.length) {
      currentY = await this.addProjectsSection(pdf, data.projects, currentY, config);
    }

    // Add sessions section
    if (data.sessions?.length) {
      currentY = await this.addSessionsSection(pdf, data.sessions, currentY, config);
    }

    // Add footer to all pages
    if (config.includeFooter) {
      this.addFooter(pdf, config);
    }

    // Return PDF as blob
    return new Blob([pdf.output('blob')], { type: 'application/pdf' });
  }

  /**
   * Add header to PDF
   */
  private static async addHeader(
    pdf: jsPDF,
    currentY: number,
    config: PDFExportOptions
  ): Promise<number> {
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Title
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Time Tracker Report', config.margins.left, currentY);
    currentY += 10;

    // Date range
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const today = new Date().toLocaleDateString();
    pdf.text(`Generated on: ${today}`, config.margins.left, currentY);
    currentY += 15;

    // Add separator line
    pdf.setLineWidth(0.5);
    pdf.line(config.margins.left, currentY, pageWidth - config.margins.right, currentY);
    currentY += 10;

    return currentY;
  }

  /**
   * Add summary section
   */
  private static async addSummarySection(
    pdf: jsPDF,
    analytics: AnalyticsExportData,
    currentY: number,
    config: PDFExportOptions
  ): Promise<number> {
    // Section title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Summary', config.margins.left, currentY);
    currentY += 10;

    // Summary data
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const summaryItems = [
      ['Total Time:', formatDuration(analytics.summary.totalTime)],
      ['Total Sessions:', analytics.summary.totalSessions.toString()],
      ['Active Projects:', analytics.summary.totalProjects.toString()],
      ['Average Session:', formatDuration(analytics.summary.averageSessionLength)],
      ['Most Productive Day:', analytics.summary.mostProductiveDay],
      ['Focus Ratio:', `${analytics.productivity.focusRatio.toFixed(1)}%`],
    ];

    summaryItems.forEach(([label, value]) => {
      pdf.text(label || '', config.margins.left, currentY);
      pdf.text(value || '', config.margins.left + 50, currentY);
      currentY += 5;
    });

    currentY += 10;
    return currentY;
  }

  /**
   * Add projects section
   */
  private static async addProjectsSection(
    pdf: jsPDF,
    projects: ProjectExportData[],
    currentY: number,
    config: PDFExportOptions
  ): Promise<number> {
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Check if we need a new page
    if (currentY > pageHeight - 50) {
      pdf.addPage();
      currentY = config.margins.top;
    }

    // Section title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Projects Overview', config.margins.left, currentY);
    currentY += 10;

    // Table headers
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    
    const headers = ['Project Name', 'Sessions', 'Total Time', 'Avg Session'];
    const columnWidths = [60, 25, 35, 35];
    let xPosition = config.margins.left;

    headers.forEach((header, index) => {
      pdf.text(header, xPosition, currentY);
      xPosition += columnWidths[index] || 0;
    });
    currentY += 5;

    // Table rows
    pdf.setFont('helvetica', 'normal');
    
    projects.slice(0, 20).forEach(project => { // Limit to top 20 projects
      if (currentY > pageHeight - 20) {
        pdf.addPage();
        currentY = config.margins.top;
      }

      xPosition = config.margins.left;
      
      const rowData = [
        project.name.substring(0, 25), // Truncate long names
        project.sessionsCount.toString(),
        formatDuration(project.totalTime),
        formatDuration(project.averageSessionLength),
      ];

      rowData.forEach((data, index) => {
        pdf.text(data, xPosition, currentY);
        xPosition += columnWidths[index] || 0;
      });
      
      currentY += 4;
    });

    currentY += 10;
    return currentY;
  }

  /**
   * Add sessions section
   */
  private static async addSessionsSection(
    pdf: jsPDF,
    sessions: SessionExportData[],
    currentY: number,
    config: PDFExportOptions
  ): Promise<number> {
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Check if we need a new page
    if (currentY > pageHeight - 50) {
      pdf.addPage();
      currentY = config.margins.top;
    }

    // Section title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Recent Sessions', config.margins.left, currentY);
    currentY += 10;

    // Table headers
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    
    const headers = ['Date', 'Project', 'Duration', 'Type'];
    const columnWidths = [30, 50, 30, 30];
    let xPosition = config.margins.left;

    headers.forEach((header, index) => {
      pdf.text(header, xPosition, currentY);
      xPosition += columnWidths[index] || 0;
    });
    currentY += 5;

    // Table rows
    pdf.setFont('helvetica', 'normal');
    
    sessions.slice(0, 30).forEach(session => { // Limit to 30 recent sessions
      if (currentY > pageHeight - 20) {
        pdf.addPage();
        currentY = config.margins.top;
      }

      xPosition = config.margins.left;
      
      const startDate = new Date(session.startTime);
      const rowData = [
        startDate.toLocaleDateString(),
        (session.projectName || 'No Project').substring(0, 20),
        formatDuration(session.duration),
        session.isPomodoro ? 'Pomodoro' : session.sessionType,
      ];

      rowData.forEach((data, index) => {
        pdf.text(data, xPosition, currentY);
        xPosition += columnWidths[index] || 0;
      });
      
      currentY += 4;
    });

    currentY += 10;
    return currentY;
  }

  /**
   * Add footer to all pages
   */
  private static addFooter(pdf: jsPDF, config: PDFExportOptions): void {
    const pageCount = pdf.getNumberOfPages();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();

    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      
      // Page number
      const pageText = `Page ${i} of ${pageCount}`;
      const textWidth = pdf.getTextWidth(pageText);
      pdf.text(pageText, pageWidth - config.margins.right - textWidth, pageHeight - 10);
      
      // Generated by text
      pdf.text('Generated by Focus Timer', config.margins.left, pageHeight - 10);
    }
  }

  /**
   * Generate simple PDF from HTML element
   */
  static async generateFromHTML(
    elementId: string,
    filename: string = 'report.pdf'
  ): Promise<Blob> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found`);
    }

    // Create canvas from HTML element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add image to PDF (split across pages if necessary)
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return new Blob([pdf.output('blob')], { type: 'application/pdf' });
  }

  /**
   * Download PDF file
   */
  static downloadPDF(pdfBlob: Blob, filename: string): void {
    const url = URL.createObjectURL(pdfBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    URL.revokeObjectURL(url);
  }

  /**
   * Validate PDF generation parameters
   */
  static validatePDFData(data: any): { valid: boolean; error?: string } {
    if (!data) {
      return { valid: false, error: 'No data provided for PDF generation' };
    }

    // Check if at least one data type is provided
    if (!data.sessions && !data.projects && !data.analytics) {
      return { valid: false, error: 'At least one data type (sessions, projects, or analytics) must be provided' };
    }

    return { valid: true };
  }
}
