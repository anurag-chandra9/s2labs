const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────
// STEP 1: Create these users in Clerk dashboard first
//   trainer@test.com     → public_metadata: { "role": "trainer" }
//   student1@test.com    → public_metadata: { "role": "student" }
//   student2@test.com    → public_metadata: { "role": "student" }
//   student3@test.com    → public_metadata: { "role": "student" }
//   institution@test.com → public_metadata: { "role": "institution" }
//   manager@test.com     → public_metadata: { "role": "programme_manager" }
//   officer@test.com     → public_metadata: { "role": "monitoring_officer" }
//
// STEP 2: Get their Clerk user IDs from dashboard.clerk.com → Users
//         (looks like: user_2abc123xyz...)
//
// STEP 3: Paste the IDs below and run: npm run seed
// ─────────────────────────────────────────────────────────────

const CLERK_USER_IDS = {
  trainer:     'PASTE_TRAINER_CLERK_ID',
  student1:    'PASTE_STUDENT1_CLERK_ID',
  student2:    'PASTE_STUDENT2_CLERK_ID',
  student3:    'PASTE_STUDENT3_CLERK_ID',
  institution: 'PASTE_INSTITUTION_CLERK_ID',
  manager:     'PASTE_MANAGER_CLERK_ID',
  officer:     'PASTE_OFFICER_CLERK_ID',
};

async function main() {
  // Check IDs are filled in
  const missing = Object.entries(CLERK_USER_IDS).filter(([, v]) => v.startsWith('PASTE_'));
  if (missing.length > 0) {
    console.log('❌ Please fill in Clerk user IDs in seed.js:');
    missing.forEach(([k]) => console.log(`   - ${k}`));
    console.log('\nGet IDs from: dashboard.clerk.com → Users → click user → copy ID at top');
    return;
  }

  console.log('🌱 Starting seed...\n');

  // ── Institutions ──────────────────────────────────────────
  const inst1 = await prisma.institution.upsert({
    where: { id: 'inst-tech-skills' },
    update: {},
    create: { id: 'inst-tech-skills', name: 'Tech Skills Institute', address: 'Mumbai, Maharashtra' },
  });

  const inst2 = await prisma.institution.upsert({
    where: { id: 'inst-digital-learning' },
    update: {},
    create: { id: 'inst-digital-learning', name: 'Digital Learning Center', address: 'Bangalore, Karnataka' },
  });

  console.log('✅ Institutions created');

  // ── Users (insert directly — no webhook needed) ───────────
  await prisma.user.upsert({
    where: { id: CLERK_USER_IDS.trainer },
    update: { role: 'trainer', institutionId: inst1.id },
    create: { id: CLERK_USER_IDS.trainer, name: 'Ravi Trainer', email: 'trainer@test.com', role: 'trainer', institutionId: inst1.id },
  });

  await prisma.user.upsert({
    where: { id: CLERK_USER_IDS.student1 },
    update: { role: 'student' },
    create: { id: CLERK_USER_IDS.student1, name: 'Ananya Student', email: 'student1@test.com', role: 'student' },
  });

  await prisma.user.upsert({
    where: { id: CLERK_USER_IDS.student2 },
    update: { role: 'student' },
    create: { id: CLERK_USER_IDS.student2, name: 'Rohan Student', email: 'student2@test.com', role: 'student' },
  });

  await prisma.user.upsert({
    where: { id: CLERK_USER_IDS.student3 },
    update: { role: 'student' },
    create: { id: CLERK_USER_IDS.student3, name: 'Priya Student', email: 'student3@test.com', role: 'student' },
  });

  await prisma.user.upsert({
    where: { id: CLERK_USER_IDS.institution },
    update: { role: 'institution', institutionId: inst1.id },
    create: { id: CLERK_USER_IDS.institution, name: 'Tech Skills Admin', email: 'institution@test.com', role: 'institution', institutionId: inst1.id },
  });

  await prisma.user.upsert({
    where: { id: CLERK_USER_IDS.manager },
    update: { role: 'programme_manager' },
    create: { id: CLERK_USER_IDS.manager, name: 'Programme Manager', email: 'manager@test.com', role: 'programme_manager' },
  });

  await prisma.user.upsert({
    where: { id: CLERK_USER_IDS.officer },
    update: { role: 'monitoring_officer' },
    create: { id: CLERK_USER_IDS.officer, name: 'Monitoring Officer', email: 'officer@test.com', role: 'monitoring_officer' },
  });

  console.log('✅ Users created');

  // ── Batches ───────────────────────────────────────────────
  const batch1 = await prisma.batch.upsert({
    where: { id: 'batch-web-dev' },
    update: {},
    create: {
      id: 'batch-web-dev',
      name: 'Web Development 2026',
      institutionId: inst1.id,
      description: 'Full-stack web development training',
      inviteCode: 'webdev2026',
      trainers: { connect: { id: CLERK_USER_IDS.trainer } },
      students: {
        connect: [
          { id: CLERK_USER_IDS.student1 },
          { id: CLERK_USER_IDS.student2 },
          { id: CLERK_USER_IDS.student3 },
        ],
      },
    },
  });

  const batch2 = await prisma.batch.upsert({
    where: { id: 'batch-data-science' },
    update: {},
    create: {
      id: 'batch-data-science',
      name: 'Data Science Fundamentals',
      institutionId: inst2.id,
      description: 'Python, ML, and data analysis',
      inviteCode: 'datascience2026',
      trainers: { connect: { id: CLERK_USER_IDS.trainer } },
      students: {
        connect: [
          { id: CLERK_USER_IDS.student1 },
          { id: CLERK_USER_IDS.student2 },
        ],
      },
    },
  });

  console.log('✅ Batches created');

  // ── Sessions ──────────────────────────────────────────────
  const d = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d;
  };

  const sessions = [
    { id: 'sess-1', title: 'Intro to HTML & CSS',      batchId: batch1.id, date: d(-3), startTime: '10:00', endTime: '12:00' },
    { id: 'sess-2', title: 'JavaScript Basics',         batchId: batch1.id, date: d(-1), startTime: '14:00', endTime: '16:00' },
    { id: 'sess-3', title: 'React Fundamentals',        batchId: batch1.id, date: d(1),  startTime: '10:00', endTime: '13:00' },
    { id: 'sess-4', title: 'Python for Data Analysis',  batchId: batch2.id, date: d(-2), startTime: '09:00', endTime: '11:00' },
    { id: 'sess-5', title: 'Machine Learning Basics',   batchId: batch2.id, date: d(2),  startTime: '11:00', endTime: '13:00' },
  ];

  for (const s of sessions) {
    await prisma.session.upsert({
      where: { id: s.id },
      update: {},
      create: { ...s, trainerId: CLERK_USER_IDS.trainer },
    });
  }

  console.log('✅ Sessions created (past + future)');

  // ── Attendance ────────────────────────────────────────────
  const attendanceRecords = [
    // sess-1: mixed
    { sessionId: 'sess-1', studentId: CLERK_USER_IDS.student1, status: 'present' },
    { sessionId: 'sess-1', studentId: CLERK_USER_IDS.student2, status: 'late' },
    { sessionId: 'sess-1', studentId: CLERK_USER_IDS.student3, status: 'absent' },
    // sess-2: mostly present
    { sessionId: 'sess-2', studentId: CLERK_USER_IDS.student1, status: 'present' },
    { sessionId: 'sess-2', studentId: CLERK_USER_IDS.student2, status: 'present' },
    { sessionId: 'sess-2', studentId: CLERK_USER_IDS.student3, status: 'late' },
    // sess-4: all present
    { sessionId: 'sess-4', studentId: CLERK_USER_IDS.student1, status: 'present' },
    { sessionId: 'sess-4', studentId: CLERK_USER_IDS.student2, status: 'present' },
  ];

  for (const a of attendanceRecords) {
    await prisma.attendance.upsert({
      where: { sessionId_studentId: { sessionId: a.sessionId, studentId: a.studentId } },
      update: {},
      create: a,
    });
  }

  console.log('✅ Attendance records created\n');
  console.log('🎉 Seed complete!\n');
  console.log('📋 Test accounts:');
  console.log('   trainer@test.com       → Trainer dashboard');
  console.log('   student1@test.com      → Student dashboard');
  console.log('   student2@test.com      → Student dashboard');
  console.log('   student3@test.com      → Student dashboard');
  console.log('   institution@test.com   → Institution dashboard');
  console.log('   manager@test.com       → Programme Manager dashboard');
  console.log('   officer@test.com       → Monitoring Officer dashboard');
  console.log('\n🔗 Invite codes:');
  console.log('   webdev2026       → Web Development 2026');
  console.log('   datascience2026  → Data Science Fundamentals');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
