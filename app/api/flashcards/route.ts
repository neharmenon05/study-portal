import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

// Updated app/api/flashcards/route.ts - with authentication
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const decks = await prisma.flashcardDeck.findMany({
      where: {
        userId: user.id
      },
      include: {
        cards: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        stats: true,
        _count: {
          select: {
            cards: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ decks });
  } catch (error) {
    console.error('Error fetching flashcard decks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flashcard decks' },
      { status: 500 }
    );
  }
}

async function getUserFromRequest(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token || !token.sub) return null;
  const user = await prisma.user.findUnique({ where: { id: token.sub } });
  return user;
}
