'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { normalizeTagName, validateTagName } from '@/lib/tag-utils';
import type { TagFormData, TagWithStats, TagFilterOptions } from '@/types/tag';

// Validation schemas
const tagFormSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(30, 'Tag name too long'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
});

const tagFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  sortBy: z.enum(['name', 'usage', 'recent', 'alphabetical']).default('alphabetical'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  limit: z.number().min(1).max(100).default(50),
  includeUnused: z.boolean().default(true),
});

/**
 * Create a new tag
 */
export async function createTag(data: TagFormData) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const validatedData = tagFormSchema.parse(data);
    const normalizedName = normalizeTagName(validatedData.name);

    // Validate tag name
    const validation = validateTagName(normalizedName);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Check if tag already exists
    const existingTag = await prisma.tag.findFirst({
      where: {
        userId,
        name: {
          equals: normalizedName,
          mode: 'insensitive',
        },
      },
    });

    if (existingTag) {
      throw new Error('Tag already exists');
    }

    const tag = await prisma.tag.create({
      data: {
        name: normalizedName,
        color: validatedData.color,
        userId,
      },
    });

    revalidatePath('/');
    return { success: true, data: tag };
  } catch (error) {
    console.error('Failed to create tag:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create tag',
    };
  }
}

/**
 * Update an existing tag
 */
export async function updateTag(id: string, data: Partial<TagFormData>) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const validatedData = tagFormSchema.partial().parse(data);

    // Check if tag exists and belongs to user
    const existingTag = await prisma.tag.findFirst({
      where: { id, userId },
    });

    if (!existingTag) {
      throw new Error('Tag not found');
    }

    let updateData: Partial<TagFormData> = {};

    if (validatedData.name) {
      const normalizedName = normalizeTagName(validatedData.name);
      
      // Validate tag name
      const validation = validateTagName(normalizedName);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Check if new name conflicts with existing tags
      if (normalizedName !== existingTag.name) {
        const conflictingTag = await prisma.tag.findFirst({
          where: {
            userId,
            name: {
              equals: normalizedName,
              mode: 'insensitive',
            },
            id: { not: id },
          },
        });

        if (conflictingTag) {
          throw new Error('Tag name already exists');
        }
      }

      updateData.name = normalizedName;
    }

    if (validatedData.color !== undefined) {
      updateData.color = validatedData.color;
    }

    const updatedTag = await prisma.tag.update({
      where: { id },
      data: updateData,
    });

    // Update tag names in time sessions
    if (updateData.name && updateData.name !== existingTag.name) {
      await prisma.$transaction(async (tx) => {
        const sessions = await tx.timeSession.findMany({
          where: {
            userId,
            tags: { has: existingTag.name },
          },
        });

        for (const session of sessions) {
          const updatedTags = session.tags.map(tag => 
            tag === existingTag.name ? updateData.name! : tag
          );

          await tx.timeSession.update({
            where: { id: session.id },
            data: { tags: updatedTags },
          });
        }
      });
    }

    revalidatePath('/');
    return { success: true, data: updatedTag };
  } catch (error) {
    console.error('Failed to update tag:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update tag',
    };
  }
}

/**
 * Delete a tag
 */
export async function deleteTag(id: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Check if tag exists and belongs to user
    const tag = await prisma.tag.findFirst({
      where: { id, userId },
    });

    if (!tag) {
      throw new Error('Tag not found');
    }

    // Remove tag from all sessions
    await prisma.$transaction(async (tx) => {
      const sessions = await tx.timeSession.findMany({
        where: {
          userId,
          tags: { has: tag.name },
        },
      });

      for (const session of sessions) {
        const updatedTags = session.tags.filter(tagName => tagName !== tag.name);
        await tx.timeSession.update({
          where: { id: session.id },
          data: { tags: updatedTags },
        });
      }

      // Delete the tag
      await tx.tag.delete({
        where: { id },
      });
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete tag:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete tag',
    };
  }
}

/**
 * Get all tags for the current user with optional filtering
 */
export async function getTags(filters?: TagFilterOptions): Promise<TagWithStats[]> {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const validatedFilters = tagFilterSchema.parse(filters || {});

    // Build where clause
    const where: any = { userId };

    if (validatedFilters.search) {
      where.name = {
        contains: validatedFilters.search,
        mode: 'insensitive',
      };
    }

    // Get tags with usage statistics
    const tags = await prisma.tag.findMany({
      where,
      take: validatedFilters.limit,
      orderBy: getSortOrder(validatedFilters.sortBy, validatedFilters.sortOrder),
    });

    // Get usage statistics for each tag
    const tagsWithStats: TagWithStats[] = await Promise.all(
      tags.map(async (tag) => {
        const usageCount = await prisma.timeSession.count({
          where: {
            userId,
            tags: { has: tag.name },
          },
        });

        const lastUsedSession = await prisma.timeSession.findFirst({
          where: {
            userId,
            tags: { has: tag.name },
          },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        });

        return {
          ...tag,
          usageCount,
          lastUsed: lastUsedSession?.createdAt,
          isActive: usageCount > 0,
        };
      })
    );

    // Filter out unused tags if requested
    if (!validatedFilters.includeUnused) {
      return tagsWithStats.filter(tag => tag.usageCount! > 0);
    }

    return tagsWithStats;
  } catch (error) {
    console.error('Failed to get tags:', error);
    throw new Error('Failed to get tags');
  }
}

/**
 * Get tag suggestions based on query
 */
export async function getTagSuggestions(query: string, limit: number = 10) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const normalizedQuery = query.toLowerCase().trim();
    if (normalizedQuery.length < 1) {
      return [];
    }

    // Get existing tags that match the query
    const matchingTags = await prisma.tag.findMany({
      where: {
        userId,
        name: {
          contains: normalizedQuery,
          mode: 'insensitive',
        },
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    // Get usage count for each tag
    const suggestions = await Promise.all(
      matchingTags.map(async (tag) => {
        const usageCount = await prisma.timeSession.count({
          where: {
            userId,
            tags: { has: tag.name },
          },
        });

        return {
          id: tag.id,
          name: tag.name,
          color: tag.color,
          usageCount,
          category: 'existing',
          isNew: false,
        };
      })
    );

    // If no exact matches, suggest creating a new tag
    const hasExactMatch = suggestions.some(
      suggestion => suggestion.name.toLowerCase() === normalizedQuery
    );

    if (!hasExactMatch && suggestions.length < limit) {
      suggestions.push({
        id: 'new',
        name: normalizedQuery,
        color: null,
        usageCount: 0,
        category: 'new',
        isNew: true,
      });
    }

    return suggestions.slice(0, limit);
  } catch (error) {
    console.error('Failed to get tag suggestions:', error);
    return [];
  }
}

/**
 * Get popular tags (most frequently used)
 */
export async function getPopularTags(limit: number = 10) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Get all sessions with tags
    const sessions = await prisma.timeSession.findMany({
      where: {
        userId,
        tags: { isEmpty: false },
      },
      select: { tags: true },
    });

    // Count tag usage
    const tagCounts = new Map<string, number>();
    sessions.forEach(session => {
      session.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    // Sort by usage and get top tags
    const sortedTags = Array.from(tagCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);

    // Get tag details
    const popularTags = await Promise.all(
      sortedTags.map(async ([tagName, usageCount]) => {
        const tag = await prisma.tag.findFirst({
          where: { userId, name: tagName },
        });

        return {
          id: tag?.id || tagName,
          name: tagName,
          color: tag?.color,
          usageCount,
          category: 'popular',
          isNew: false,
        };
      })
    );

    return popularTags;
  } catch (error) {
    console.error('Failed to get popular tags:', error);
    return [];
  }
}

/**
 * Merge two tags together
 */
export async function mergeTags(sourceId: string, targetId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Get both tags
    const [sourceTag, targetTag] = await Promise.all([
      prisma.tag.findFirst({ where: { id: sourceId, userId } }),
      prisma.tag.findFirst({ where: { id: targetId, userId } }),
    ]);

    if (!sourceTag || !targetTag) {
      throw new Error('One or both tags not found');
    }

    if (sourceTag.id === targetTag.id) {
      throw new Error('Cannot merge tag with itself');
    }

    await prisma.$transaction(async (tx) => {
      // Update all sessions that have the source tag
      const sessions = await tx.timeSession.findMany({
        where: {
          userId,
          tags: { has: sourceTag.name },
        },
      });

      for (const session of sessions) {
        const updatedTags = session.tags
          .map(tag => tag === sourceTag.name ? targetTag.name : tag)
          .filter((tag, index, arr) => arr.indexOf(tag) === index); // Remove duplicates

        await tx.timeSession.update({
          where: { id: session.id },
          data: { tags: updatedTags },
        });
      }

      // Delete the source tag
      await tx.tag.delete({
        where: { id: sourceId },
      });
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to merge tags:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to merge tags',
    };
  }
}

/**
 * Bulk delete tags
 */
export async function bulkDeleteTags(tagIds: string[]) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Get all tags to be deleted
    const tags = await prisma.tag.findMany({
      where: {
        id: { in: tagIds },
        userId,
      },
    });

    if (tags.length === 0) {
      throw new Error('No tags found');
    }

    const tagNames = tags.map(tag => tag.name);

    await prisma.$transaction(async (tx) => {
      // Update all sessions that have any of these tags
      const sessions = await tx.timeSession.findMany({
        where: {
          userId,
          tags: { hasSome: tagNames },
        },
      });

      for (const session of sessions) {
        const updatedTags = session.tags.filter(tag => !tagNames.includes(tag));
        await tx.timeSession.update({
          where: { id: session.id },
          data: { tags: updatedTags },
        });
      }

      // Delete all tags
      await tx.tag.deleteMany({
        where: {
          id: { in: tagIds },
          userId,
        },
      });
    });

    revalidatePath('/');
    return { success: true, deletedCount: tags.length };
  } catch (error) {
    console.error('Failed to bulk delete tags:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete tags',
    };
  }
}

/**
 * Get tag statistics
 */
export async function getTagStats() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const [totalTags, sessions] = await Promise.all([
      prisma.tag.count({ where: { userId } }),
      prisma.timeSession.findMany({
        where: { userId },
        select: { tags: true, createdAt: true },
      }),
    ]);

    // Calculate tag usage statistics
    const tagUsage = new Map<string, number>();
    let totalTaggedSessions = 0;

    sessions.forEach(session => {
      if (session.tags.length > 0) {
        totalTaggedSessions++;
        session.tags.forEach(tag => {
          tagUsage.set(tag, (tagUsage.get(tag) || 0) + 1);
        });
      }
    });

    const activeTags = tagUsage.size;
    const unusedTags = totalTags - activeTags;
    const averageUsagePerTag = activeTags > 0 ? totalTaggedSessions / activeTags : 0;

    // Find most used tag
    let mostUsedTag: { name: string; count: number } | undefined;
    if (tagUsage.size > 0) {
      const [name, count] = Array.from(tagUsage.entries()).reduce((a, b) => 
        a[1] > b[1] ? a : b
      );
      mostUsedTag = { name, count };
    }

    return {
      totalTags,
      activeTags,
      unusedTags,
      averageUsagePerTag,
      mostUsedTag,
      totalTaggedSessions,
    };
  } catch (error) {
    console.error('Failed to get tag stats:', error);
    throw new Error('Failed to get tag statistics');
  }
}

// Helper function to get sort order
function getSortOrder(sortBy: string, sortOrder: string) {
  switch (sortBy) {
    case 'name':
    case 'alphabetical':
      return { name: sortOrder as 'asc' | 'desc' };
    case 'recent':
      return { updatedAt: 'desc' as const };
    default:
      return { name: 'asc' as const };
  }
}
