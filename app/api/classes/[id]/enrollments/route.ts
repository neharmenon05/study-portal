// app/api/classes/[id]/enrollments/route.ts - Class enrollment management
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const enrollmentSchema = z.object({
  studentEmails: z.array(z.string().email()),
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

    // Check if user has access to this class
    const classData = await prisma.class.findUnique({
      where: { id: params.id },
      include: {
        enrollments: {
          include: {
            student: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        }
      }
    });

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    const hasAccess = 
      classData.teacherId === user.id || // Teacher
      classData.enrollments.some(e => e.studentId === user.id); // Enrolled student

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      enrollments: classData.enrollments
    });

  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
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
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify teacher owns this class
    const classData = await prisma.class.findUnique({
      where: { id: params.id }
    });

    if (!classData || classData.teacherId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { studentEmails } = enrollmentSchema.parse(body);

    const results = [];
    const errors = [];

    for (const email of studentEmails) {
      try {
        // Find student by email
        const student = await prisma.user.findUnique({
          where: { email, role: 'STUDENT' }
        });

        if (!student) {
          errors.push(`Student not found: ${email}`);
          continue;
        }

        // Check if already enrolled
        const existingEnrollment = await prisma.classEnrollment.findUnique({
          where: {
            classId_studentId: {
              classId: params.id,
              studentId: student.id
            }
          }
        });

        if (existingEnrollment) {
          errors.push(`Already enrolled: ${email}`);
          continue;
        }

        // Create enrollment
        const enrollment = await prisma.classEnrollment.create({
          data: {
            classId: params.id,
            studentId: student.id
          },
          include: {
            student: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        });

        results.push(enrollment);

      } catch (error) {
        errors.push(`Error enrolling ${email}: ${error}`);
      }
    }

    return NextResponse.json({
      message: `Enrolled ${results.length} students`,
      enrollments: results,
      errors
    });

  } catch (error) {
    console.error('Error creating enrollments:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create enrollments' },
      { status: 500 }
    );
  }
}