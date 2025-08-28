import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // For now, return empty array since we don't have flashcardDeck table yet
    // This will be replaced when we implement the full schema
    const decks: any[] = [];
    
    /*
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
    */

    return NextResponse.json({ decks });
  } catch (error) {
    console.error('Error fetching flashcard decks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flashcard decks' },
      { status: 500 }
    );
  }
}
