import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Database connection helpers
export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
  }
}

// Health check function
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    };
  }
}

// Transaction wrapper with retry logic
export async function withTransaction<T>(
  operation: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        return await operation(tx);
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries) {
        console.error(`Transaction failed after ${maxRetries} attempts:`, lastError);
        throw lastError;
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.warn(`Transaction attempt ${attempt} failed, retrying in ${delay}ms...`);
    }
  }

  throw lastError!;
}

// Query optimization helpers
export const prismaQueryConfig = {
  // Common includes for related data
  userWithPreferences: {
    preferences: true,
  },
  
  projectWithSessions: {
    timeSessions: {
      orderBy: { startTime: 'desc' as const },
      take: 10,
    },
    _count: {
      select: { timeSessions: true },
    },
  },
  
  sessionWithProject: {
    project: {
      select: {
        id: true,
        name: true,
        color: true,
      },
    },
  },
  
  userWithAchievements: {
    achievements: {
      include: {
        achievement: true,
      },
      orderBy: { unlockedAt: 'desc' as const },
    },
  },
} as const;

// Database utility functions
export async function getUserByClerkId(clerkId: string) {
  return await prisma.user.findUnique({
    where: { clerkId },
    include: prismaQueryConfig.userWithPreferences,
  });
}

export async function createUserWithDefaults(userData: {
  clerkId: string;
  email: string;
  name?: string;
  imageUrl?: string;
}) {
  return await withTransaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: userData,
    });

    // Create default preferences
    await tx.userPreferences.create({
      data: {
        userId: user.id,
        // Default values are set in the schema
      },
    });

    // Create default streak record
    await tx.streak.create({
      data: {
        userId: user.id,
      },
    });

    return user;
  });
}

export default prisma;
