// app/api/dashboard/stats/route.ts - Dashboard statistics API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    if (user.role === 'STUDENT') {
      // Student dashboard stats
      const [
        totalDocuments,
        totalFeedbackGiven,
        totalFeedbackReceived,
        averageRating,
        recentActivity,
        enrolledClasses,
        pendingAssignments,
        grades
      ] = await Promise.all([
        // Total documents uploaded
        prisma.document.count({
          where: { uploaderId: user.id }
        }),

        // Total feedback given
        prisma.feedback.count({
          where: { authorId: user.id }
        }),

        // Total feedback received on user's documents
        prisma.feedback.count({
          where: {
            document: { uploaderId: user.id }
          }
        }),

        // Average rating of user's documents
        prisma.document.aggregate({
          where: { uploaderId: user.id, totalRatings: { gt: 0 } },
          _avg: { averageRating: true }
        }),

        // Recent activity (uploads and feedback)
        prisma.document.findMany({
          where: { uploaderId: user.id },
          include: {
            subject: true,
            feedback: {
              include: {
                author: {
                  select: { name: true, role: true }
                }
              },
              orderBy: { createdAt: 'desc' },
              take: 3
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }),

        // Enrolled classes
        prisma.classEnrollment.count({
          where: { studentId: user.id }
        }),

        // Pending assignments
        prisma.assignment.count({
          where: {
            class: {
              enrollments: {
                some: { studentId: user.id }
              }
            },
            dueDate: { gte: new Date() },
            submissions: {
              none: { studentId: user.id }
            }
          }
        }),

        // Recent grades
        prisma.grade.findMany({
          where: { studentId: user.id },
          include: {
            submission: {
              include: {
                assignment: {
                  include: {
                    subject: true
                  }
                }
              }
            }
          },
          orderBy: { gradedAt: 'desc' },
          take: 5
        })
      ]);

      return NextResponse.json({
        stats: {
          totalDocuments,
          totalFeedbackGiven,
          totalFeedbackReceived,
          averageRating: averageRating._avg.averageRating || 0,
          enrolledClasses,
          pendingAssignments
        },
        recentActivity: recentActivity.map(doc => ({
          ...doc,
          fileSize: doc.fileSize.toString()
        })),
        recentGrades: grades
      });

    } else if (user.role === 'TEACHER') {
      // Teacher dashboard stats
      const [
        totalClasses,
        totalStudents,
        totalAssignments,
        pendingGrading,
        recentDocuments,
        recentSubmissions
      ] = await Promise.all([
        // Total classes taught
        prisma.class.count({
          where: { teacherId: user.id, isActive: true }
        }),

        // Total students across all classes
        prisma.classEnrollment.count({
          where: {
            class: { teacherId: user.id }
          }
        }),

        // Total assignments created
        prisma.assignment.count({
          where: { teacherId: user.id }
        }),

        // Submissions pending grading
        prisma.submission.count({
          where: {
            assignment: { teacherId: user.id },
            status: 'SUBMITTED'
          }
        }),

        // Recent shared documents
        prisma.document.findMany({
          where: { uploaderId: user.id, isShared: true },
          include: {
            subject: true,
            _count: {
              select: { feedback: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }),

        // Recent submissions
        prisma.submission.findMany({
          where: {
            assignment: { teacherId: user.id }
          },
          include: {
            student: {
              select: { name: true, email: true }
            },
            assignment: {
              select: { title: true, subject: { select: { name: true } } }
            }
          },
          orderBy: { submittedAt: 'desc' },
          take: 10
        })
      ]);

      return NextResponse.json({
        stats: {
          totalClasses,
          totalStudents,
          totalAssignments,
          pendingGrading
        },
        recentDocuments: recentDocuments.map(doc => ({
          ...doc,
          fileSize: doc.fileSize.toString()
        })),
        recentSubmissions: recentSubmissions.map(sub => ({
          ...sub,
          fileSize: sub.fileSize ? sub.fileSize.toString() : null
        })),
        recentActivity: recentDocuments.map(doc => ({
          ...doc,
          fileSize: doc.fileSize.toString()
        }))
      });
    }

    return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}