require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const REAL_ID = 'user_3DLEeCETbpbwGtGxO367Mps3spt';
const OLD_IDS = ['YOUR_CLERK_ID', 'user_trainer1', 'user_2REAL_CLERK_ID'];

async function main() {
  // Delete attendance linked to old trainer sessions
  for (const oldId of OLD_IDS) {
    const sessions = await prisma.session.findMany({ where: { trainerId: oldId } });
    if (sessions.length) {
      await prisma.attendance.deleteMany({ where: { sessionId: { in: sessions.map(s => s.id) } } });
      await prisma.session.deleteMany({ where: { trainerId: oldId } });
    }
    await prisma.batch.updateMany({ where: {}, data: {} }); // no-op to keep connection alive
    // Remove from batch trainers
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "_BatchTrainers" WHERE "B" = '${oldId}'`);
    } catch {}
    // Delete old user
    await prisma.user.deleteMany({ where: { id: oldId } });
  }

  // Upsert real user
  await prisma.user.upsert({
    where: { id: REAL_ID },
    update: { role: 'trainer', institutionId: 'inst-tech-skills' },
    create: {
      id: REAL_ID,
      name: 'Anurag',
      email: 'anuragkrstm01@gmail.com',
      role: 'trainer',
      institutionId: 'inst-tech-skills',
    },
  });
  console.log('✅ User upserted');

  // Link to batches
  await prisma.$executeRawUnsafe(`INSERT INTO "_BatchTrainers" ("A","B") VALUES ('batch-web-dev','${REAL_ID}') ON CONFLICT DO NOTHING`);
  await prisma.$executeRawUnsafe(`INSERT INTO "_BatchTrainers" ("A","B") VALUES ('batch-data-science','${REAL_ID}') ON CONFLICT DO NOTHING`);
  console.log('✅ Batches linked');

  // Recreate sessions
  const sessions = [
    { id: 'sess-1', title: 'Intro to HTML & CSS',      batchId: 'batch-web-dev',      daysOffset: -3, start: '10:00', end: '12:00' },
    { id: 'sess-2', title: 'JavaScript Basics',        batchId: 'batch-web-dev',      daysOffset: -1, start: '14:00', end: '16:00' },
    { id: 'sess-3', title: 'React Fundamentals',       batchId: 'batch-web-dev',      daysOffset:  1, start: '10:00', end: '13:00' },
    { id: 'sess-4', title: 'Python for Data Analysis', batchId: 'batch-data-science', daysOffset: -2, start: '09:00', end: '11:00' },
    { id: 'sess-5', title: 'Machine Learning Basics',  batchId: 'batch-data-science', daysOffset:  2, start: '11:00', end: '13:00' },
  ];

  for (const s of sessions) {
    const date = new Date();
    date.setDate(date.getDate() + s.daysOffset);
    await prisma.session.upsert({
      where: { id: s.id },
      update: { trainerId: REAL_ID },
      create: { id: s.id, title: s.title, batchId: s.batchId, trainerId: REAL_ID, date, startTime: s.start, endTime: s.end },
    });
  }
  console.log('✅ Sessions created');

  // Recreate attendance
  const records = [
    { sessionId: 'sess-1', studentId: 'user_student1', status: 'present' },
    { sessionId: 'sess-1', studentId: 'user_student2', status: 'late' },
    { sessionId: 'sess-1', studentId: 'user_student3', status: 'absent' },
    { sessionId: 'sess-2', studentId: 'user_student1', status: 'present' },
    { sessionId: 'sess-2', studentId: 'user_student2', status: 'present' },
    { sessionId: 'sess-2', studentId: 'user_student3', status: 'late' },
    { sessionId: 'sess-4', studentId: 'user_student1', status: 'present' },
    { sessionId: 'sess-4', studentId: 'user_student2', status: 'present' },
  ];

  for (const r of records) {
    await prisma.attendance.upsert({
      where: { sessionId_studentId: { sessionId: r.sessionId, studentId: r.studentId } },
      update: {},
      create: r,
    });
  }
  console.log('✅ Attendance records created');
  console.log('\n🎉 DB fixed! Sign out and sign back in at localhost:5173');
}

main()
  .catch(e => console.error('❌', e.message))
  .finally(() => prisma.$disconnect());
