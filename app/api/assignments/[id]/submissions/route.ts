// app/api/assignments/[id]/submissions/route.ts - Assignment submission API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { saveFile } from '@/lib/file-storage';
import { z } from 'zod';

const submissionSchema = z.object({
  content: z.string().optional(),
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

    // Verify assignment exists and user has access
    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: {
        class: {
          include: {
            enrollments: {
              where: { studentId: user.id }
            }
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const hasAccess = 
      assignment.teacherId === user.id || // Teacher
      assignment.class.enrollments.length > 0; // Enrolled student

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    let submissions;

    if (user.role === 'TEACHER') {
      // Teachers see all submissions for their assignment
      submissions = await prisma.submission.findMany({
        where: { assignmentId: params.id },
        include: {
          student: {
            select: { id: true, name: true, email: true, avatar: true }
          },
          grades: {
            select: { points: true, maxPoints: true, feedback: true, gradedAt: true }
          }
        },
        orderBy: { submittedAt: 'desc' }
      });
    } else {
      // Students see only their own submission
      submissions = await prisma.submission.findMany({
        where: {
          assignmentId: params.id,
          studentId: user.id
        },
        include: {
          grades: {
            select: { points: true, maxPoints: true, feedback: true, gradedAt: true }
          }
        }
      });
    }

    // Convert BigInt to string for JSON serialization
    const submissionsWithStringFileSize = submissions.map(sub => ({
      ...sub,
      fileSize: sub.fileSize ? sub.fileSize.toString() : null
    }));

    return NextResponse.json({ submissions: submissionsWithStringFileSize });

  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
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
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify student is enrolled in the class
    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: {
        class: {
          include: {
            enrollments: {
              where: { studentId: user.id }
            }
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (assignment.class.enrollments.length === 0) {
      return NextResponse.json({ error: 'Not enrolled in class' }, { status: 403 });
    }

    // Check if assignment is still open
    if (new Date() > assignment.dueDate) {
      return NextResponse.json({ error: 'Assignment deadline has passed' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const content = formData.get('content') as string;

    if (!file && !content) {
      return NextResponse.json({ error: 'Either file or content is required' }, { status: 400 });
    }

    let fileName, filePath, fileSize;

    if (file) {
      const fileData = await saveFile(file, 'submissions');
      fileName = file.name;
      filePath = fileData.filePath;
      fileSize = fileData.fileSize;
    }

    // Check if submission already exists
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: params.id,
          studentId: user.id
        }
      }
    });

    let submission;

    if (existingSubmission) {
      // Update existing submission
      submission = await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          fileName,
          filePath,
          fileSize: fileSize ? BigInt(fileSize) : null,
          content,
          status: 'SUBMITTED',
          updatedAt: new Date()
        }
      });
    } else {
      // Create new submission
      submission = await prisma.submission.create({
        data: {
          assignmentId: params.id,
          studentId: user.id,
          fileName,
          filePath,
          fileSize: fileSize ? BigInt(fileSize) : null,
          content,
          status: 'SUBMITTED'
        }
      });
    }

    return NextResponse.json({
      message: 'Submission saved successfully',
      submission: {
        ...submission,
        fileSize: submission.fileSize ? submission.fileSize.toString() : null
      }
    });

  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    );
  }
}