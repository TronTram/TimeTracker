import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (development only)
  console.log('🧹 Clearing existing data...');
  await prisma.userAchievement.deleteMany();
  await prisma.timeSession.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.project.deleteMany();
  await prisma.streak.deleteMany();
  await prisma.userPreferences.deleteMany();
  await prisma.user.deleteMany();
  await prisma.achievement.deleteMany();

  // Create default achievements
  console.log('🏆 Creating achievements...');
  const achievements = await prisma.achievement.createMany({
    data: [
      // Time-based achievements
      {
        title: 'First Session',
        description: 'Complete your first focus session',
        type: 'FIRST_SESSION',
        category: 'TIME',
        maxProgress: 1,
        iconName: 'Timer',
      },
      {
        title: 'Hour Master',
        description: 'Accumulate 1 hour of focus time',
        type: 'TOTAL_TIME_10_HOURS',
        category: 'TIME',
        maxProgress: 3600,
        iconName: 'Clock',
      },
      {
        title: 'Deep Work Champion',
        description: 'Accumulate 10 hours of focus time',
        type: 'TOTAL_TIME_100_HOURS',
        category: 'TIME',
        maxProgress: 36000,
        iconName: 'Brain',
      },
      {
        title: 'Focus Marathon',
        description: 'Accumulate 50 hours of focus time',
        type: 'TOTAL_TIME_1000_HOURS',
        category: 'TIME',
        maxProgress: 180000,
        iconName: 'Trophy',
      },

      // Session-based achievements
      {
        title: 'Getting Started',
        description: 'Complete 5 focus sessions',
        type: 'SESSIONS_100',
        category: 'FOCUS',
        maxProgress: 5,
        iconName: 'Target',
      },
      {
        title: 'Session Warrior',
        description: 'Complete 25 focus sessions',
        type: 'SESSIONS_500',
        category: 'FOCUS',
        maxProgress: 25,
        iconName: 'Zap',
      },
      {
        title: 'Session Master',
        description: 'Complete 100 focus sessions',
        type: 'SESSIONS_1000',
        category: 'FOCUS',
        maxProgress: 100,
        iconName: 'Star',
      },

      // Streak-based achievements
      {
        title: 'Consistency Builder',
        description: 'Maintain a 3-day focus streak',
        type: 'STREAK_7_DAYS',
        category: 'STREAK',
        maxProgress: 3,
        iconName: 'Flame',
      },
      {
        title: 'Week Warrior',
        description: 'Maintain a 7-day focus streak',
        type: 'STREAK_30_DAYS',
        category: 'STREAK',
        maxProgress: 7,
        iconName: 'Calendar',
      },
      {
        title: 'Unstoppable',
        description: 'Maintain a 30-day focus streak',
        type: 'STREAK_100_DAYS',
        category: 'STREAK',
        maxProgress: 30,
        iconName: 'Crown',
      },

      // Project-based achievements
      {
        title: 'Project Starter',
        description: 'Create your first project',
        type: 'PROJECTS_10',
        category: 'PROJECT',
        maxProgress: 1,
        iconName: 'FolderPlus',
      },
      {
        title: 'Project Organizer',
        description: 'Create 5 projects',
        type: 'PROJECT_MASTER',
        category: 'PROJECT',
        maxProgress: 5,
        iconName: 'Folders',
      },
      {
        title: 'Project Specialist',
        description: 'Spend 10 hours on a single project',
        type: 'PERFECT_WEEK',
        category: 'PROJECT',
        maxProgress: 36000,
        iconName: 'Award',
      },

      // Special achievements
      {
        title: 'Night Owl',
        description: 'Complete a session after 10 PM',
        type: 'NIGHT_OWL',
        category: 'SPECIAL',
        maxProgress: 1,
        iconName: 'Moon',
      },
      {
        title: 'Early Bird',
        description: 'Complete a session before 6 AM',
        type: 'EARLY_BIRD',
        category: 'SPECIAL',
        maxProgress: 1,
        iconName: 'Sun',
      },
      {
        title: 'Pomodoro Pro',
        description: 'Complete 10 Pomodoro sessions',
        type: 'BREAK_MASTER',
        category: 'SPECIAL',
        maxProgress: 10,
        iconName: 'TimerIcon',
      },
    ],
  });

  console.log(`✅ Created ${achievements.count} achievements`);

  // Create a demo user (for development)
  console.log('👤 Creating demo user...');
  const demoUser = await prisma.user.create({
    data: {
      clerkId: 'demo_user_123',
      email: 'demo@example.com',
      name: 'Demo User',
      imageUrl: 'https://github.com/shadcn.png',
      preferences: {
        create: {
          pomodoroWorkDuration: 25,
          pomodoroShortBreakDuration: 5,
          pomodoroLongBreakDuration: 15,
          pomodoroLongBreakInterval: 4,
          soundEnabled: true,
          notificationsEnabled: true,
          theme: 'system',
          autoStartPomodoros: false,
          autoStartBreaks: false,
        },
      },
    },
    include: {
      preferences: true,
    },
  });

  console.log(`✅ Created demo user: ${demoUser.name}`);

  // Create demo projects
  console.log('📁 Creating demo projects...');
  const projects = await prisma.project.createMany({
    data: [
      {
        userId: demoUser.id,
        name: 'Learning TypeScript',
        description: 'Deep dive into TypeScript fundamentals and advanced concepts',
        color: '#3b82f6', // blue
      },
      {
        userId: demoUser.id,
        name: 'React Native App',
        description: 'Building a mobile app with React Native and Expo',
        color: '#10b981', // emerald
      },
      {
        userId: demoUser.id,
        name: 'Reading: Clean Code',
        description: 'Reading and taking notes on Clean Code by Robert Martin',
        color: '#f59e0b', // amber
      },
      {
        userId: demoUser.id,
        name: 'Side Project',
        description: 'Personal side project development',
        color: '#8b5cf6', // violet
      },
    ],
  });

  console.log(`✅ Created ${projects.count} demo projects`);

  // Get created projects for creating sessions
  const createdProjects = await prisma.project.findMany({
    where: { userId: demoUser.id },
  });

  // Create demo tags
  console.log('🏷️ Creating demo tags...');
  const tags = await prisma.tag.createMany({
    data: [
      {
        userId: demoUser.id,
        name: 'coding',
        color: '#3b82f6',
      },
      {
        userId: demoUser.id,
        name: 'reading',
        color: '#10b981',
      },
      {
        userId: demoUser.id,
        name: 'learning',
        color: '#f59e0b',
      },
      {
        userId: demoUser.id,
        name: 'urgent',
        color: '#ef4444',
      },
      {
        userId: demoUser.id,
        name: 'review',
        color: '#8b5cf6',
      },
    ],
  });

  console.log(`✅ Created ${tags.count} demo tags`);

  // Create some demo time sessions (past 7 days)
  console.log('⏱️ Creating demo time sessions...');
  const sessions = [];
  const now = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // 2-4 sessions per day
    const sessionCount = Math.floor(Math.random() * 3) + 2;
    
    for (let j = 0; j < sessionCount; j++) {
      const startHour = 9 + Math.floor(Math.random() * 8); // 9 AM to 5 PM
      const startTime = new Date(date);
      startTime.setHours(startHour, Math.floor(Math.random() * 60), 0, 0);
      
      const duration = 25 * 60 + Math.floor(Math.random() * 10 * 60); // 25-35 minutes
      const endTime = new Date(startTime.getTime() + duration * 1000);
      
      const project = createdProjects[Math.floor(Math.random() * createdProjects.length)];
      
      sessions.push({
        userId: demoUser.id,
        projectId: project.id,
        startTime,
        endTime,
        duration,
        sessionType: 'FOCUS' as const,
        isPomodoro: Math.random() > 0.5,
        tags: Math.random() > 0.5 ? ['coding', 'learning'] : ['learning'],
        description: Math.random() > 0.7 ? 'Great focus session! Made good progress.' : null,
      });
    }
  }

  const createdSessions = await prisma.timeSession.createMany({
    data: sessions,
  });

  console.log(`✅ Created ${createdSessions.count} demo time sessions`);

  // Create a streak record
  console.log('🔥 Creating streak record...');
  const streak = await prisma.streak.create({
    data: {
      userId: demoUser.id,
      currentStreak: 5,
      longestStreak: 12,
      lastActiveDate: new Date(),
    },
  });

  console.log(`✅ Created streak record: ${streak.currentStreak} days`);

  // Award some achievements to the demo user
  console.log('🏆 Awarding demo achievements...');
  const allAchievements = await prisma.achievement.findMany();
  const basicAchievements = allAchievements.filter((a: any) => 
    ['First Session', 'Getting Started', 'Project Starter', 'Consistency Builder'].includes(a.title)
  );

  const userAchievements = await prisma.userAchievement.createMany({
    data: basicAchievements.map((achievement: any) => ({
      userId: demoUser.id,
      achievementId: achievement.id,
      unlockedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in past week
    })),
  });

  console.log(`✅ Awarded ${userAchievements.count} achievements to demo user`);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Users: 1 (demo user)`);
  console.log(`- Projects: ${projects.count}`);
  console.log(`- Time sessions: ${createdSessions.count}`);
  console.log(`- Tags: ${tags.count}`);
  console.log(`- Achievements: ${achievements.count}`);
  console.log(`- User achievements: ${userAchievements.count}`);
  console.log(`- Streaks: 1`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });