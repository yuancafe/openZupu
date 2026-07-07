/* eslint-disable */
const { PrismaClient } = require('@openzupu/database');
const prisma = new PrismaClient();
(async () => {
  await prisma.kinshipRelation.deleteMany({});
  await prisma.person.deleteMany({});
  await prisma.branch.deleteMany({});
  await prisma.generation.deleteMany({});
  await prisma.source.deleteMany({});
  await prisma.place.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Cleared all data');
  await prisma.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});