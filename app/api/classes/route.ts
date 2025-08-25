// app/api/classes/route.ts - Class management API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const classSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  description: z.string().optional(),
  subjectId: z.string().min(1, 'Subject is required'),
  semester: z.string().min(1, 'Semester is required'),
  year: z.number().int().min(2020).max(2030),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let classes;

    if (user.role === 'TEACHER') {
      // Teachers see their own classes
      classes = await prisma.class.findMany({
        where: {
          teacherId: user.id,
          isActive: true
        },
        include: {
          subject: true,
          teacher: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: {
              enrollments: true,
              assignments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Students see enrolled classes
      classes = await prisma.class.findMany({
        where: {
          enrollments: {
            some: { studentId: user.id }
          },
          isActive: true
        },
        include: {
          subject: true,
          teacher: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: {
              enrollments: true,
              assignments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json({ classes });

  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
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
    const data = classSchema.parse(body);

    // Verify subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: data.subjectId }
    });

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    const classData = await prisma.class.create({
      data: {
        ...data,
        teacherId: user.id
      },
      include: {
        subject: true,
        teacher: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            enrollments: true,
            assignments: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Class created successfully',
      class: classData
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating class:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create class' },
      { status: 500 }
    );
  }
}