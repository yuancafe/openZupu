/* eslint-disable */
// Demo seed script — 张氏族谱 (Zhang Family Genealogy)
// Run via: node prisma-seed.cjs  (called from apps/api/Dockerfile on first deploy)
// Idempotent: skips if demo project already exists.

let PrismaClient;
try {
  ({ PrismaClient } = require('@openzupu/database'));
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') {
    throw error;
  }
  ({ PrismaClient } = require('../../packages/database/dist'));
}

const prisma = new PrismaClient();

const DEMO_PROJECT_NAME = '张氏大成宗谱 · 江南支派';

async function main() {
  // 1. Skip if seed already ran
  const existing = await prisma.project.findFirst({
    where: { name: DEMO_PROJECT_NAME },
  });
  if (existing) {
    console.log('[seed] Demo project already exists, skipping.');
    return;
  }
  console.log('[seed] Seeding 张氏族谱 demo data...');

  // 2. Create admin user
  const bcrypt = require('bcrypt');
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@openzupu.demo',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // 3. Create 2 editor users
  const editorPassword = await bcrypt.hash('editor123', 12);
  const editor1 = await prisma.user.create({
    data: {
      username: 'zhang_curator',
      email: 'curator@zhang.demo',
      password: editorPassword,
      role: 'USER',
    },
  });
  const editor2 = await prisma.user.create({
    data: {
      username: 'guest',
      email: 'guest@openzupu.demo',
      password: editorPassword,
      role: 'USER',
    },
  });

  // 4. Create demo project
  const project = await prisma.project.create({
    data: {
      name: DEMO_PROJECT_NAME,
      description: '演示数据：江南张氏三兄弟及其子孙，跨越 4 代约 15 人的典型族谱网络。\n\n**登录账号**：\n- admin / admin123（系统管理员）\n- zhang_curator / editor123（宗亲会管理员）\n- guest / editor123（只读访客）',
      projectType: 'CLAN',
      defaultPrivacy: 'Private',
      ownerId: editor1.id,
    },
  });

  // Add admin and editor2 as members
  await prisma.projectMember.createMany({
    data: [
      { projectId: project.id, userId: editor1.id, role: 'OWNER' },
      { projectId: project.id, userId: admin.id, role: 'ADMIN' },
      { projectId: project.id, userId: editor2.id, role: 'VIEWER' },
    ],
  });

  // 5. Create demo source (fictional 族谱)
  const source = await prisma.source.create({
    data: {
      projectId: project.id,
      sourceType: 'GENEALOGY_BOOK',
      title: '《张氏大成宗谱·江南支派》光绪二十年（1894）木活字本',
      author: '张德裕',
      compiler: '张德裕',
      year: '1894',
      dynasty: '清',
      volume: '卷三·江南总图',
      page: '1-24',
      citation: '上海图书馆藏，编号 G1123-22',
      reliability: 'High',
    },
  });

  // 6. Create places
  const placeNanjing = await prisma.place.create({
    data: {
      name: '南京',
      fullName: '江苏省江宁府上元县',
      placeType: 'CITY',
      historicalName: '应天府',
      currentName: '南京',
    },
  });
  const placeSuzhou = await prisma.place.create({
    data: {
      name: '苏州',
      fullName: '江苏省苏州府吴县',
      placeType: 'CITY',
    },
  });
  const placeShanghai = await prisma.place.create({
    data: {
      name: '上海',
      fullName: '上海县',
      placeType: 'CITY',
    },
  });

  // 7. Create 张氏三兄弟 (Gen 1) + spouses
  // Person 1: 张守仁 (Zhang Shouren) — 长兄
  // Person 2: 王氏 (Wang Shi) — 长兄之妻
  // Person 3: 张守义 (Zhang Shouyi) — 次兄
  // Person 4: 李氏 (Li Shi) — 次兄之妻
  // Person 5: 张守礼 (Zhang Shouli) — 三弟
  // Person 6: 陈氏 (Chen Shi) — 三弟之妻

  const persons = {};
  async function addPerson(key, data) {
    persons[key] = await prisma.person.create({
      data: { projectId: project.id, ...data },
    });
  }

  // Gen 1 — 三兄弟 + 配偶
  await addPerson('shouren', {
    surname: '张', givenName: '守仁', sex: 'Male',
    birthDate: '1845-03-12', deathDate: '1912-08-30',
    isLiving: false, generationCharacter: '守', generationNumber: 12,
    privacyLevel: 'Public',
    biography: '字厚甫，张氏江南支派第十二世长兄。清咸丰年间中举人，曾任江宁府学训导。生平热心族务，主修本支族谱。',
    ancestralPlaceId: placeNanjing.id,
    patrilinealDna: 'O-M122',
  });
  await addPerson('shouyi', {
    surname: '张', givenName: '守义', sex: 'Male',
    birthDate: '1848-07-05', deathDate: '1915-02-14',
    isLiving: false, generationCharacter: '守', generationNumber: 12,
    privacyLevel: 'Public',
    biography: '字仲方，守仁二弟。经营丝绸生意，于苏州设绸缎庄。同治年间迁居苏州。',
    ancestralPlaceId: placeNanjing.id,
    patrilinealDna: 'O-M122',
  });
  await addPerson('shouli', {
    surname: '张', givenName: '守礼', sex: 'Male',
    birthDate: '1851-11-20', deathDate: '1920-05-08',
    isLiving: false, generationCharacter: '守', generationNumber: 12,
    privacyLevel: 'Public',
    biography: '字季和，守仁三弟。早年赴上海求学，后入盛宣怀幕府，参与创办南洋公学。',
    ancestralPlaceId: placeNanjing.id,
    patrilinealDna: 'O-M122',
  });

  // 配偶（嫁入）
  await addPerson('wang_wife', {
    surname: '王', givenName: '氏', sex: 'Female',
    birthDate: '1849-02-18', deathDate: '1918-04-22',
    isLiving: false, generationNumber: 12,
    matrilinealDna: 'D4',
    privacyLevel: 'Public',
    biography: '王氏，南京王氏之女，守仁原配。',
    ancestralPlaceId: placeNanjing.id,
  });
  await addPerson('li_wife', {
    surname: '李', givenName: '氏', sex: 'Female',
    birthDate: '1852-09-30', deathDate: '1919-12-03',
    isLiving: false, generationNumber: 12,
    matrilinealDna: 'M7',
    privacyLevel: 'Public',
    biography: '李氏，苏州李氏之女，守义原配。',
    ancestralPlaceId: placeSuzhou.id,
  });
  await addPerson('chen_wife', {
    surname: '陈', givenName: '氏', sex: 'Female',
    birthDate: '1854-06-14', deathDate: '1923-08-19',
    isLiving: false, generationNumber: 12,
    matrilinealDna: 'D4',
    privacyLevel: 'Public',
    biography: '陈氏，上海陈氏之女，守礼原配。',
    ancestralPlaceId: placeShanghai.id,
  });

  // Gen 2 — 长兄子女 (Gen 13)
  await addPerson('zhiyuan', {
    surname: '张', givenName: '致远', sex: 'Male',
    birthDate: '1872-05-08', deathDate: '1945-03-15',
    isLiving: false, generationCharacter: '致', generationNumber: 13,
    privacyLevel: 'Public',
    biography: '守仁长子，字子通，留学日本法政大学。民国时曾任上海特别市议员。',
    ancestralPlaceId: placeNanjing.id,
    patrilinealDna: 'O-M122',
  });
  await addPerson('zhiya', {
    surname: '张', givenName: '致雅', sex: 'Female',
    birthDate: '1875-10-22', deathDate: '1948-07-11',
    isLiving: false, generationCharacter: '致', generationNumber: 13,
    privacyLevel: 'Public',
    matrilinealDna: 'D4',
    ancestralPlaceId: placeNanjing.id,
  });

  // 次兄子女 (Gen 13)
  await addPerson('zhiqiang', {
    surname: '张', givenName: '致强', sex: 'Male',
    birthDate: '1876-12-01', deathDate: '1952-09-04',
    isLiving: false, generationCharacter: '致', generationNumber: 13,
    privacyLevel: 'Public',
    biography: '守义长子，子承父业经营苏州绸缎庄。',
    ancestralPlaceId: placeSuzhou.id,
    patrilinealDna: 'O-M122',
  });

  // 三弟子女 (Gen 13)
  await addPerson('zhixin', {
    surname: '张', givenName: '致新', sex: 'Male',
    birthDate: '1878-04-19', deathDate: '1956-11-22',
    isLiving: false, generationCharacter: '致', generationNumber: 13,
    privacyLevel: 'Public',
    biography: '守礼独子，清华学堂毕业（1909），赴美留学康奈尔大学，归国后任南洋公学教授。',
    ancestralPlaceId: placeShanghai.id,
    patrilinealDna: 'O-M122',
  });
  await addPerson('chen_daughter', {
    surname: '陈', givenName: '婉', sex: 'Female',
    birthDate: '1880-09-30', deathDate: '1965-02-14',
    isLiving: false, generationNumber: 13,
    matrilinealDna: 'D4',
    privacyLevel: 'Public',
    biography: '陈氏（陈婉），上海陈氏之女，嫁入张氏。',
    ancestralPlaceId: placeShanghai.id,
  });

  // Gen 3 — 孙辈
  await addPerson('yujia', {
    surname: '张', givenName: '宇佳', sex: 'Male',
    birthDate: '1898-11-12', deathDate: '1978-04-20',
    isLiving: false, generationCharacter: '宇', generationNumber: 14,
    privacyLevel: 'Public',
    biography: '致远之子，清华学校毕业，工程师。',
    ancestralPlaceId: placeShanghai.id,
    patrilinealDna: 'O-M122',
  });
  await addPerson('yuting', {
    surname: '张', givenName: '宇婷', sex: 'Female',
    birthDate: '1902-07-08', deathDate: '1989-12-25',
    isLiving: false, generationCharacter: '宇', generationNumber: 14,
    matrilinealDna: 'D4',
    ancestralPlaceId: placeNanjing.id,
  });
  await addPerson('yubo', {
    surname: '张', givenName: '宇博', sex: 'Male',
    birthDate: '1903-03-17', deathDate: '1985-06-30',
    isLiving: false, generationCharacter: '宇', generationNumber: 14,
    privacyLevel: 'Public',
    patrilinealDna: 'O-M122',
    ancestralPlaceId: placeSuzhou.id,
  });
  await addPerson('yujing', {
    surname: '张', givenName: '宇晶', sex: 'Female',
    birthDate: '1905-09-22', deathDate: '1992-08-15',
    isLiving: false, generationCharacter: '宇', generationNumber: 14,
    matrilinealDna: 'D4',
    ancestralPlaceId: placeShanghai.id,
  });

  // Gen 4 — 曾孙 (在世 demo)
  await addPerson('haoran', {
    surname: '张', givenName: '浩然', sex: 'Male',
    birthDate: '1948-03-15',
    isLiving: true, generationCharacter: '浩', generationNumber: 15,
    privacyLevel: 'Private',
    biography: '宇佳之子，现居上海，退休教授。本族谱现任主编。',
    ancestralPlaceId: placeShanghai.id,
    patrilinealDna: 'O-M122',
  });
  await addPerson('haoyue', {
    surname: '张', givenName: '皓月', sex: 'Female',
    birthDate: '1952-08-20',
    isLiving: true, generationCharacter: '浩', generationNumber: 15,
    privacyLevel: 'FamilyOnly',
    matrilinealDna: 'D4',
    ancestralPlaceId: placeShanghai.id,
  });

  // 8. Create kinship relations
  async function addRelation(fromKey, toKey, type, opts = {}) {
    await prisma.kinshipRelation.create({
      data: {
        projectId: project.id,
        fromPersonId: persons[fromKey].id,
        toPersonId: persons[toKey].id,
        relationType: type,
        inverseRelationType: opts.inverse,
        status: 'CONFIRMED',
        confidence: 0.95,
        sourceId: source.id,
      },
    });
  }

  // 长兄家庭
  await addRelation('shouren', 'wang_wife', 'SPOUSE_OF', { inverse: 'SPOUSE_OF' });
  await addRelation('shouren', 'zhiyuan', 'BIOLOGICAL_FATHER_OF', { inverse: 'BIOLOGICAL_CHILD_OF' });
  await addRelation('wang_wife', 'zhiyuan', 'BIOLOGICAL_MOTHER_OF', { inverse: 'BIOLOGICAL_CHILD_OF' });
  await addRelation('shouren', 'zhiya', 'BIOLOGICAL_FATHER_OF', { inverse: 'BIOLOGICAL_CHILD_OF' });
  await addRelation('wang_wife', 'zhiya', 'BIOLOGICAL_MOTHER_OF', { inverse: 'BIOLOGICAL_CHILD_OF' });

  // 次兄家庭
  await addRelation('shouyi', 'li_wife', 'SPOUSE_OF', { inverse: 'SPOUSE_OF' });
  await addRelation('shouyi', 'zhiqiang', 'BIOLOGICAL_FATHER_OF', { inverse: 'BIOLOGICAL_CHILD_OF' });
  await addRelation('li_wife', 'zhiqiang', 'BIOLOGICAL_MOTHER_OF', { inverse: 'BIOLOGICAL_CHILD_OF' });

  // 三弟家庭
  await addRelation('shouli', 'chen_wife', 'SPOUSE_OF', { inverse: 'SPOUSE_OF' });
  await addRelation('shouli', 'zhixin', 'BIOLOGICAL_FATHER_OF', { inverse: 'BIOLOGICAL_CHILD_OF' });
  await addRelation('chen_wife', 'zhixin', 'BIOLOGICAL_MOTHER_OF', { inverse: 'BIOLOGICAL_CHILD_OF' });

  // 致新与陈婉 (堂妹婚)
  await addRelation('zhixin', 'chen_daughter', 'SPOUSE_OF', { inverse: 'SPOUSE_OF' });

  // Gen 3 → Gen 4
  await addRelation('zhiyuan', 'yujia', 'BIOLOGICAL_FATHER_OF', { inverse: 'BIOLOGICAL_CHILD_OF' });
  await addRelation('zhiyuan', 'yuting', 'BIOLOGICAL_FATHER_OF', { inverse: 'BIOLOGICAL_CHILD_OF' });
  await addRelation('zhiqiang', 'yubo', 'BIOLOGICAL_FATHER_OF', { inverse: 'BIOLOGICAL_CHILD_OF' });
  await addRelation('zhixin', 'yujing', 'BIOLOGICAL_FATHER_OF', { inverse: 'BIOLOGICAL_CHILD_OF' });
  await addRelation('chen_daughter', 'yujing', 'BIOLOGICAL_MOTHER_OF', { inverse: 'BIOLOGICAL_CHILD_OF' });

  // Gen 4 → Gen 5 (在世)
  await addRelation('yujia', 'haoran', 'BIOLOGICAL_FATHER_OF', { inverse: 'BIOLOGICAL_CHILD_OF' });
  await addRelation('yujing', 'haoyue', 'BIOLOGICAL_MOTHER_OF', { inverse: 'BIOLOGICAL_CHILD_OF' });

  // 兄弟关系 (用 ADOPTIVE 不太合适，用 SIBLING_OF 标记)
  await addRelation('shouren', 'shouyi', 'SIBLING_OF', { inverse: 'SIBLING_OF' });
  await addRelation('shouren', 'shouli', 'SIBLING_OF', { inverse: 'SIBLING_OF' });
  await addRelation('shouyi', 'shouli', 'SIBLING_OF', { inverse: 'SIBLING_OF' });
  await addRelation('zhiyuan', 'zhiqiang', 'SIBLING_OF', { inverse: 'SIBLING_OF' });
  await addRelation('zhiyuan', 'zhixin', 'SIBLING_OF', { inverse: 'SIBLING_OF' });
  await addRelation('zhiqiang', 'zhixin', 'SIBLING_OF', { inverse: 'SIBLING_OF' });
  await addRelation('yujia', 'yubo', 'SIBLING_OF', { inverse: 'SIBLING_OF' });
  await addRelation('yujia', 'yujing', 'SIBLING_OF', { inverse: 'SIBLING_OF' });
  await addRelation('yubo', 'yujing', 'SIBLING_OF', { inverse: 'SIBLING_OF' });

  // 9. Create a Generation record
  await prisma.generation.createMany({
    data: [
      { projectId: project.id, generationNumber: 12, character: '守', poem: '守道传家久' },
      { projectId: project.id, generationNumber: 13, character: '致', poem: '致知以修身' },
      { projectId: project.id, generationNumber: 14, character: '宇', poem: '宇内承先志' },
      { projectId: project.id, generationNumber: 15, character: '浩', poem: '浩然与天游' },
    ],
  });

  // 10. Create a Branch (房支)
  await prisma.branch.create({
    data: {
      projectId: project.id,
      name: '长房（守仁支）',
      description: '张守仁后裔，主要分布于南京、上海。',
      founderId: persons.shouren.id,
    },
  });
  await prisma.branch.create({
    data: {
      projectId: project.id,
      name: '次房（守义支）',
      description: '张守义后裔，主要分布于苏州。',
      founderId: persons.shouyi.id,
    },
  });
  await prisma.branch.create({
    data: {
      projectId: project.id,
      name: '三房（守礼支）',
      description: '张守礼后裔，主要分布于上海。',
      founderId: persons.shouli.id,
    },
  });

  console.log('[seed] ✅ 张氏族谱 demo 数据写入成功！');
  console.log('[seed] 登录账号：');
  console.log('       admin / admin123 (ADMIN)');
  console.log('       zhang_curator / editor123 (OWNER)');
  console.log('       guest / editor123 (VIEWER)');
}

main()
  .catch((e) => {
    console.error('[seed] ❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
