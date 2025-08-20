import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schema for creating/updating a note
const noteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  tags: z.array(z.string()).default([]),
  userId: z.string()
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';
    
    const notes = await prisma.note.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Add demo user ID for now
    const noteData = {
      ...body,
      userId: body.userId || 'demo-user'
    };
    
    const validatedData = noteSchema.parse(noteData);
    
    const note = await prisma.note.create({
      data: validatedData
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');
    const userId = searchParams.get('userId') || 'demo-user';
    
    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

    // Verify the note belongs to the user
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: userId
      }
    });

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the note
    await prisma.note.delete({
      where: {
        id: noteId
      }
    });

    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
