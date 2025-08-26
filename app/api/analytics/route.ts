// app/api/analytics/route.ts - Analytics and reporting API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    if (user.role === 'STUDENT') {
      // Student analytics
      const [
        documentStats,
        feedbackStats,
        gradeStats,
        activityData
      ] = await Promise.all([
        // Document upload trends
        prisma.document.groupBy({
          by: ['createdAt'],
          where: {
            uploaderId: user.id,
            createdAt: { gte: startDate }
          },
          _count: { id: true },
          orderBy: { createdAt: 'asc' }
        }),

        // Feedback received over time
        prisma.feedback.groupBy({
          by: ['createdAt'],
          where: {
            document: { uploaderId: user.id },
            createdAt: { gte: startDate }
          },
          _avg: { rating: true },
          _count: { id: true },
          orderBy: { createdAt: 'asc' }
        }),

        // Grade distribution
        prisma.grade.groupBy({
          by: ['points', 'maxPoints'],
          where: {
            studentId: user.id,
            gradedAt: { gte: startDate }
          },
          _count: { id: true }
        }),

        // Recent activity summary
        prisma.activityLog.findMany({
          where: {
            userId: user.id,
            createdAt: { gte: startDate }
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        })
      ]);

      // Process grade distribution
      const gradeDistribution = gradeStats.map(grade => ({
        percentage: Math.round((grade.points / grade.maxPoints) * 100),
        count: grade._count.id
      }));

      // Group grades by letter grade
      const letterGrades = gradeDistribution.reduce((acc, grade) => {
        let letter = 'F';
        if (grade.percentage >= 90) letter = 'A';
        else if (grade.percentage >= 80) letter = 'B';
        else if (grade.percentage >= 70) letter = 'C';
        else if (grade.percentage >= 60) letter = 'D';
        
        acc[letter] = (acc[letter] || 0) + grade.count;
        return acc;
      }, {} as Record<string, number>);

      return NextResponse.json({
        documentTrends: documentStats,
        feedbackTrends: feedbackStats,
        gradeDistribution: letterGrades,
        recentActivity: activityData
      });

    } else if (user.role === 'TEACHER') {
      // Teacher analytics
      const [
        classStats,
        assignmentStats,
        submissionStats,
        feedbackStats
      ] = await Promise.all([
        // Class enrollment trends
        prisma.classEnrollment.groupBy({
          by: ['enrolledAt'],
          where: {
            class: { teacherId: user.id },
            enrolledAt: { gte: startDate }
          },
          _count: { id: true },
          orderBy: { enrolledAt: 'asc' }
        }),

        // Assignment creation trends
        prisma.assignment.groupBy({
          by: ['createdAt'],
          where: {
            teacherId: user.id,
            createdAt: { gte: startDate }
          },
          _count: { id: true },
          orderBy: { createdAt: 'asc' }
        }),

        // Submission status distribution
        prisma.submission.groupBy({
          by: ['status'],
          where: {
            assignment: { teacherId: user.id },
            submittedAt: { gte: startDate }
          },
          _count: { id: true }
        }),

        // Feedback given by teacher
        prisma.feedback.groupBy({
          by: ['createdAt'],
          where: {
            teacherId: user.id,
            createdAt: { gte: startDate }
          },
          _avg: { rating: true },
          _count: { id: true },
          orderBy: { createdAt: 'asc' }
        })
      ]);

      // Get class performance summary
      const classPerformance = await prisma.class.findMany({
        where: { teacherId: user.id, isActive: true },
        include: {
          subject: true,
          _count: {
            select: {
              enrollments: true,
              assignments: true
            }
          },
          assignments: {
            include: {
              _count: {
                select: { submissions: true }
              },
              grades: {
                select: {
                  points: true,
                  maxPoints: true
                }
              }
            }
          }
        }
      });

      // Calculate average grades per class
      const classAverages = classPerformance.map(cls => {
        const allGrades = cls.assignments.flatMap(a => a.grades);
        const avgPercentage = allGrades.length > 0 
          ? allGrades.reduce((sum, g) => sum + (g.points / g.maxPoints), 0) / allGrades.length * 100
          : 0;

        return {
          id: cls.id,
          name: cls.name,
          subject: cls.subject.name,
          students: cls._count.enrollments,
          assignments: cls._count.assignments,
          averageGrade: Math.round(avgPercentage)
        };
      });

      return NextResponse.json({
        enrollmentTrends: classStats,
        assignmentTrends: assignmentStats,
        submissionStats: submissionStats,
        feedbackTrends: feedbackStats,
        classPerformance: classAverages
      });
    }

    return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}