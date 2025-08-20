import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a demo user
  const demoUser = await prisma.user.upsert({
    where: { id: 'demo-user' },
    update: {},
    create: {
      id: 'demo-user',
      name: 'Demo User',
      email: 'demo@studyportal.com',
      createdAt: new Date(),
    },
  });

  // Create user preferences
  await prisma.userPreferences.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      theme: 'system',
      studyGoalMinutes: 120,
      notifications: true,
      emailNotifications: true,
      defaultView: 'grid',
      autoSave: true,
      pomodoroFocus: 25,
      pomodoroBreak: 5,
      pomodoroLongBreak: 15,
    },
  });

  // Create study folders
  const mathFolder = await prisma.studyFolder.create({
    data: {
      name: 'Mathematics',
      description: 'Math study materials and resources',
      color: '#3b82f6',
      userId: demoUser.id,
    },
  });

  const scienceFolder = await prisma.studyFolder.create({
    data: {
      name: 'Science',
      description: 'Physics, Chemistry, and Biology materials',
      color: '#10b981',
      userId: demoUser.id,
    },
  });

  // Create study materials
  const materials = [
    {
      title: 'Calculus Fundamentals',
      description: 'Comprehensive guide to differential and integral calculus',
      type: 'pdf',
      category: 'Mathematics',
      tags: ['calculus', 'derivatives', 'integrals'],
      folderId: mathFolder.id,
      userId: demoUser.id,
    },
    {
      title: 'Khan Academy - Linear Algebra',
      description: 'Online course covering vectors, matrices, and linear transformations',
      type: 'url',
      url: 'https://www.khanacademy.org/math/linear-algebra',
      category: 'Mathematics',
      tags: ['linear-algebra', 'vectors', 'matrices'],
      folderId: mathFolder.id,
      userId: demoUser.id,
    },
    {
      title: 'Physics: Mechanics',
      description: 'Classical mechanics textbook with problem sets',
      type: 'pdf',
      category: 'Science',
      tags: ['physics', 'mechanics', 'motion'],
      folderId: scienceFolder.id,
      userId: demoUser.id,
    },
    {
      title: 'MIT OpenCourseWare - Chemistry',
      description: 'Free chemistry course materials from MIT',
      type: 'url',
      url: 'https://ocw.mit.edu/courses/chemistry/',
      category: 'Science',
      tags: ['chemistry', 'mit', 'free-course'],
      folderId: scienceFolder.id,
      userId: demoUser.id,
    },
    {
      title: 'Data Structures and Algorithms',
      description: 'Computer Science fundamentals',
      type: 'doc',
      category: 'Computer Science',
      tags: ['algorithms', 'data-structures', 'programming'],
      userId: demoUser.id,
    },
  ];

  for (const material of materials) {
    await prisma.studyMaterial.create({ data: material });
  }

  // Create flashcard decks
  const mathDeck = await prisma.flashcardDeck.create({
    data: {
      name: 'Calculus Formulas',
      description: 'Essential calculus formulas and derivatives',
      color: '#8b5cf6',
      userId: demoUser.id,
    },
  });

  const scienceDeck = await prisma.flashcardDeck.create({
    data: {
      name: 'Physics Constants',
      description: 'Important physics constants and formulas',
      color: '#ef4444',
      userId: demoUser.id,
    },
  });

  // Create flashcards
  const mathCards = [
    {
      front: 'What is the derivative of x²?',
      back: '2x',
      difficulty: 'easy' as const,
      deckId: mathDeck.id,
    },
    {
      front: 'What is the integral of 1/x?',
      back: 'ln|x| + C',
      difficulty: 'normal' as const,
      deckId: mathDeck.id,
    },
    {
      front: 'What is the chain rule formula?',
      back: 'If f(x) = g(h(x)), then f\'(x) = g\'(h(x)) · h\'(x)',
      difficulty: 'hard' as const,
      deckId: mathDeck.id,
    },
  ];

  const scienceCards = [
    {
      front: 'What is the speed of light in vacuum?',
      back: '299,792,458 m/s (approximately 3 × 10⁸ m/s)',
      difficulty: 'easy' as const,
      deckId: scienceDeck.id,
    },
    {
      front: 'What is Planck\'s constant?',
      back: 'h = 6.626 × 10⁻³⁴ J·s',
      difficulty: 'normal' as const,
      deckId: scienceDeck.id,
    },
  ];

  for (const card of [...mathCards, ...scienceCards]) {
    await prisma.flashcard.create({ data: card });
  }

  // Update deck stats
  await prisma.deckStats.upsert({
    where: { deckId: mathDeck.id },
    update: {
      totalCards: mathCards.length,
      newCards: mathCards.length,
    },
    create: {
      deckId: mathDeck.id,
      totalCards: mathCards.length,
      newCards: mathCards.length,
      learningCards: 0,
      reviewCards: 0,
      suspendedCards: 0,
    },
  });

  await prisma.deckStats.upsert({
    where: { deckId: scienceDeck.id },
    update: {
      totalCards: scienceCards.length,
      newCards: scienceCards.length,
    },
    create: {
      deckId: scienceDeck.id,
      totalCards: scienceCards.length,
      newCards: scienceCards.length,
      learningCards: 0,
      reviewCards: 0,
      suspendedCards: 0,
    },
  });

  // Create study goals
  const goals = [
    {
      title: 'Study 2 hours daily',
      description: 'Maintain consistent daily study habits',
      type: 'time',
      target: 120,
      current: 45,
      unit: 'minutes',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      priority: 'high',
      userId: demoUser.id,
    },
    {
      title: 'Complete 50 flashcards',
      description: 'Review flashcards to improve retention',
      type: 'flashcards',
      target: 50,
      current: 12,
      unit: 'cards',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      priority: 'medium',
      userId: demoUser.id,
    },
  ];

  for (const goal of goals) {
    await prisma.goal.create({ data: goal });
  }

  // Create some study sessions
  const sessions = [
    {
      type: 'pomodoro',
      duration: 25,
      plannedDuration: 25,
      focusRating: 4,
      notes: 'Focused session on calculus derivatives',
      completed: true,
      userId: demoUser.id,
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      endedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
    },
    {
      type: 'pomodoro',
      duration: 30,
      plannedDuration: 25,
      focusRating: 3,
      notes: 'Physics problem solving session',
      completed: true,
      userId: demoUser.id,
      startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      endedAt: new Date(Date.now() - 23.5 * 60 * 60 * 1000),
    },
  ];

  for (const session of sessions) {
    await prisma.studySession.create({ data: session });
  }

  // Create some notes
  const notes = [
    {
      title: 'Calculus Chain Rule Notes',
      content: 'The chain rule is fundamental for finding derivatives of composite functions. Key points: 1) Identify the outer and inner functions, 2) Find derivatives separately, 3) Multiply them together.',
      tags: ['calculus', 'derivatives', 'chain-rule'],
      userId: demoUser.id,
    },
    {
      title: 'Physics Force Equations',
      content: 'Newton\'s Laws: 1) F = ma (Second Law), 2) For every action there is an equal and opposite reaction (Third Law), 3) An object at rest stays at rest (First Law).',
      tags: ['physics', 'forces', 'newton'],
      userId: demoUser.id,
    },
  ];

  for (const note of notes) {
    await prisma.note.create({ data: note });
  }

  console.log('✅ Database seeded successfully!');
  console.log(`👤 Created user: ${demoUser.name} (${demoUser.email})`);
  console.log(`📁 Created ${materials.length} study materials`);
  console.log(`🃏 Created ${mathCards.length + scienceCards.length} flashcards in 2 decks`);
  console.log(`🎯 Created ${goals.length} study goals`);
  console.log(`⏱️ Created ${sessions.length} study sessions`);
  console.log(`📝 Created ${notes.length} notes`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
