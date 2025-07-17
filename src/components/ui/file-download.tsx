/**
 * File Download Component
 * Component for displaying download progress and file information
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ExportProgress, ExportFormat } from '@/types/export';
import { formatFileSize, getFormatDisplayName, getFormatIcon } from '@/hooks/use-export';
import { 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  X
} from 'lucide-react';

interface FileDownloadProps {
  progress?: ExportProgress | null;
  format?: ExportFormat;
  filename?: string;
  fileSize?: number;
  onCancel?: () => void;
  onClose?: () => void;
  className?: string;
}

export function FileDownload({
  progress,
  format,
  filename,
  fileSize,
  onCancel,
  onClose,
  className = ''
}: FileDownloadProps) {
  const getPhaseIcon = (phase: ExportProgress['phase']) => {
    switch (phase) {
      case 'preparing':
      case 'processing':
      case 'generating':
        return <Clock className="h-4 w-4 animate-spin" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getPhaseColor = (phase: ExportProgress['phase']) => {
    switch (phase) {
      case 'preparing':
      case 'processing':
      case 'generating':
        return 'bg-blue-500';
      case 'complete':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (phase: ExportProgress['phase']) => {
    switch (phase) {
      case 'preparing':
        return 'Preparing';
      case 'processing':
        return 'Processing';
      case 'generating':
        return 'Generating';
      case 'complete':
        return 'Complete';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  if (!progress && !filename) {
    return null;
  }

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5" />
            File Download
          </CardTitle>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* File Information */}
        {(filename || format) && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl">
              {format ? getFormatIcon(format) : '📁'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {filename || 'Untitled file'}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {format && (
                  <Badge variant="secondary" className="text-xs">
                    {format.toUpperCase()}
                  </Badge>
                )}
                {fileSize && (
                  <span>{formatFileSize(fileSize)}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progress Information */}
        {progress && (
          <div className="space-y-3">
            {/* Status */}
            <div className="flex items-center gap-2">
              {getPhaseIcon(progress.phase)}
              <span className="font-medium">
                {getStatusText(progress.phase)}
              </span>
              {progress.phase !== 'error' && progress.phase !== 'complete' && (
                <Badge variant="outline" className="ml-auto">
                  {progress.percentage}%
                </Badge>
              )}
            </div>

            {/* Progress Bar */}
            {progress.phase !== 'error' && (
              <Progress 
                value={progress.percentage} 
                className="w-full"
              />
            )}

            {/* Message */}
            <p className="text-sm text-muted-foreground">
              {progress.message}
            </p>

            {/* Error Details */}
            {progress.phase === 'error' && progress.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">
                      Export Failed
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      {progress.error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {progress.phase === 'complete' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <p className="text-sm font-medium text-green-800">
                    Export completed successfully!
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {progress && progress.phase !== 'complete' && progress.phase !== 'error' && onCancel && (
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          
          {progress?.phase === 'complete' && onClose && (
            <Button 
              onClick={onClose}
              className="flex-1"
            >
              Done
            </Button>
          )}
          
          {progress?.phase === 'error' && onClose && (
            <Button 
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
          )}
        </div>

        {/* Format Information */}
        {format && !progress && (
          <div className="text-xs text-muted-foreground">
            {getFormatDisplayName(format)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact file download component for inline use
 */
interface CompactFileDownloadProps {
  progress?: ExportProgress | null;
  onCancel?: () => void;
  className?: string;
}

export function CompactFileDownload({
  progress,
  onCancel,
  className = ''
}: CompactFileDownloadProps) {
  if (!progress) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 p-3 bg-muted/50 rounded-lg ${className}`}>
      <div className="flex items-center gap-2 flex-1">
        {progress.phase === 'complete' ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : progress.phase === 'error' ? (
          <XCircle className="h-4 w-4 text-red-500" />
        ) : (
          <Clock className="h-4 w-4 animate-spin text-blue-500" />
        )}
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {progress.message}
          </p>
          {progress.phase !== 'error' && progress.phase !== 'complete' && (
            <div className="mt-1">
              <Progress 
                value={progress.percentage} 
                className="h-1"
              />
            </div>
          )}
        </div>
      </div>

      {progress.phase !== 'complete' && progress.phase !== 'error' && onCancel && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export default FileDownload;
