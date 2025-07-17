/**
 * Export API Route
 * Server-side export processing endpoint for handling large data exports
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ExportService } from "@/services/export-service";
import { CSVGenerator } from "@/lib/csv-generator";
import { PDFGenerator } from "@/lib/pdf-generator";
import { exportAnalyticsData } from "@/actions/analytics-actions";
import type { ExportOptions, ExportFormat } from "@/types/export";

const ALLOWED_ORIGINS = [
  "http://localhost:3001",
  "http://localhost:3000",
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean);

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const options: ExportOptions = {
      format: body.format || "csv",
      filename: body.filename || `export-${Date.now()}`,
      dateFrom: new Date(body.dateFrom || Date.now() - 30 * 24 * 60 * 60 * 1000),
      dateTo: new Date(body.dateTo || Date.now()),
      includeProjects: body.includeProjects ?? true,
      includeSessions: body.includeSessions ?? true,
      includeAnalytics: body.includeAnalytics ?? true,
      includeAchievements: body.includeAchievements ?? false,
    };

    // Validate export options
    const validation = validateExportOptions(options);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Initialize export service
    const exportService = new ExportService();

    // Fetch data based on options
    const data = await fetchExportData(userId, options);

    let exportData: Uint8Array | string;
    let contentType: string;
    let filename: string;

    switch (options.format) {
      case "csv":
        // Define columns for CSV export
        const csvColumns = [
          { key: 'id', header: 'ID' },
          { key: 'date', header: 'Date' },
          { key: 'duration', header: 'Duration' },
          { key: 'type', header: 'Type' }
        ];
        exportData = CSVGenerator.generateCSV(data.sessions || [], csvColumns);
        contentType = "text/csv";
        filename = `${options.filename}.csv`;
        break;

      case "json":
        exportData = JSON.stringify(data, null, 2);
        contentType = "application/json";
        filename = `${options.filename}.json`;
        break;

      case "pdf":
        const pdfBlob = await PDFGenerator.generateReport(data);
        const arrayBuffer = await pdfBlob.arrayBuffer();
        exportData = new Uint8Array(arrayBuffer);
        contentType = "application/pdf";
        filename = `${options.filename}.pdf`;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid export format" },
          { status: 400 }
        );
    }

    // Return file as download
    return new NextResponse(exportData, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": exportData.length.toString(),
        "Cache-Control": "no-cache",
      },
    });

  } catch (error) {
    console.error("Export API error:", error);
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "estimate") {
      // Return estimated file size for given options
      const format = url.searchParams.get("format") as ExportFormat || "csv";
      const includeData = {
        sessions: url.searchParams.get("sessions") === "true",
        projects: url.searchParams.get("projects") === "true",
        analytics: url.searchParams.get("analytics") === "true",
      };

      const estimate = await estimateExportSize(userId, format, includeData);
      
      return NextResponse.json({
        estimatedSize: estimate.bytes,
        estimatedRecords: estimate.records,
        canExport: estimate.canExport,
        limitations: estimate.limitations,
      });
    }

    if (action === "sample") {
      // Return sample data for preview
      const format = url.searchParams.get("format") as ExportFormat || "csv";
      const sample = await generateSampleData(userId, format);
      
      return NextResponse.json({
        format,
        sampleData: sample.data,
        structure: sample.structure,
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Export API GET error:", error);
    return NextResponse.json(
      { error: "Request failed" },
      { status: 500 }
    );
  }
}

// Helper functions

async function fetchExportData(userId: string, options: ExportOptions) {
  const analyticsData = await exportAnalyticsData({
    startDate: options.dateFrom.toISOString(),
    endDate: options.dateTo.toISOString(),
  });

  const data: any = {
    exportInfo: {
      userId,
      exportDate: new Date().toISOString(),
      dateRange: {
        start: options.dateFrom,
        end: options.dateTo,
      },
      format: options.format,
      version: "1.0",
    },
  };

  if (analyticsData.success && analyticsData.data) {
    if (options.includeSessions) {
      data.sessions = analyticsData.data.sessions || [];
    }

    if (options.includeProjects) {
      data.projects = analyticsData.data.projects || [];
    }

    if (options.includeAnalytics) {
      data.analytics = analyticsData.data.analytics || {};
    }
  }

  return data;
}

function validateExportOptions(options: ExportOptions): { valid: boolean; error?: string } {
  if (!options.format || !["csv", "json", "pdf"].includes(options.format)) {
    return { valid: false, error: "Invalid export format" };
  }

  if (!options.dateFrom || !options.dateTo) {
    return { valid: false, error: "Invalid date range" };
  }

  if (options.dateFrom > options.dateTo) {
    return { valid: false, error: "Start date must be before end date" };
  }

  const daysDiff = Math.ceil(
    (options.dateTo.getTime() - options.dateFrom.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff > 365) {
    return { valid: false, error: "Date range cannot exceed 365 days" };
  }

  const hasAnyData = options.includeSessions || options.includeProjects || options.includeAnalytics;
  if (!hasAnyData) {
    return { valid: false, error: "At least one data type must be included" };
  }

  return { valid: true };
}

async function estimateExportSize(userId: string, format: ExportFormat, includeData: any) {
  // Rough estimation based on format and data types
  const baseSize = {
    csv: 1024, // 1KB base
    json: 2048, // 2KB base
    pdf: 10240, // 10KB base
  };

  const recordSize = {
    csv: 200, // ~200 bytes per record
    json: 400, // ~400 bytes per record
    pdf: 100, // ~100 bytes per record (compressed)
  };

  // Estimate record count (simplified)
  let estimatedRecords = 0;
  if (includeData.sessions) estimatedRecords += 1000; // Assume 1000 sessions
  if (includeData.projects) estimatedRecords += 50; // Assume 50 projects
  if (includeData.analytics) estimatedRecords += 100; // Assume 100 analytics points

  const estimatedBytes = baseSize[format] + (estimatedRecords * recordSize[format]);
  const maxSize = 50 * 1024 * 1024; // 50MB limit

  return {
    bytes: estimatedBytes,
    records: estimatedRecords,
    canExport: estimatedBytes <= maxSize,
    limitations: estimatedBytes > maxSize ? ["File size would exceed 50MB limit"] : [],
  };
}

async function generateSampleData(userId: string, format: ExportFormat) {
  const sampleSession = {
    id: "sample-123",
    startTime: "2024-01-15T10:00:00Z",
    endTime: "2024-01-15T10:25:00Z",
    duration: 25 * 60 * 1000, // 25 minutes in ms
    projectName: "Sample Project",
    tags: ["focus", "work"],
    isCompleted: true,
  };

  const sampleProject = {
    id: "project-456",
    name: "Sample Project",
    description: "A sample project for demonstration",
    color: "#3B82F6",
    totalSessions: 42,
    totalTime: 63000000, // ~17.5 hours in ms
  };

  return {
    data: {
      sessions: [sampleSession],
      projects: [sampleProject],
      analytics: {
        summary: {
          totalSessions: 42,
          totalTime: 63000000,
          averageSessionLength: 1500000, // 25 minutes
        },
      },
    },
    structure: {
      sessions: Object.keys(sampleSession),
      projects: Object.keys(sampleProject),
      analytics: ["summary", "trends", "productivity", "patterns"],
    },
  };
}
