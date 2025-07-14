'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ColorInput } from '@/components/ui/color-input';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import { ProjectService } from '@/services/project-service';
import { useProjects } from '@/hooks/use-projects';
import { useToast } from '@/components/ui/toast';
import { Project } from '@prisma/client';
import type { CreateProjectData, UpdateProjectData } from '@/types/project';
import { Loader2, Save, X } from 'lucide-react';

// Form validation schema
const projectFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .default('#3b82f6'),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  project?: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (project: Project) => void;
  className?: string;
}

export function ProjectForm({ 
  project, 
  isOpen, 
  onClose, 
  onSuccess,
  className 
}: ProjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defaultColor, setDefaultColor] = useState('#3b82f6');
  
  const { success, error: showError } = useToast();
  const { createProject, updateProject } = useProjects({ enabled: false });
  
  const isEditing = !!project;
  const title = isEditing ? 'Edit Project' : 'Create New Project';
  
  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty, isValid }
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
      color: project?.color || defaultColor,
    },
    mode: 'onChange',
  });

  const watchedColor = watch('color');

  // Get next available color for new projects
  useEffect(() => {
    if (!isEditing && isOpen) {
      ProjectService.getNextProjectColor('current-user')
        .then(color => {
          setDefaultColor(color);
          if (!project) {
            setValue('color', color);
          }
        })
        .catch(console.error);
    }
  }, [isEditing, isOpen, project, setValue]);

  // Reset form when modal opens/closes or project changes
  useEffect(() => {
    if (isOpen) {
      reset({
        name: project?.name || '',
        description: project?.description || '',
        color: project?.color || defaultColor,
      });
    }
  }, [isOpen, project, defaultColor, reset]);

  // Handle form submission
  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    
    try {
      let result: boolean;
      
      if (isEditing && project) {
        // Update existing project
        const updateData: UpdateProjectData = {
          name: data.name,
          description: data.description || undefined,
          color: data.color,
        };
        
        result = await updateProject(project.id, updateData);
      } else {
        // Create new project
        const createData: CreateProjectData = {
          name: data.name,
          description: data.description || undefined,
          color: data.color,
        };
        
        result = await createProject(createData);
      }
      
      if (result) {
        success('Success', `Project ${isEditing ? 'updated' : 'created'} successfully`);
        onSuccess?.(project as Project); // In real app, would get updated project from response
        onClose();
        reset();
      }
    } catch (error) {
      console.error('Form submission error:', error);
      showError('Error', 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      reset();
    }
  };

  // Handle color change
  const handleColorChange = (color: string) => {
    setValue('color', color, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      title={title}
      size="lg"
      className={className}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Project Name */}
        <div>
          <label 
            htmlFor="name" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Project Name *
          </label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Enter project name"
            className={cn(
              'w-full',
              errors.name && 'border-red-300 focus:border-red-500 focus:ring-red-500'
            )}
            disabled={isSubmitting}
            autoFocus
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Project Description */}
        <div>
          <label 
            htmlFor="description" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description (Optional)
          </label>
          <textarea
            id="description"
            {...register('description')}
            placeholder="Enter project description"
            rows={3}
            className={cn(
              'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              'disabled:bg-gray-50 disabled:text-gray-500',
              errors.description && 'border-red-300 focus:border-red-500 focus:ring-red-500'
            )}
            disabled={isSubmitting}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Project Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Color
          </label>
          <ColorInput
            value={watchedColor}
            onChange={handleColorChange}
            disabled={isSubmitting}
            showPalette={true}
            allowCustom={true}
            placeholder="#3b82f6"
          />
          {errors.color && (
            <p className="mt-1 text-sm text-red-600">{errors.color.message}</p>
          )}
        </div>

        {/* Color Preview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">Preview:</p>
          <div 
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
            style={{ 
              backgroundColor: watchedColor,
              color: ProjectService.validateColor(watchedColor) 
                ? '#ffffff' 
                : '#000000'
            }}
          >
            {watch('name') || 'Project Name'}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty || !isValid}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSubmitting 
              ? (isEditing ? 'Updating...' : 'Creating...') 
              : (isEditing ? 'Update Project' : 'Create Project')
            }
          </Button>
        </div>
      </form>
    </Modal>
  );
}
