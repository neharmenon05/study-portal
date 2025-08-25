// app/api/assignments/route.ts - Assignment management API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const assignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  classId: z.string().min(1, 'Class is required'),
  dueDate: z.string().transform(str => new Date(str)),
  maxPoints: z.number().int().min(1).default(100),
  documentIds: z.array(z.string()).optional().default([]),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    let assignments;

    if (user.role === 'TEACHER') {
      // Teachers see assignments they created
      const where: any = { teacherId: user.id };
      if (classId) where.classId = classId;

      assignments = await prisma.assignment.findMany({
        where,
        include: {
          subject: true,
          class: true,
          _count: {
            select: {
              submissions: true,
              documents: true
            }
          }
        },
        orderBy: { dueDate: 'asc' }
      });
    } else {
      // Students see assignments from their enrolled classes
      const where: any = {
        class: {
          enrollments: {
            some: { studentId: user.id }
          }
        }
      };
      if (classId) where.classId = classId;

      assignments = await prisma.assignment.findMany({
        where,
        include: {
          subject: true,
          class: true,
          teacher: {
            select: { id: true, name: true }
          },
          submissions: {
            where: { studentId: user.id },
            select: {
              id: true,
              status: true,
              submittedAt: true,
              grades: {
                select: { points: true, maxPoints: true }
              }
            }
          },
          _count: {
            select: {
              documents: true
            }
          }
        },
        orderBy: { dueDate: 'asc' }
      });
    }

    return NextResponse.json({ assignments });

  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = assignmentSchema.parse(body);

    // Verify teacher owns the class
    const classData = await prisma.class.findUnique({
      where: { id: data.classId }
    });

    if (!classData || classData.teacherId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        title: data.title,
        description: data.description,
        subjectId: data.subjectId,
        classId: data.classId,
        teacherId: user.id,
        dueDate: data.dueDate,
        maxPoints: data.maxPoints
      },
      include: {
        subject: true,
        class: true,
        _count: {
          select: {
            submissions: true,
            documents: true
          }
        }
      }
    });

    // Link documents if provided
    if (data.documentIds.length > 0) {
      await prisma.assignmentDocument.createMany({
        data: data.documentIds.map(docId => ({
          assignmentId: assignment.id,
          documentId: docId
        }))
      });
    }

    return NextResponse.json({
      message: 'Assignment created successfully',
      assignment
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating assignment:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
}