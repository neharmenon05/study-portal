// app/api/assignments/[id]/route.ts - Individual assignment API
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

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: {
        subject: true,
        class: true,
        teacher: {
          select: { id: true, name: true, avatar: true }
        },
        documents: {
          include: {
            document: {
              select: {
                id: true,
                title: true,
                type: true,
                fileName: true
              }
            }
          }
        },
        submissions: user.role === 'STUDENT' ? {
          where: { studentId: user.id },
          include: {
            grades: true
          }
        } : undefined,
        _count: {
          select: {
            submissions: true,
            documents: true
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Check access permissions
    let hasAccess = false;
    
    if (user.role === 'TEACHER') {
      hasAccess = assignment.teacherId === user.id;
    } else {
      // Check if student is enrolled in the class
      const enrollment = await prisma.classEnrollment.findUnique({
        where: {
          classId_studentId: {
            classId: assignment.classId,
            studentId: user.id
          }
        }
      });
      hasAccess = !!enrollment;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ assignment });

  } catch (error) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment' },
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
    const { title, description, dueDate, maxPoints } = body;

    // Check if user owns the assignment
    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id }
    });

    if (!assignment || assignment.teacherId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update assignment
    const updatedAssignment = await prisma.assignment.update({
      where: { id: params.id },
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        maxPoints,
        updatedAt: new Date()
      },
      include: {
        subject: true,
        class: true,
        teacher: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json({
      message: 'Assignment updated successfully',
      assignment: updatedAssignment
    });

  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to update assignment' },
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

    // Check if user owns the assignment
    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id }
    });

    if (!assignment || assignment.teacherId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete assignment (cascade will handle related records)
    await prisma.assignment.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      message: 'Assignment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}