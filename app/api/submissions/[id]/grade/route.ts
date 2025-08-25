// app/api/submissions/[id]/grade/route.ts - Grading API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const gradeSchema = z.object({
  points: z.number().int().min(0),
  maxPoints: z.number().int().min(1),
  feedback: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { points, maxPoints, feedback } = gradeSchema.parse(body);

    // Verify submission exists and teacher has access
    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        assignment: {
          include: {
            class: true
          }
        },
        student: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.assignment.teacherId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Validate points don't exceed max
    if (points > maxPoints) {
      return NextResponse.json({ error: 'Points cannot exceed maximum' }, { status: 400 });
    }

    // Create or update grade
    const grade = await prisma.grade.upsert({
      where: { submissionId: params.id },
      update: {
        points,
        maxPoints,
        feedback,
        updatedAt: new Date()
      },
      create: {
        submissionId: params.id,
        studentId: submission.studentId,
        teacherId: user.id,
        points,
        maxPoints,
        feedback
      }
    });

    // Update submission status
    await prisma.submission.update({
      where: { id: params.id },
      data: { status: 'GRADED' }
    });

    return NextResponse.json({
      message: 'Grade saved successfully',
      grade
    });

  } catch (error) {
    console.error('Error grading submission:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to grade submission' },
      { status: 500 }
    );
  }
}