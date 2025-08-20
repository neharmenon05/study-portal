import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schema for creating a flashcard deck
const createDeckSchema = z.object({
  name: z.string().min(1, 'Deck name is required'),
  description: z.string().optional().nullable(),
  color: z.string().default('#8b5cf6'),
  isPublic: z.boolean().default(false),
  userId: z.string(),
  flashcards: z.array(z.object({
    front: z.string().min(1, 'Front content is required'),
    back: z.string().min(1, 'Back content is required'),
    difficulty: z.enum(['easy', 'normal', 'hard']).default('normal')
  })).optional().default([])
});

// Validation schema for creating a flashcard
const createCardSchema = z.object({
  front: z.string().min(1, 'Front content is required'),
  back: z.string().min(1, 'Back content is required'),
  hint: z.string().optional(),
  difficulty: z.enum(['easy', 'normal', 'hard']).default('normal'),
  tags: z.array(z.string()).default([]),
  deckId: z.string()
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';
    
    const decks = await prisma.flashcardDeck.findMany({
      where: {
        userId: userId
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Add demo user ID for now
    const deckData = {
      ...body,
      userId: body.userId || 'demo-user'
    };
    
    const validatedData = createDeckSchema.parse(deckData);
    const { flashcards, ...deckInfo } = validatedData;
    
    // Use transaction to create deck, cards, and stats together
    const result = await prisma.$transaction(async (tx) => {
      // Create the deck
      const deck = await tx.flashcardDeck.create({
        data: deckInfo
      });

      // Create flashcards if provided
      let createdCards = [];
      if (flashcards && flashcards.length > 0) {
        const cardData = flashcards.map(card => ({
          ...card,
          deckId: deck.id
        }));
        
        await tx.flashcard.createMany({
          data: cardData
        });
        
        createdCards = await tx.flashcard.findMany({
          where: { deckId: deck.id },
          orderBy: { createdAt: 'asc' }
        });
      }

      // Create initial stats for the deck
      const stats = await tx.deckStats.create({
        data: {
          deckId: deck.id,
          totalCards: createdCards.length,
          newCards: createdCards.length,
          learningCards: 0,
          reviewCards: 0,
          suspendedCards: 0
        }
      });

      return {
        ...deck,
        cards: createdCards,
        stats,
        _count: {
          cards: createdCards.length
        }
      };
    });

    return NextResponse.json({ deck: result }, { status: 201 });
  } catch (error) {
    console.error('Error creating flashcard deck:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create flashcard deck' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deckId = searchParams.get('deckId');
    const userId = searchParams.get('userId') || 'demo-user';
    
    if (!deckId) {
      return NextResponse.json(
        { error: 'Deck ID is required' },
        { status: 400 }
      );
    }

    // Verify the deck belongs to the user
    const deck = await prisma.flashcardDeck.findFirst({
      where: {
        id: deckId,
        userId: userId
      }
    });

    if (!deck) {
      return NextResponse.json(
        { error: 'Deck not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the deck (cascading will delete related cards and stats)
    await prisma.flashcardDeck.delete({
      where: {
        id: deckId
      }
    });

    return NextResponse.json({ message: 'Deck deleted successfully' });
  } catch (error) {
    console.error('Error deleting flashcard deck:', error);
    return NextResponse.json(
      { error: 'Failed to delete flashcard deck' },
      { status: 500 }
    );
  }
}
