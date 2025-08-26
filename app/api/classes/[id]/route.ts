// app/api/classes/[id]/route.ts - Individual class API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const classData = await prisma.class.findUnique({
      where: { id: params.id },
      include: {
        subject: true,
        teacher: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        enrollments: {
          include: {
            student: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          },
          orderBy: { enrolledAt: 'desc' }
        },
        assignments: {
          include: {
            _count: {
              select: { submissions: true }
            }
          },
          orderBy: { dueDate: 'asc' },
          take: 10
        },
        _count: {
          select: {
            enrollments: true,
            assignments: true
          }
        }
      }
    });

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Check access permissions
    let hasAccess = false;
    
    if (user.role === 'TEACHER') {
      hasAccess = classData.teacherId === user.id;
    } else {
      // Check if student is enrolled
      const enrollment = classData.enrollments.find(e => e.student.id === user.id);
      hasAccess = !!enrollment;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ class: classData });

  } catch (error) {
    console.error('Error fetching class:', error);
    return NextResponse.json(
      { error: 'Failed to fetch class' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, semester, year } = body;

    // Check if user owns the class
    const classData = await prisma.class.findUnique({
      where: { id: params.id }
    });

    if (!classData || classData.teacherId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update class
    const updatedClass = await prisma.class.update({
      where: { id: params.id },
      data: {
        name,
        description,
        semester,
        year,
        updatedAt: new Date()
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
      message: 'Class updated successfully',
      class: updatedClass
    });

  } catch (error) {
    console.error('Error updating class:', error);
    return NextResponse.json(
      { error: 'Failed to update class' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user owns the class
    const classData = await prisma.class.findUnique({
      where: { id: params.id }
    });

    if (!classData || classData.teacherId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Soft delete by setting isActive to false
    await prisma.class.update({
      where: { id: params.id },
      data: { isActive: false }
    });

    return NextResponse.json({
      message: 'Class deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { error: 'Failed to delete class' },
      { status: 500 }
    );
  }
}