// prisma/seed.ts - Sample data for testing
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a demo user
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      password: hashedPassword,
      preferences: {
        create: {
          theme: 'system',
          studyGoalMinutes: 120,
          notifications: true,
          emailNotifications: true,
          defaultView: 'grid',
          autoSave: true,
          pomodoroFocus: 25,
          pomodoroBreak: 5,
          pomodoroLongBreak: 15
        }
      }
    },
    include: {
      preferences: true
    }
  });

  console.log('👤 Created demo user:', user.email);

  // Create sample folders
  const mathFolder = await prisma.studyFolder.create({
    data: {
      name: 'Mathematics',
      description: 'Math study materials',
      color: '#3b82f6',
      userId: user.id
    }
  });

  const scienceFolder = await prisma.studyFolder.create({
    data: {
      name: 'Science',
      description: 'Science study materials',
      color: '#10b981',
      userId: user.id
    }
  });

  // Create sample materials
  const materials = await Promise.all([
    prisma.studyMaterial.create({
      data: {
        title: 'Algebra Fundamentals',
        description: 'Basic algebra concepts and equations',
        type: 'pdf',
        category: 'Mathematics',
        tags: ['algebra', 'equations', 'fundamentals'],
        userId: user.id,
        folderId: mathFolder.id,
        progress: 75
      }
    }),
    prisma.studyMaterial.create({
      data: {
        title: 'Physics: Motion and Forces',
        description: 'Introduction to classical mechanics',
        type: 'video',
        category: 'Physics',
        tags: ['physics', 'mechanics', 'forces'],
        userId: user.id,
        folderId: scienceFolder.id,
        progress: 45
      }
    }),
    prisma.studyMaterial.create({
      data: {
        title: 'Chemistry Periodic Table',
        description: 'Interactive periodic table reference',
        type: 'url',
        url: 'https://ptable.com/',
        category: 'Chemistry',
        tags: ['chemistry', 'periodic-table', 'elements'],
        userId: user.id,
        folderId: scienceFolder.id
      }
    })
  ]);

  console.log('📚 Created sample materials:', materials.length);

  // Create sample flashcard deck
  const deck = await prisma.flashcardDeck.create({
    data: {
      name: 'Basic Algebra',
      description: 'Essential algebra concepts',
      color: '#8b5cf6',
      userId: user.id,
      cards: {
        create: [
          {
            front: 'What is the solution to x + 5 = 10?',
            back: 'x = 5',
            difficulty: 'easy'
          },
          {
            front: 'Solve for y: 2y - 4 = 8',
            back: 'y = 6',
            difficulty: 'normal'
          },
          {
            front: 'What is the quadratic formula?',
            back: 'x = (-b ± √(b² - 4ac)) / 2a',
            difficulty: 'hard'
          }
        ]
      }
    },
    include: {
      cards: true
    }
  });

  // Create deck stats
  await prisma.deckStats.create({
    data: {
      deckId: deck.id,
      totalCards: deck.cards.length,
      newCards: deck.cards.length,
      learningCards: 0,
      reviewCards: 0,
      suspendedCards: 0
    }
  });

  console.log('🎴 Created sample flashcard deck with stats');

  // Create sample notes
  const notes = await Promise.all([
    prisma.note.create({
      data: {
        title: 'Linear Equations Notes',
        content: '# Linear Equations\n\nA linear equation is an equation that makes a straight line when graphed.\n\n## Standard Form\nax + by = c\n\n## Examples\n- y = 2x + 3\n- 3x + 4y = 12',
        tags: ['algebra', 'linear-equations'],
        userId: user.id
      }
    }),
    prisma.note.create({
      data: {
        title: 'Newton\'s Laws Summary',
        content: '# Newton\'s Laws of Motion\n\n## First Law (Inertia)\nAn object at rest stays at rest, and an object in motion stays in motion, unless acted upon by an external force.\n\n## Second Law\nF = ma (Force equals mass times acceleration)\n\n## Third Law\nFor every action, there is an equal and opposite reaction.',
        tags: ['physics', 'newton', 'motion'],
        userId: user.id,
        isPinned: true
      }
    })
  ]);

  console.log('📝 Created sample notes:', notes.length);

  // Create sample study sessions
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  await Promise.all([
    prisma.studySession.create({
      data: {
        type: 'pomodoro',
        duration: 25,
        plannedDuration: 25,
        focusRating: 4,
        notes: 'Good focus session on algebra',
        completed: true,
        userId: user.id,
        startedAt: yesterday,
        endedAt: new Date(yesterday.getTime() + 25 * 60 * 1000)
      }
    }),
    prisma.studySession.create({
      data: {
        type: 'custom',
        duration: 45,
        plannedDuration: 60,
        focusRating: 3,
        notes: 'Physics review - interrupted by phone call',
        completed: true,
        userId: user.id,
        startedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        endedAt: new Date(now.getTime() - 75 * 60 * 1000)
      }
    })
  ]);

  console.log('⏱️ Created sample study sessions');

  // Create sample goals
  const goal = await prisma.goal.create({
    data: {
      title: 'Study 2 hours daily',
      description: 'Maintain consistent study habit',
      type: 'time',
      target: 120, // minutes
      current: 70,
      unit: 'minutes',
      deadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      priority: 'high',
      userId: user.id
    }
  });

  console.log('🎯 Created sample goal');

  // Create daily study aggregate for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  await prisma.dailyStudyAggregate.create({
    data: {
      userId: user.id,
      date: today,
      totalMinutes: 70,
      sessionsCount: 2,
      materialsViewed: 3,
      notesCreated: 1,
      cardsReviewed: 5,
      averageFocusRating: 3.5
    }
  });

  console.log('📊 Created sample analytics data');
  console.log('✅ Seeding completed successfully!');
  console.log('\n🔑 Demo login credentials:');
  console.log('Email: demo@example.com');
  console.log('Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });