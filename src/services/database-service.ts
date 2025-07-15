// Core database service with common query patterns
import { prisma } from '../lib/prisma';
import { ErrorHandler, DatabaseError } from '../lib/errors';
import type { 
  PaginationParams, 
  SortParams, 
  PaginatedResponse 
} from '../types/actions';

// =============================================================================
// Generic Database Operations
// =============================================================================

export class DatabaseService {
  /**
   * Generic paginated query with sorting
   */
  static async paginate<T>(
    model: any,
    where: any = {},
    options: PaginationParams & SortParams & { include?: any; select?: any } = {}
  ): Promise<PaginatedResponse<T>> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      include,
      select,
    } = options;

    const skip = (page - 1) * pageSize;

    try {
      const [data, total] = await Promise.all([
        model.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
          ...(include && { include }),
          ...(select && { select }),
        }),
        model.count({ where }),
      ]);

      const totalPages = Math.ceil(total / pageSize);

      return {
        data,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error('Database pagination error:', error);
      throw new DatabaseError('Failed to fetch paginated data');
    }
  }

  /**
   * Generic soft delete (set isArchived = true)
   */
  static async softDelete(model: any, id: string, userId: string) {
    try {
      const result = await model.update({
        where: { 
          id,
          userId, // Ensure ownership
        },
        data: { isArchived: true },
      });

      return result;
    } catch (error) {
      console.error('Soft delete error:', error);
      throw new DatabaseError('Failed to archive item');
    }
  }

  /**
   * Generic restore from soft delete
   */
  static async restore(model: any, id: string, userId: string) {
    try {
      const result = await model.update({
        where: { 
          id,
          userId,
        },
        data: { isArchived: false },
      });

      return result;
    } catch (error) {
      console.error('Restore error:', error);
      throw new DatabaseError('Failed to restore item');
    }
  }

  /**
   * Bulk operations with ownership validation
   */
  static async bulkOperation(
    model: any,
    operation: 'delete' | 'archive' | 'restore',
    ids: string[],
    userId: string
  ) {
    try {
      // First verify all items belong to the user
      const count = await model.count({
        where: {
          id: { in: ids },
          userId,
        },
      });

      if (count !== ids.length) {
        throw new Error('Some items not found or not owned by user');
      }

      let result;
      switch (operation) {
        case 'delete':
          result = await model.deleteMany({
            where: {
              id: { in: ids },
              userId,
            },
          });
          break;
        
        case 'archive':
          result = await model.updateMany({
            where: {
              id: { in: ids },
              userId,
            },
            data: { isArchived: true },
          });
          break;
        
        case 'restore':
          result = await model.updateMany({
            where: {
              id: { in: ids },
              userId,
            },
            data: { isArchived: false },
          });
          break;
        
        default:
          throw new Error(`Invalid operation: ${operation}`);
      }

      return result;
    } catch (error) {
      console.error('Bulk operation error:', error);
      throw new DatabaseError(`Failed to ${operation} items`);
    }
  }

  /**
   * Search with full-text capabilities
   */
  static async search<T>(
    model: any,
    searchTerm: string,
    searchFields: string[],
    userId: string,
    options: PaginationParams & SortParams & { include?: any; where?: any } = {}
  ): Promise<PaginatedResponse<T>> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      include,
      where: additionalWhere = {},
    } = options;

    const searchConditions = searchFields.map(field => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive' as const,
      },
    }));

    const where = {
      userId,
      OR: searchConditions,
      ...additionalWhere,
    };

    return this.paginate<T>(model, where, {
      page,
      pageSize,
      sortBy,
      sortOrder,
      include,
    });
  }
}

// =============================================================================
// User-specific Database Operations
// =============================================================================

export class UserService {
  static async createUser(data: {
    clerkId: string;
    email: string;
    name?: string;
    imageUrl?: string;
  }) {
    try {
      return await prisma.user.create({
        data: {
          ...data,
          preferences: {
            create: {
              theme: 'system',
              pomodoroWorkDuration: 25,
              pomodoroShortBreakDuration: 5,
              pomodoroLongBreakDuration: 15,
              pomodoroLongBreakInterval: 4,
              soundEnabled: true,
              notificationsEnabled: true,
              autoStartBreaks: false,
              autoStartPomodoros: false,
            },
          },
        },
        include: { preferences: true },
      });
    } catch (error) {
      console.error('Create user error:', error);
      throw new DatabaseError('Failed to create user');
    }
  }

  static async getUserByClerkId(clerkId: string) {
    try {
      return await prisma.user.findUnique({
        where: { clerkId },
        include: { preferences: true },
      });
    } catch (error) {
      console.error('Get user error:', error);
      throw new DatabaseError('Failed to fetch user');
    }
  }

  static async updateUserPreferences(userId: string, preferences: any) {
    try {
      return await prisma.userPreferences.upsert({
        where: { userId },
        update: preferences,
        create: {
          userId,
          ...preferences,
        },
      });
    } catch (error) {
      console.error('Update preferences error:', error);
      throw new DatabaseError('Failed to update preferences');
    }
  }

  static async updateUser(userId: string, data: { name?: string; imageUrl?: string }) {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data,
        include: { preferences: true },
      });
    } catch (error) {
      console.error('Update user error:', error);
      throw new DatabaseError('Failed to update user');
    }
  }

  static async deleteUser(userId: string) {
    try {
      return await prisma.user.delete({
        where: { id: userId },
      });
    } catch (error) {
      console.error('Delete user error:', error);
      throw new DatabaseError('Failed to delete user');
    }
  }

  static async getUserPreferences(userId: string) {
    try {
      return await prisma.userPreferences.findUnique({
        where: { userId },
      });
    } catch (error) {
      console.error('Get preferences error:', error);
      throw new DatabaseError('Failed to get user preferences');
    }
  }
}

// =============================================================================
// Project-specific Database Operations
// =============================================================================

export class ProjectService {
  static async createProject(data: {
    userId: string;
    name: string;
    description?: string;
    color?: string;
    isArchived?: boolean;
  }) {
    try {
      return await prisma.project.create({
        data: {
          ...data,
          isArchived: data.isArchived || false,
        },
      });
    } catch (error) {
      console.error('Create project error:', error);
      throw new DatabaseError('Failed to create project');
    }
  }

  static async getProjectById(projectId: string, userId: string) {
    try {
      return await prisma.project.findFirst({
        where: {
          id: projectId,
          userId,
        },
        include: {
          _count: {
            select: { timeSessions: true },
          },
        },
      });
    } catch (error) {
      console.error('Get project error:', error);
      throw new DatabaseError('Failed to fetch project');
    }
  }

  static async updateProject(projectId: string, userId: string, data: {
    name?: string;
    description?: string;
    color?: string;
    isArchived?: boolean;
  }) {
    try {
      return await prisma.project.update({
        where: {
          id: projectId,
          userId,
        },
        data,
      });
    } catch (error) {
      console.error('Update project error:', error);
      throw new DatabaseError('Failed to update project');
    }
  }

  static async deleteProject(projectId: string, userId: string) {
    try {
      return await prisma.project.update({
        where: {
          id: projectId,
          userId,
        },
        data: {
          isArchived: true,
        },
      });
    } catch (error) {
      console.error('Delete project error:', error);
      throw new DatabaseError('Failed to delete project');
    }
  }

  static async bulkUpdateProjects(projectIds: string[], userId: string, data: any) {
    try {
      return await prisma.project.updateMany({
        where: {
          id: { in: projectIds },
          userId,
        },
        data,
      });
    } catch (error) {
      console.error('Bulk update projects error:', error);
      throw new DatabaseError('Failed to bulk update projects');
    }
  }

  static async bulkDeleteProjects(projectIds: string[], userId: string) {
    try {
      return await prisma.project.updateMany({
        where: {
          id: { in: projectIds },
          userId,
        },
        data: {
          isArchived: true,
        },
      });
    } catch (error) {
      console.error('Bulk delete projects error:', error);
      throw new DatabaseError('Failed to bulk delete projects');
    }
  }

  static async getUserProjects(
    userId: string,
    options: {
      search?: string;
      isArchived?: boolean;
      includeStats?: boolean;
    } & PaginationParams & SortParams = {}
  ) {
    const {
      search,
      isArchived = false,
      includeStats = false,
      ...paginationOptions
    } = options;

    let where: any = {
      userId,
      isArchived,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const include = includeStats ? {
      timeSessions: {
        select: {
          duration: true,
          createdAt: true,
        },
      },
      _count: {
        select: { timeSessions: true },
      },
    } : undefined;

    try {
      return await DatabaseService.paginate(
        prisma.project,
        where,
        { ...paginationOptions, include }
      );
    } catch (error) {
      console.error('Get projects error:', error);
      throw new DatabaseError('Failed to fetch projects');
    }
  }

  static async getProjectStats(projectId: string, userId: string) {
    try {
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
        include: {
          timeSessions: {
            select: {
              duration: true,
              createdAt: true,
              sessionType: true,
            },
          },
          _count: {
            select: { timeSessions: true },
          },
        },
      });

      if (!project) {
        return null;
      }

      const totalTime = project.timeSessions.reduce(
        (sum, session) => sum + session.duration,
        0
      );

      const lastSession = project.timeSessions
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

      return {
        ...project,
        totalTime,
        lastSessionAt: lastSession?.createdAt || null,
        focusTime: project.timeSessions
          .filter(s => s.sessionType === 'FOCUS')
          .reduce((sum, s) => sum + s.duration, 0),
      };
    } catch (error) {
      console.error('Get project stats error:', error);
      throw new DatabaseError('Failed to fetch project statistics');
    }
  }
}

// =============================================================================
// Session-specific Database Operations
// =============================================================================

export class SessionService {
  static async createSession(data: {
    userId: string;
    startTime: Date;
    endTime?: Date;
    duration: number;
    description?: string;
    isPomodoro?: boolean;
    sessionType?: string;
    projectId?: string;
  }) {
    try {
      return await prisma.timeSession.create({
        data: {
          ...data,
          sessionType: (data.sessionType as any) || 'FOCUS',
          isPomodoro: data.isPomodoro || false,
        },
        include: {
          project: {
            select: { id: true, name: true, color: true },
          },
        },
      });
    } catch (error) {
      console.error('Create session error:', error);
      throw new DatabaseError('Failed to create session');
    }
  }

  static async getSessionById(sessionId: string, userId: string) {
    try {
      return await prisma.timeSession.findFirst({
        where: {
          id: sessionId,
          userId,
        },
        include: {
          project: {
            select: { id: true, name: true, color: true },
          },
        },
      });
    } catch (error) {
      console.error('Get session error:', error);
      throw new DatabaseError('Failed to fetch session');
    }
  }

  static async updateSession(sessionId: string, userId: string, data: {
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    description?: string;
    isPomodoro?: boolean;
    sessionType?: string;
    projectId?: string;
  }) {
    try {
      return await prisma.timeSession.update({
        where: {
          id: sessionId,
          userId,
        },
        data: {
          ...data,
          sessionType: data.sessionType as any,
        },
        include: {
          project: {
            select: { id: true, name: true, color: true },
          },
        },
      });
    } catch (error) {
      console.error('Update session error:', error);
      throw new DatabaseError('Failed to update session');
    }
  }

  static async deleteSession(sessionId: string, userId: string) {
    try {
      return await prisma.timeSession.delete({
        where: {
          id: sessionId,
          userId,
        },
      });
    } catch (error) {
      console.error('Delete session error:', error);
      throw new DatabaseError('Failed to delete session');
    }
  }

  static async getActiveSession(userId: string) {
    try {
      return await prisma.timeSession.findFirst({
        where: {
          userId,
          endTime: null,
        },
        include: {
          project: {
            select: { id: true, name: true, color: true },
          },
        },
        orderBy: { startTime: 'desc' },
      });
    } catch (error) {
      console.error('Get active session error:', error);
      throw new DatabaseError('Failed to fetch active session');
    }
  }

  static async bulkDeleteSessions(sessionIds: string[], userId: string) {
    try {
      return await prisma.timeSession.deleteMany({
        where: {
          id: { in: sessionIds },
          userId,
        },
      });
    } catch (error) {
      console.error('Bulk delete sessions error:', error);
      throw new DatabaseError('Failed to bulk delete sessions');
    }
  }

  static async getUserSessions(
    userId: string,
    filters: {
      projectId?: string;
      sessionType?: string;
      dateFrom?: Date;
      dateTo?: Date;
      isPomodoro?: boolean;
      tags?: string[];
      isCompleted?: boolean;
    } & PaginationParams & SortParams = {}
  ) {
    const {
      projectId,
      sessionType,
      dateFrom,
      dateTo,
      isPomodoro,
      tags,
      isCompleted,
      ...paginationOptions
    } = filters;

    let where: any = { userId };

    if (projectId) where.projectId = projectId;
    if (sessionType) where.sessionType = sessionType;
    if (isPomodoro !== undefined) where.isPomodoro = isPomodoro;
    if (isCompleted !== undefined) where.isCompleted = isCompleted;
    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }
    if (dateFrom || dateTo) {
      where.startTime = {};
      if (dateFrom) where.startTime.gte = dateFrom;
      if (dateTo) where.startTime.lte = dateTo;
    }

    try {
      return await DatabaseService.paginate(
        prisma.timeSession,
        where,
        {
          ...paginationOptions,
          include: {
            project: {
              select: { id: true, name: true, color: true },
            },
          },
        }
      );
    } catch (error) {
      console.error('Get sessions error:', error);
      throw new DatabaseError('Failed to fetch sessions');
    }
  }

  static async getDailyStats(userId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      const sessions = await prisma.timeSession.findMany({
        where: {
          userId,
          startTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          project: {
            select: { id: true, name: true, color: true },
          },
        },
      });

      const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
      const focusTime = sessions
        .filter(s => s.sessionType === 'FOCUS')
        .reduce((sum, s) => sum + s.duration, 0);
      const breakTime = sessions
        .filter(s => s.sessionType !== 'FOCUS')
        .reduce((sum, s) => sum + s.duration, 0);

      return {
        date: date.toISOString().split('T')[0],
        totalTime,
        focusTime,
        breakTime,
        sessionsCount: sessions.length,
        pomodoroSessions: sessions.filter(s => s.isPomodoro).length,
        projects: sessions.reduce((acc, session) => {
          if (!session.project) return acc;
          
          const existing = acc.find(p => p.projectId === session.project!.id);
          if (existing) {
            existing.time += session.duration;
          } else {
            acc.push({
              projectId: session.project.id,
              projectName: session.project.name,
              projectColor: session.project.color,
              time: session.duration,
            });
          }
          return acc;
        }, [] as any[]),
      };
    } catch (error) {
      console.error('Get daily stats error:', error);
      throw new DatabaseError('Failed to fetch daily statistics');
    }
  }
}

// =============================================================================
// Tag-specific Database Operations
// =============================================================================

export class TagService {
  static async getUserTags(userId: string, includeUsage = false) {
    try {
      const tags = await prisma.tag.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
      });

      if (!includeUsage) {
        return tags;
      }

      // Get usage counts for each tag
      const tagsWithUsage = await Promise.all(
        tags.map(async (tag) => {
          // Count sessions that include this tag
          const usageCount = await prisma.timeSession.count({
            where: {
              userId,
              tags: { has: tag.name },
            },
          });

          return {
            ...tag,
            _count: { usage: usageCount },
          };
        })
      );

      return tagsWithUsage;
    } catch (error) {
      console.error('Get tags error:', error);
      throw new DatabaseError('Failed to fetch tags');
    }
  }

  static async getTagSuggestions(userId: string, searchTerm: string, limit = 10) {
    try {
      // Get existing tags that match the search
      const existingTags = await prisma.tag.findMany({
        where: {
          userId,
          name: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        take: limit,
      });

      // Get frequently used tags from sessions
      const sessions = await prisma.timeSession.findMany({
        where: { userId },
        select: { tags: true },
        take: 1000, // Limit for performance
      });

      const tagUsage = new Map<string, number>();
      sessions.forEach(session => {
        session.tags.forEach(tag => {
          if (tag.toLowerCase().includes(searchTerm.toLowerCase())) {
            tagUsage.set(tag, (tagUsage.get(tag) || 0) + 1);
          }
        });
      });

      const suggestions = Array.from(tagUsage.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name, count]) => ({
          name,
          usageCount: count,
          color: existingTags.find(t => t.name === name)?.color || '#6b7280',
        }));

      return suggestions;
    } catch (error) {
      console.error('Get tag suggestions error:', error);
      throw new DatabaseError('Failed to fetch tag suggestions');
    }
  }
}

// =============================================================================
// Achievement-specific Database Operations
// =============================================================================

export class AchievementService {
  static async getUserAchievements(userId: string) {
    try {
      const userAchievements = await prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        orderBy: { unlockedAt: 'desc' },
      });

      const allAchievements = await prisma.achievement.findMany({
        orderBy: { createdAt: 'asc' },
      });

      // Combine unlocked and locked achievements
      const achievements = allAchievements.map(achievement => {
        const userAchievement = userAchievements.find(
          ua => ua.achievementId === achievement.id
        );

        return {
          achievement,
          isUnlocked: !!userAchievement,
          unlockedAt: userAchievement?.unlockedAt || null,
          progress: 0, // Will be calculated based on criteria
          target: 0, // Will be extracted from criteria
          progressPercentage: 0,
        };
      });

      return achievements;
    } catch (error) {
      console.error('Get achievements error:', error);
      throw new DatabaseError('Failed to fetch achievements');
    }
  }

  static async checkAndUnlockAchievements(userId: string) {
    try {
      // This will be implemented with specific achievement logic
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Check achievements error:', error);
      throw new DatabaseError('Failed to check achievements');
    }
  }
}
