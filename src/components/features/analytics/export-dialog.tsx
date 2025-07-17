/**
 * Export Dialog Component
 * Modal for configuring export options
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/features/analytics/date-range-picker';
import { FileDownload } from '@/components/ui/file-download';
import { ExportOptions, ExportFormat, EXPORT_PRESETS, ExportPreset } from '@/types/export';
import { useExport, formatFileSize, getFormatDisplayName, getFormatIcon } from '@/hooks/use-export';
import { 
  Download, 
  FileText, 
  Settings, 
  Calendar,
  Database,
  BarChart3,
  Folder,
  Clock,
  Info
} from 'lucide-react';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultOptions?: Partial<ExportOptions>;
}

export function ExportDialog({ 
  open, 
  onOpenChange, 
  defaultOptions = {} 
}: ExportDialogProps) {
  // Initialize export options
  const [options, setOptions] = useState<ExportOptions>({
    format: 'pdf',
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    dateTo: new Date(),
    includeProjects: true,
    includeSessions: true,
    includeAchievements: false,
    includeAnalytics: true,
    filename: '',
    ...defaultOptions,
  });

  const [selectedPreset, setSelectedPreset] = useState<ExportPreset | null>(null);
  const [estimatedSize, setEstimatedSize] = useState<number>(0);
  const [canExportResult, setCanExportResult] = useState<{ allowed: boolean; reason?: string }>({ allowed: true });

  const { 
    isExporting, 
    progress, 
    exportData, 
    downloadSample,
    cancelExport,
    estimateFileSize,
    canExport
  } = useExport({
    onSuccess: () => {
      // Keep dialog open to show success state
    },
    onError: (error) => {
      console.error('Export error:', error);
    },
  });

  // Update estimated file size when options change
  useEffect(() => {
    const updateEstimate = async () => {
      try {
        const size = await estimateFileSize(options);
        setEstimatedSize(size);
        
        const exportCheck = await canExport(options);
        setCanExportResult(exportCheck);
      } catch (error) {
        setEstimatedSize(0);
        setCanExportResult({ allowed: false, reason: 'Unable to estimate file size' });
      }
    };

    updateEstimate();
  }, [options, estimateFileSize, canExport]);

  const handlePresetSelect = (preset: ExportPreset) => {
    setSelectedPreset(preset);
    
    // Calculate date range based on preset
    const now = new Date();
    let dateFrom = new Date();
    
    switch (preset.dateRange) {
      case 'week':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        dateFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    setOptions(prev => ({
      ...prev,
      format: preset.format,
      includeProjects: preset.includeProjects,
      includeSessions: preset.includeSessions,
      includeAnalytics: preset.includeAnalytics,
      dateFrom,
      dateTo: now,
    }));
  };

  const handleFormatChange = (format: ExportFormat) => {
    setOptions(prev => ({ ...prev, format }));
    setSelectedPreset(null); // Clear preset when manually changing format
  };

  const handleDateRangeChange = (range: { from: Date; to: Date; label: string }) => {
    setOptions(prev => ({ 
      ...prev, 
      dateFrom: range.from, 
      dateTo: range.to 
    }));
    setSelectedPreset(null); // Clear preset when manually changing dates
  };

  const handleExport = async () => {
    await exportData(options);
  };

  const handleClose = () => {
    if (!isExporting) {
      onOpenChange(false);
    }
  };

  const formatOptions: { format: ExportFormat; label: string; description: string }[] = [
    {
      format: 'pdf',
      label: 'PDF Report',
      description: 'Professional report with charts and summaries',
    },
    {
      format: 'csv',
      label: 'CSV Data',
      description: 'Spreadsheet-compatible raw data',
    },
    {
      format: 'json',
      label: 'JSON Data',
      description: 'Complete data backup in JSON format',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </DialogTitle>
          <DialogDescription>
            Export your productivity data in various formats for analysis or backup.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Progress */}
          {(isExporting || progress) && (
            <FileDownload
              progress={progress}
              format={options.format}
              filename={options.filename}
              fileSize={estimatedSize}
              onCancel={cancelExport}
              onClose={progress?.phase === 'complete' ? handleClose : undefined}
            />
          )}

          {/* Quick Presets */}
          {!isExporting && (
            <div>
              <Label className="text-base font-medium mb-3 block">Quick Presets</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {EXPORT_PRESETS.map((preset) => (
                  <Card 
                    key={preset.name}
                    className={`cursor-pointer transition-colors ${
                      selectedPreset?.name === preset.name 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handlePresetSelect(preset)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">
                          {getFormatIcon(preset.format)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{preset.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {preset.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs">
                              {preset.format.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {preset.dateRange}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Custom Configuration */}
          {!isExporting && (
            <div className="space-y-4">
              <Label className="text-base font-medium">Custom Configuration</Label>
              
              {/* Format Selection */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Export Format</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {formatOptions.map(({ format, label, description }) => (
                    <Card
                      key={format}
                      className={`cursor-pointer transition-colors ${
                        options.format === format 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => handleFormatChange(format)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl mb-2">
                          {getFormatIcon(format)}
                        </div>
                        <h4 className="font-medium mb-1">{label}</h4>
                        <p className="text-xs text-muted-foreground">
                          {description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Range
                </Label>
                <DateRangePicker
                  value={{
                    from: options.dateFrom,
                    to: options.dateTo,
                    label: 'Custom Range',
                  }}
                  onChange={handleDateRangeChange}
                />
              </div>

              {/* Data Inclusion Options */}
              <div>
                <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Include Data
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Time Sessions</p>
                        <p className="text-xs text-muted-foreground">Individual focus sessions and tracking data</p>
                      </div>
                    </div>
                    <Switch
                      checked={options.includeSessions}
                      onCheckedChange={(checked: boolean) =>
                        setOptions(prev => ({ ...prev, includeSessions: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Projects</p>
                        <p className="text-xs text-muted-foreground">Project information and statistics</p>
                      </div>
                    </div>
                    <Switch
                      checked={options.includeProjects}
                      onCheckedChange={(checked: boolean) =>
                        setOptions(prev => ({ ...prev, includeProjects: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Analytics</p>
                        <p className="text-xs text-muted-foreground">Summary statistics and insights</p>
                      </div>
                    </div>
                    <Switch
                      checked={options.includeAnalytics}
                      onCheckedChange={(checked: boolean) =>
                        setOptions(prev => ({ ...prev, includeAnalytics: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Filename */}
              <div>
                <Label htmlFor="filename" className="text-sm font-medium mb-2 block">
                  Custom Filename (Optional)
                </Label>
                <Input
                  id="filename"
                  placeholder={`my-export.${options.format}`}
                  value={options.filename}
                  onChange={(e) =>
                    setOptions(prev => ({ ...prev, filename: e.target.value }))
                  }
                />
              </div>

              {/* Export Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-sm">
                      <span>Format:</span>
                      <Badge variant="outline">{getFormatDisplayName(options.format)}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span>Estimated size:</span>
                      <span className="font-mono">{formatFileSize(estimatedSize)}</span>
                    </div>
                    {!canExportResult.allowed && (
                      <div className="text-sm text-red-600 mt-2">
                        <strong>Cannot export:</strong> {canExportResult.reason}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {!isExporting && (
            <div className="flex gap-3">
              <Button 
                onClick={handleExport}
                disabled={!canExportResult.allowed || isExporting}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => downloadSample(options.format)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Sample
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ExportDialog;
