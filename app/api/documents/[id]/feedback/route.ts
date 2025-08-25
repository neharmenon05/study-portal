// app/api/documents/[id]/feedback/route.ts - Document feedback API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  type: z.enum(['PEER', 'TEACHER']).default('PEER'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify document exists and user has access
    const document = await prisma.document.findUnique({
      where: { id: params.id }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const canAccess = 
      document.uploaderId === user.id || // Owner
      document.isShared || // Shared document
      user.role === 'TEACHER'; // Teachers can access all

    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const feedback = await prisma.feedback.findMany({
      where: { documentId: params.id },
      include: {
        author: {
          select: { id: true, name: true, role: true, avatar: true }
        },
        teacher: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate average rating
    const ratings = feedback.filter(f => f.rating > 0).map(f => f.rating);
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
      : 0;

    return NextResponse.json({
      feedback,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: ratings.length
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { rating, comment, type } = feedbackSchema.parse(body);

    // Verify document exists and allows feedback
    const document = await prisma.document.findUnique({
      where: { id: params.id }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!document.allowPeerFeedback && type === 'PEER') {
      return NextResponse.json({ error: 'Peer feedback not allowed' }, { status: 403 });
    }

    // Can't give feedback on own document (unless teacher)
    if (document.uploaderId === user.id && user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Cannot rate your own document' }, { status: 403 });
    }

    // Determine feedback type based on user role
    const feedbackType = user.role === 'TEACHER' ? 'TEACHER' : 'PEER';

    // Create or update feedback
    const feedback = await prisma.feedback.upsert({
      where: {
        documentId_authorId: {
          documentId: params.id,
          authorId: user.id
        }
      },
      update: {
        rating,
        comment,
        type: feedbackType,
        teacherId: user.role === 'TEACHER' ? user.id : undefined,
        updatedAt: new Date()
      },
      create: {
        documentId: params.id,
        authorId: user.id,
        rating,
        comment,
        type: feedbackType,
        teacherId: user.role === 'TEACHER' ? user.id : undefined
      },
      include: {
        author: {
          select: { id: true, name: true, role: true, avatar: true }
        }
      }
    });

    // Update document average rating
    const allFeedback = await prisma.feedback.findMany({
      where: { documentId: params.id, rating: { gt: 0 } }
    });

    const averageRating = allFeedback.length > 0
      ? allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length
      : 0;

    await prisma.document.update({
      where: { id: params.id },
      data: {
        averageRating,
        totalRatings: allFeedback.length
      }
    });

    return NextResponse.json({
      message: 'Feedback saved successfully',
      feedback
    });

  } catch (error) {
    console.error('Error creating feedback:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create feedback' },
      { status: 500 }
    );
  }
}