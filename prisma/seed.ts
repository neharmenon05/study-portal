// prisma/seed.ts
import { PrismaClient, UserRole, DocumentType, FeedbackType, SubmissionStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // --------------------------------------------------------------------------
  // USERS
  // --------------------------------------------------------------------------
  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Admin User",
      password: "hashedpassword",
      role: UserRole.ADMIN,
    },
  });

  const teacher = await prisma.user.create({
    data: {
      email: "teacher@example.com",
      name: "John Teacher",
      password: "hashedpassword",
      role: UserRole.TEACHER,
    },
  });

  const student = await prisma.user.create({
    data: {
      email: "student@example.com",
      name: "Jane Student",
      password: "hashedpassword",
      role: UserRole.STUDENT,
    },
  });

  console.log("👥 Users created");

  // --------------------------------------------------------------------------
  // SUBJECTS
  // --------------------------------------------------------------------------
  const math = await prisma.subject.create({
    data: {
      name: "Mathematics",
      code: "MATH101",
      description: "Introduction to Mathematics",
    },
  });

  const physics = await prisma.subject.create({
    data: {
      name: "Physics",
      code: "PHY101",
      description: "Fundamentals of Physics",
    },
  });

  console.log("📘 Subjects created");

  // --------------------------------------------------------------------------
  // CLASSES
  // --------------------------------------------------------------------------
  const mathClass = await prisma.class.create({
    data: {
      name: "Math Class A",
      subjectId: math.id,
      teacherId: teacher.id,
      semester: "Fall",
      year: 2025,
    },
  });

  const physicsClass = await prisma.class.create({
    data: {
      name: "Physics Class A",
      subjectId: physics.id,
      teacherId: teacher.id,
      semester: "Fall",
      year: 2025,
    },
  });

  console.log("🏫 Classes created");

  // --------------------------------------------------------------------------
  // ENROLLMENTS
  // --------------------------------------------------------------------------
  await prisma.classEnrollment.create({
    data: {
      classId: mathClass.id,
      studentId: student.id,
    },
  });

  await prisma.classEnrollment.create({
    data: {
      classId: physicsClass.id,
      studentId: student.id,
    },
  });

  console.log("📚 Enrollments created");

  // --------------------------------------------------------------------------
  // ASSIGNMENTS
  // --------------------------------------------------------------------------
  const assignment1 = await prisma.assignment.create({
    data: {
      title: "Algebra Homework",
      description: "Solve algebra problems",
      subjectId: math.id,
      classId: mathClass.id,
      teacherId: teacher.id,
      dueDate: new Date("2025-09-15"),
    },
  });

  const assignment2 = await prisma.assignment.create({
    data: {
      title: "Mechanics Homework",
      description: "Physics mechanics problems",
      subjectId: physics.id,
      classId: physicsClass.id,
      teacherId: teacher.id,
      dueDate: new Date("2025-09-20"),
    },
  });

  console.log("📝 Assignments created");

  // --------------------------------------------------------------------------
  // SUBMISSION + GRADE
  // --------------------------------------------------------------------------
  const submission = await prisma.submission.create({
    data: {
      assignmentId: assignment1.id,
      studentId: student.id,
      content: "Algebra answers",
      status: SubmissionStatus.SUBMITTED,
    },
  });

  await prisma.grade.create({
    data: {
      submissionId: submission.id,
      studentId: student.id,
      teacherId: teacher.id,
      points: 90,
      maxPoints: 100,
      feedback: "Great work!",
    },
  });

  console.log("✅ Submission + Grade created");

  // --------------------------------------------------------------------------
  // DOCUMENT + VERSION + TAG + FEEDBACK
  // --------------------------------------------------------------------------
  const document = await prisma.document.create({
    data: {
      title: "Algebra Notes",
      fileName: "algebra.pdf",
      filePath: "/uploads/algebra.pdf",
      fileSize: BigInt(1024),
      mimeType: "application/pdf",
      type: DocumentType.NOTES,
      subjectId: math.id,
      uploaderId: teacher.id,
      isShared: true,
    },
  });

  await prisma.documentVersion.create({
    data: {
      documentId: document.id,
      version: 1,
      fileName: "algebra_v1.pdf",
      filePath: "/uploads/algebra_v1.pdf",
      fileSize: BigInt(1024),
    },
  });

  const tag = await prisma.tag.create({
    data: { name: "Algebra", color: "#f97316" },
  });

  await prisma.documentTag.create({
    data: {
      documentId: document.id,
      tagId: tag.id,
    },
  });

  await prisma.feedback.create({
    data: {
      documentId: document.id,
      authorId: student.id,
      teacherId: teacher.id,
      rating: 5,
      comment: "Very helpful!",
      type: FeedbackType.PEER,
    },
  });

  console.log("📄 Documents + Feedback created");

  // --------------------------------------------------------------------------
  // AI CHAT + ACTIVITY LOG
  // --------------------------------------------------------------------------
  const session = await prisma.aIChatSession.create({
    data: {
      userId: student.id,
      title: "Homework Help",
      messages: {
        create: [
          { role: "user", content: "Can you help with algebra?" },
          { role: "assistant", content: "Sure! Let's go through it." },
        ],
      },
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: student.id,
      action: "LOGIN",
      resource: "User",
      details: { success: true },
      ipAddress: "127.0.0.1",
    },
  });

  console.log("🤖 AI Chat + ActivityLog created");

  console.log("🌱 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
