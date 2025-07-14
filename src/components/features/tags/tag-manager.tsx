// Tag management interface for editing and deleting
'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  MoreHorizontal, 
  Hash, 
  Filter,
  ChevronDown,
  Check,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTags } from '@/hooks/use-tags';
import { TagService } from '@/services/tag-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Dropdown } from '@/components/ui/dropdown';
import type { TagWithStats, TagFormData } from '@/types/tag';

interface TagManagerProps {
  className?: string;
  onTagSelect?: (tag: TagWithStats) => void;
  selectable?: boolean;
  compact?: boolean;
}

export function TagManager({ 
  className, 
  onTagSelect, 
  selectable = false, 
  compact = false 
}: TagManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'recent'>('name');
  const [showUnused, setShowUnused] = useState(true);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [editingTag, setEditingTag] = useState<TagWithStats | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch tags
  const {
    tags,
    loading,
    error,
    tagStats,
    createTag,
    updateTag,
    deleteTag,
    bulkDeleteTags,
    refetch,
  } = useTags({
    filters: {
      sortBy,
      includeUnused: showUnused,
    },
  });

  // Filter and sort tags
  const filteredTags = useMemo(() => {
    let filtered = tags;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tag => 
        tag.name.toLowerCase().includes(term)
      );
    }

    // Filter unused tags if needed
    if (!showUnused) {
      filtered = filtered.filter(tag => tag.usageCount! > 0);
    }

    return filtered;
  }, [tags, searchTerm, showUnused]);

  // Handle tag selection
  const handleTagToggle = (tagId: string) => {
    const newSelected = new Set(selectedTags);
    if (newSelected.has(tagId)) {
      newSelected.delete(tagId);
    } else {
      newSelected.add(tagId);
    }
    setSelectedTags(newSelected);
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedTags.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedTags.size} tag(s)? This will remove them from all sessions.`
    );

    if (confirmed) {
      const result = await bulkDeleteTags(Array.from(selectedTags));
      if (result.success) {
        setSelectedTags(new Set());
      }
    }
  };

  // Handle single tag delete
  const handleDeleteTag = async (tag: TagWithStats) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${tag.name}"? This will remove it from all sessions.`
    );

    if (confirmed) {
      await deleteTag(tag.id);
    }
  };

  // Handle tag edit
  const handleEditTag = (tag: TagWithStats) => {
    setEditingTag(tag);
  };

  // Handle tag update
  const handleUpdateTag = async (data: Partial<TagFormData>) => {
    if (!editingTag) return;

    const result = await updateTag(editingTag.id, data);
    if (result.success) {
      setEditingTag(null);
    }
  };

  // Handle tag creation
  const handleCreateTag = async (data: TagFormData) => {
    const result = await createTag(data);
    if (result.success) {
      setIsCreateModalOpen(false);
    }
  };

  // Handle tag click
  const handleTagClick = (tag: TagWithStats) => {
    if (selectable && onTagSelect) {
      onTagSelect(tag);
    }
  };

  if (loading) {
    return (
      <div className={cn('p-6', className)}>
        <div className="text-center text-muted-foreground">Loading tags...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-6', className)}>
        <div className="text-center text-destructive">Failed to load tags: {error}</div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Tag Manager</h2>
            <p className="text-sm text-muted-foreground">
              Manage your tags and organize your time sessions
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Tag
          </Button>
        </div>
      )}

      {/* Stats */}
      {!compact && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="text-2xl font-bold">{tagStats.totalTags}</div>
            <div className="text-sm text-muted-foreground">Total Tags</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="text-2xl font-bold">{tagStats.activeTags}</div>
            <div className="text-sm text-muted-foreground">Active Tags</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="text-2xl font-bold">{tagStats.unusedTags}</div>
            <div className="text-sm text-muted-foreground">Unused Tags</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="text-2xl font-bold">{Math.round(tagStats.averageUsage)}</div>
            <div className="text-sm text-muted-foreground">Avg Usage</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sort */}
        <Dropdown
          trigger={
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Sort: {sortBy === 'name' ? 'Name' : sortBy === 'usage' ? 'Usage' : 'Recent'}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          }
        >
          <div className="p-2 space-y-1">
            <button
              onClick={() => setSortBy('name')}
              className={cn(
                'w-full text-left px-2 py-1 rounded hover:bg-accent',
                sortBy === 'name' && 'bg-accent'
              )}
            >
              <Check className={cn('h-4 w-4 inline mr-2', sortBy !== 'name' && 'invisible')} />
              Name
            </button>
            <button
              onClick={() => setSortBy('usage')}
              className={cn(
                'w-full text-left px-2 py-1 rounded hover:bg-accent',
                sortBy === 'usage' && 'bg-accent'
              )}
            >
              <Check className={cn('h-4 w-4 inline mr-2', sortBy !== 'usage' && 'invisible')} />
              Usage
            </button>
            <button
              onClick={() => setSortBy('recent')}
              className={cn(
                'w-full text-left px-2 py-1 rounded hover:bg-accent',
                sortBy === 'recent' && 'bg-accent'
              )}
            >
              <Check className={cn('h-4 w-4 inline mr-2', sortBy !== 'recent' && 'invisible')} />
              Recent
            </button>
          </div>
        </Dropdown>

        {/* Show unused toggle */}
        <Button
          variant={showUnused ? 'default' : 'outline'}
          onClick={() => setShowUnused(!showUnused)}
        >
          {showUnused ? 'Hide' : 'Show'} Unused
        </Button>
      </div>

      {/* Bulk actions */}
      {selectedTags.size > 0 && (
        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
          <span className="text-sm font-medium">
            {selectedTags.size} tag(s) selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTags(new Set())}
            >
              Clear
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Tags grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredTags.map((tag) => (
          <TagCard
            key={tag.id}
            tag={tag}
            selected={selectedTags.has(tag.id)}
            selectable={selectable}
            onToggle={() => handleTagToggle(tag.id)}
            onClick={() => handleTagClick(tag)}
            onEdit={() => handleEditTag(tag)}
            onDelete={() => handleDeleteTag(tag)}
            compact={compact}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredTags.length === 0 && (
        <div className="text-center py-12">
          <Hash className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No tags found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first tag to get started'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Tag
            </Button>
          )}
        </div>
      )}

      {/* Create tag modal */}
      <TagFormModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTag}
        title="Create New Tag"
      />

      {/* Edit tag modal */}
      <TagFormModal
        open={!!editingTag}
        onClose={() => setEditingTag(null)}
        onSubmit={handleUpdateTag}
        initialData={editingTag || undefined}
        title="Edit Tag"
      />
    </div>
  );
}

// Individual tag card component
interface TagCardProps {
  tag: TagWithStats;
  selected: boolean;
  selectable: boolean;
  onToggle: () => void;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  compact: boolean;
}

function TagCard({ 
  tag, 
  selected, 
  selectable, 
  onToggle, 
  onClick, 
  onEdit, 
  onDelete, 
  compact 
}: TagCardProps) {
  const displayName = TagService.formatTagName(tag.name);

  return (
    <div
      className={cn(
        'relative bg-card border rounded-lg p-3 transition-all hover:shadow-sm',
        selected && 'ring-2 ring-primary',
        selectable && 'cursor-pointer hover:bg-accent/50'
      )}
      onClick={selectable ? onClick : undefined}
    >
      {/* Selection checkbox */}
      {!selectable && (
        <div className="absolute top-2 left-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            className="rounded"
          />
        </div>
      )}

      {/* Actions menu */}
      <div className="absolute top-2 right-2">
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          }
        >
          <div className="p-2 space-y-1">
            <button
              onClick={onEdit}
              className="w-full text-left px-2 py-1 rounded hover:bg-accent flex items-center gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={onDelete}
              className="w-full text-left px-2 py-1 rounded hover:bg-destructive/10 text-destructive flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </Dropdown>
      </div>

      {/* Tag content */}
      <div className={cn('space-y-2', !selectable && 'ml-6', 'mr-8')}>
        {/* Tag name with color */}
        <div className="flex items-center gap-2">
          {tag.color && (
            <div
              className="w-3 h-3 rounded-full border"
              style={{ backgroundColor: tag.color }}
            />
          )}
          <Hash className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium truncate">{displayName}</span>
        </div>

        {/* Usage stats */}
        {!compact && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Used {tag.usageCount || 0} times</span>
            {tag.lastUsed && (
              <span>
                Last: {new Date(tag.lastUsed).toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        {/* Status badge */}
        <div className="flex gap-2">
          <Badge variant={tag.usageCount! > 0 ? 'default' : 'secondary'}>
            {tag.usageCount! > 0 ? 'Active' : 'Unused'}
          </Badge>
          {tag.usageCount! > 20 && (
            <Badge variant="outline">Popular</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// Tag form modal component
interface TagFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TagFormData) => void;
  initialData?: TagWithStats;
  title: string;
}

function TagFormModal({ open, onClose, onSubmit, initialData, title }: TagFormModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [color, setColor] = useState(initialData?.color || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      color: color || undefined,
    });

    // Reset form
    setName('');
    setColor('');
  };

  return (
    <Modal open={open} onOpenChange={() => onClose()} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Tag Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter tag name..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Color (optional)</label>
          <Input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim()}>
            {initialData ? 'Update' : 'Create'} Tag
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default TagManager;
