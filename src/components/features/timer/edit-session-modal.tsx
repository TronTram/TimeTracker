// Modal for editing existing sessions
'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { SessionWithProject } from '@/types/session';
import { Project, SessionType } from '@prisma/client';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { TagInput } from '@/components/features/tags/tag-input';
import { 
  Clock, 
  Calendar, 
  Tag, 
  AlertCircle,
  Save,
  X
} from 'lucide-react';

interface EditSessionModalProps {
  session: SessionWithProject | null;
  projects: Project[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: Partial<SessionWithProject>) => Promise<void>;
  loading?: boolean;
}

interface SessionFormData {
  description: string;
  projectId: string;
  tags: string[];
  startTime: string; // ISO string
  endTime: string; // ISO string
  duration: number; // in seconds
  sessionType: SessionType;
}

export function EditSessionModal({
  session,
  projects,
  open,
  onOpenChange,
  onSave,
  loading = false,
}: EditSessionModalProps) {
  const [formData, setFormData] = useState<SessionFormData>({
    description: '',
    projectId: '',
    tags: [],
    startTime: '',
    endTime: '',
    duration: 0,
    sessionType: 'FOCUS',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when session changes
  useEffect(() => {
    if (session) {
      setFormData({
        description: session.description || '',
        projectId: session.projectId || '',
        tags: session.tags || [],
        startTime: format(session.startTime, "yyyy-MM-dd'T'HH:mm"),
        endTime: session.endTime ? format(session.endTime, "yyyy-MM-dd'T'HH:mm") : '',
        duration: session.duration,
        sessionType: session.sessionType,
      });
      setErrors({});
    }
  }, [session]);

  // Calculate duration from start/end times
  const calculateDuration = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / 1000));
  };

  // Update duration when times change
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      const newDuration = calculateDuration(formData.startTime, formData.endTime);
      setFormData(prev => ({ ...prev, duration: newDuration }));
    }
  }, [formData.startTime, formData.endTime]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (formData.startTime && formData.endTime) {
      const startDate = new Date(formData.startTime);
      const endDate = new Date(formData.endTime);
      
      if (startDate >= endDate) {
        newErrors.endTime = 'End time must be after start time';
      }

      // Check for reasonable duration (max 24 hours)
      const duration = (endDate.getTime() - startDate.getTime()) / 1000;
      if (duration > 24 * 60 * 60) {
        newErrors.endTime = 'Session cannot be longer than 24 hours';
      }
    }

    if (formData.duration < 60) {
      newErrors.duration = 'Session must be at least 1 minute long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session || !validateForm()) {
      return;
    }

    try {
      const updates = {
        description: formData.description.trim(),
        projectId: formData.projectId || null,
        tags: formData.tags,
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime),
        duration: formData.duration,
        sessionType: formData.sessionType,
      };

      await onSave(updates);
      onOpenChange(false);
      toast({
        title: 'Session updated',
        description: 'Your changes have been saved successfully.',
      });
    } catch (error) {
      console.error('Failed to update session:', error);
      toast({
        title: 'Update failed',
        description: 'Failed to update session. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (!session) return null;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Session"
      description="Make changes to your time tracking session"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Session Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Session Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Description *
              </label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  description: e.target.value 
                }))}
                placeholder="What were you working on?"
                error={errors.description}
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.description}
                </p>
              )}
            </div>

            {/* Project */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Project
              </label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  projectId: e.target.value 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="">No project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Session Type */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Session Type
              </label>
              <select
                value={formData.sessionType}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  sessionType: e.target.value as SessionType
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="FOCUS">Focus Session</option>
                <option value="SHORT_BREAK">Short Break</option>
                <option value="LONG_BREAK">Long Break</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Time Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Time Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Time *
              </label>
              <Input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  startTime: e.target.value 
                }))}
                error={errors.startTime}
              />
              {errors.startTime && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.startTime}
                </p>
              )}
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium mb-1">
                End Time *
              </label>
              <Input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  endTime: e.target.value 
                }))}
                error={errors.endTime}
              />
              {errors.endTime && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.endTime}
                </p>
              )}
            </div>

            {/* Duration Display */}
            {formData.duration > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Duration: {formatDuration(formData.duration)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TagInput
              value={formData.tags}
              onChange={(newTags) => setFormData(prev => ({ ...prev, tags: newTags }))}
              placeholder="Add tags to categorize this session..."
              maxTags={10}
              allowCreate={true}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="min-w-[100px]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </div>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
