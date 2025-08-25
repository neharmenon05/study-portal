// app/api/submissions/[id]/route.ts - Individual submission API
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

    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        student: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        assignment: {
          include: {
            subject: true,
            class: true,
            teacher: {
              select: { id: true, name: true }
            }
          }
        },
        grades: {
          orderBy: { gradedAt: 'desc' }
        }
      }
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Check access permissions
    const hasAccess = 
      submission.studentId === user.id || // Student owns submission
      submission.assignment.teacherId === user.id; // Teacher owns assignment

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      submission: {
        ...submission,
        fileSize: submission.fileSize ? submission.fileSize.toString() : null
      }
    });

  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
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
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        assignment: true
      }
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Check if user can update this submission
    if (submission.studentId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if assignment is still open
    if (new Date() > submission.assignment.dueDate) {
      return NextResponse.json({ error: 'Assignment deadline has passed' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const content = formData.get('content') as string;

    let fileName, filePath, fileSize;

    if (file) {
      const { saveFile } = await import('@/lib/file-storage');
      const fileData = await saveFile(file, 'submissions');
      fileName = file.name;
      filePath = fileData.filePath;
      fileSize = fileData.fileSize;
    }

    // Update submission
    const updatedSubmission = await prisma.submission.update({
      where: { id: params.id },
      data: {
        fileName: fileName || submission.fileName,
        filePath: filePath || submission.filePath,
        fileSize: fileSize ? BigInt(fileSize) : submission.fileSize,
        content: content || submission.content,
        status: 'SUBMITTED',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      message: 'Submission updated successfully',
      submission: {
        ...updatedSubmission,
        fileSize: updatedSubmission.fileSize ? updatedSubmission.fileSize.toString() : null
      }
    });

  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    );
  }
}