/* eslint-disable */
// Rich multi-project demo seed script
// Run via: node prisma-seed.cjs
// Cleans existing demo data and seeds projects: Zhang Clan, Li Clan, and Chen Clan with cross-project associations, DNA matches, and classmates.

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

const demoProjectNames = [
  '张氏大成宗谱 · 江南支派',
  '李氏家乘 · 吴郡支派',
  '陈氏宗谱 · 渤海支派'
];

async function main() {
  console.log('[seed] Cleaning up existing demo projects and users...');
  
  // Clean projects
  const existingProjects = await prisma.project.findMany({
    where: { name: { in: demoProjectNames } }
  });
  
  for (const proj of existingProjects) {
    const projectPersons = await prisma.person.findMany({ where: { projectId: proj.id } });
    const personIds = projectPersons.map(p => p.id);
    
    await prisma.kinshipRelation.deleteMany({ where: { projectId: proj.id } });
    await prisma.officeOccupation.deleteMany({ where: { projectId: proj.id } });
    await prisma.statusRecord.deleteMany({ where: { projectId: proj.id } });
    await prisma.socialAssociation.deleteMany({ where: { projectId: proj.id } });
    await prisma.customField.deleteMany({ where: { entityId: { in: personIds } } });
    await prisma.person.deleteMany({ where: { projectId: proj.id } });
    await prisma.projectMember.deleteMany({ where: { projectId: proj.id } });
    await prisma.generation.deleteMany({ where: { projectId: proj.id } });
    await prisma.branch.deleteMany({ where: { projectId: proj.id } });
    await prisma.source.deleteMany({ where: { projectId: proj.id } });
    await prisma.project.delete({ where: { id: proj.id } });
  }

  // Clean users
  const usernames = ['admin', 'zhang_curator', 'guest'];
  await prisma.user.deleteMany({ where: { username: { in: usernames } } });

  console.log('[seed] Seeding rich demo user database...');
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

  const editorPassword = await bcrypt.hash('editor123', 12);
  const zhangCurator = await prisma.user.create({
    data: {
      username: 'zhang_curator',
      email: 'curator@zhang.demo',
      password: editorPassword,
      role: 'USER',
    },
  });

  const guestUser = await prisma.user.create({
    data: {
      username: 'guest',
      email: 'guest@openzupu.demo',
      password: editorPassword,
      role: 'USER',
    },
  });

  // --- SEED PLACES ---
  const placeNanjing = await prisma.place.create({
    data: { name: '南京', fullName: '江苏省江宁府上元县', placeType: 'CITY', historicalName: '江宁/应天府', currentName: '南京' }
  });
  const placeSuzhou = await prisma.place.create({
    data: { name: '苏州', fullName: '江苏省苏州府吴县', placeType: 'CITY', historicalName: '平江府', currentName: '苏州' }
  });
  const placeShanghai = await prisma.place.create({
    data: { name: '上海', fullName: '江苏省松江府上海县', placeType: 'CITY', historicalName: '华亭县', currentName: '上海' }
  });

  // ==========================================
  // PROJECT 1: 张氏大成宗谱 (Zhang Clan)
  // ==========================================
  const projectZhang = await prisma.project.create({
    data: {
      name: '张氏大成宗谱 · 江南支派',
      description: '演示数据一：江南张氏支系谱牒，包含 12 人、4 代成员。本谱有女性成员【张致雅】联姻嫁入李氏宗谱，并且有成员【张致新】与陈氏宗谱【陈怀祖】具备高度匹配的 Y-DNA 指纹并曾为同窗好友。',
      projectType: 'CLAN',
      defaultPrivacy: 'Private',
      ownerId: zhangCurator.id,
    }
  });

  await prisma.projectMember.createMany({
    data: [
      { projectId: projectZhang.id, userId: zhangCurator.id, role: 'OWNER' },
      { projectId: projectZhang.id, userId: admin.id, role: 'ADMIN' },
      { projectId: projectZhang.id, userId: guestUser.id, role: 'VIEWER' }
    ]
  });

  const sourceZhang = await prisma.source.create({
    data: {
      projectId: projectZhang.id,
      sourceType: 'GENEALOGY_BOOK',
      title: '《张氏大成宗谱》光绪修本',
      author: '张德裕',
      reliability: 'High',
    }
  });

  // ==========================================
  // PROJECT 2: 李氏家乘 (Li Clan)
  // ==========================================
  const projectLi = await prisma.project.create({
    data: {
      name: '李氏家乘 · 吴郡支派',
      description: '演示数据二：吴门李氏商贾望族，包含 5 人、3 代成员。本谱通过跨族谱联姻关系与张氏宗谱【张致雅】互通，并育有后代【李怀】。',
      projectType: 'CLAN',
      defaultPrivacy: 'Private',
      ownerId: zhangCurator.id,
    }
  });

  await prisma.projectMember.createMany({
    data: [
      { projectId: projectLi.id, userId: zhangCurator.id, role: 'OWNER' },
      { projectId: projectLi.id, userId: admin.id, role: 'ADMIN' },
      { projectId: projectLi.id, userId: guestUser.id, role: 'VIEWER' }
    ]
  });

  // ==========================================
  // PROJECT 3: 陈氏宗谱 (Chen Clan)
  // ==========================================
  const projectChen = await prisma.project.create({
    data: {
      name: '陈氏宗谱 · 渤海支派',
      description: '演示数据三：海派陈氏书香世家，主要记载近代学者成员。其中【陈怀祖】在 1905 年就读于上海南洋公学，与张氏宗谱的【张致新】是同届同学，且通过 Y-DNA 测试发现二人存在近 2000 年内的同宗父系关联。',
      projectType: 'CLAN',
      defaultPrivacy: 'Private',
      ownerId: zhangCurator.id,
    }
  });

  await prisma.projectMember.createMany({
    data: [
      { projectId: projectChen.id, userId: zhangCurator.id, role: 'OWNER' },
      { projectId: projectChen.id, userId: admin.id, role: 'ADMIN' },
      { projectId: projectChen.id, userId: guestUser.id, role: 'VIEWER' }
    ]
  });


  // --- CREATE PEOPLE FOR ZHANG CLAN (P1) ---
  const zhang = {};
  async function addZhang(key, data) {
    zhang[key] = await prisma.person.create({
      data: { projectId: projectZhang.id, ...data }
    });
  }

  await addZhang('shouren', {
    surname: '张', givenName: '守仁', sex: 'Male',
    birthDate: '1845-03-12', deathDate: '1912-08-30',
    isLiving: false, generationCharacter: '守', generationNumber: 12,
    courtesyName: '厚甫', artName: '退思', tabooName: '守仁', posthumousName: '文懿',
    biography: '字厚甫，张氏江南支派第十二世长兄。咸丰年间中举人，曾任江宁府学训导。',
    ancestralPlaceId: placeNanjing.id,
    patrilinealDna: 'O-M122',
  });

  await addZhang('shouyi', {
    surname: '张', givenName: '守义', sex: 'Male',
    birthDate: '1848-07-05', deathDate: '1915-02-14',
    isLiving: false, generationCharacter: '守', generationNumber: 12,
    courtesyName: '仲方',
    biography: '守仁二弟。同治年间迁居苏州，经营丝绸生意。',
    ancestralPlaceId: placeNanjing.id,
    patrilinealDna: 'O-M122',
  });

  await addZhang('shouli', {
    surname: '张', givenName: '守礼', sex: 'Male',
    birthDate: '1851-11-20', deathDate: '1920-05-08',
    isLiving: false, generationCharacter: '守', generationNumber: 12,
    courtesyName: '季和',
    biography: '守仁三弟。赴上海求学，入盛宣怀幕府，参与创办南洋公学。',
    ancestralPlaceId: placeNanjing.id,
    patrilinealDna: 'O-M122',
  });

  await addZhang('wang_wife', {
    surname: '王', givenName: '氏', sex: 'Female',
    birthDate: '1849-02-18', deathDate: '1918-04-22',
    isLiving: false, generationNumber: 12,
    biography: '南京王氏之女，守仁原配。',
  });

  await addZhang('zhiyuan', {
    surname: '张', givenName: '致远', sex: 'Male',
    birthDate: '1872-05-08', deathDate: '1945-03-15',
    isLiving: false, generationCharacter: '致', generationNumber: 13,
    courtesyName: '子通',
    biography: '守仁长子，留学日本法政大学。民国时曾任上海特别市议员。',
    ancestralPlaceId: placeNanjing.id,
    patrilinealDna: 'O-M122',
  });

  await addZhang('zhiya', {
    surname: '张', givenName: '致雅', sex: 'Female',
    birthDate: '1875-10-22', deathDate: '1948-07-11',
    isLiving: false, generationCharacter: '致', generationNumber: 13,
    biography: '守仁长女。光绪二十五年（1899）与苏州李氏家族【李万年】联姻，嫁入吴门李氏。',
    ancestralPlaceId: placeNanjing.id,
  });

  await addZhang('zhixin', {
    surname: '张', givenName: '致新', sex: 'Male',
    birthDate: '1878-04-19', deathDate: '1956-11-22',
    isLiving: false, generationCharacter: '致', generationNumber: 13,
    courtesyName: '德清',
    biography: '守礼之子，南洋公学教授。曾在南洋公学就读期间与陈氏【陈怀祖】为同窗挚友。',
    ancestralPlaceId: placeShanghai.id,
    patrilinealDna: 'O-M122',
    dnaSampleId: 'DNA-ZHANG-013',
    // Close match DNA markers
    dnaMarkers: 'DYS393=13;DYS390=24;DYS19=14;DYS391=11;D3S1358=15,16',
  });

  await addZhang('yujia', {
    surname: '张', givenName: '宇佳', sex: 'Male',
    birthDate: '1898-11-12', deathDate: '1978-04-20',
    isLiving: false, generationCharacter: '宇', generationNumber: 14,
    biography: '致远之子，清华学校毕业，工程师。',
    patrilinealDna: 'O-M122',
  });

  await addZhang('haoran', {
    surname: '张', givenName: '浩然', sex: 'Male',
    birthDate: '1948-03-15',
    isLiving: true, generationCharacter: '浩', generationNumber: 15,
    biography: '宇佳之子，退休教授。本族谱现任主编。',
    patrilinealDna: 'O-M122',
  });


  // --- CREATE PEOPLE FOR LI CLAN (P2) ---
  const li = {};
  async function addLi(key, data) {
    li[key] = await prisma.person.create({
      data: { projectId: projectLi.id, ...data }
    });
  }

  await addLi('libingheng', {
    surname: '李', givenName: '秉恒', sex: 'Male',
    birthDate: '1846-01-20', deathDate: '1918-10-15',
    isLiving: false, generationNumber: 18,
    courtesyName: '敬斋',
    biography: '吴门绸缎大商，创办“李瑞丰”丝绸商号。与张守义为生意密友。',
    ancestralPlaceId: placeSuzhou.id,
    patrilinealDna: 'O-CTS201',
  });

  await addLi('liwannian', {
    surname: '李', givenName: '万年', sex: 'Male',
    birthDate: '1873-04-15', deathDate: '1942-12-05',
    isLiving: false, generationNumber: 19,
    courtesyName: '延之',
    biography: '秉恒长子。迎娶南京张氏宗谱【张致雅】为妻，承袭家族丝绸商会。',
    ancestralPlaceId: placeSuzhou.id,
    patrilinealDna: 'O-CTS201',
  });

  await addLi('lihuai', {
    surname: '李', givenName: '怀', sex: 'Male',
    birthDate: '1901-08-30', deathDate: '1982-05-18',
    isLiving: false, generationNumber: 20,
    courtesyName: '归真',
    biography: '万年与张致雅所生独子，后移居上海，在法租界任律师。',
    ancestralPlaceId: placeSuzhou.id,
    patrilinealDna: 'O-CTS201',
  });


  // --- CREATE PEOPLE FOR CHEN CLAN (P3) ---
  const chen = {};
  async function addChen(key, data) {
    chen[key] = await prisma.person.create({
      data: { projectId: projectChen.id, ...data }
    });
  }

  await addChen('chenshizeng', {
    surname: '陈', givenName: '石曾', sex: 'Male',
    birthDate: '1850-02-14', deathDate: '1925-06-22',
    isLiving: false, generationNumber: 23,
    biography: '陈氏渤海支派宗长，上海名儒。',
    ancestralPlaceId: placeShanghai.id,
    patrilinealDna: 'O-M122',
  });

  await addChen('chenhuaizu', {
    surname: '陈', givenName: '怀祖', sex: 'Male',
    birthDate: '1879-05-09', deathDate: '1960-03-24',
    isLiving: false, generationNumber: 24,
    courtesyName: '念慈',
    biography: '石曾独子，曾留学美国哥伦比亚大学。同张致新为上海南洋公学同班同学。',
    ancestralPlaceId: placeShanghai.id,
    patrilinealDna: 'O-M122',
    dnaSampleId: 'DNA-CHEN-024',
    // Matching DNA markers with Zhang Zhixin (differing by only 1 STR mutation)
    dnaMarkers: 'DYS393=13;DYS390=24;DYS19=14;DYS391=11;D3S1358=15,17',
  });


  // ==========================================
  // IN-PROJECT & CROSS-PROJECT KINSHIP
  // ==========================================
  
  // 1. Zhang Clan Kinships (P1)
  await prisma.kinshipRelation.createMany({
    data: [
      { projectId: projectZhang.id, fromPersonId: zhang.shouren.id, toPersonId: zhang.wang_wife.id, relationType: 'SPOUSE_OF', status: 'CONFIRMED' },
      { projectId: projectZhang.id, fromPersonId: zhang.shouren.id, toPersonId: zhang.zhiyuan.id, relationType: 'BIOLOGICAL_FATHER_OF', status: 'CONFIRMED' },
      { projectId: projectZhang.id, fromPersonId: zhang.wang_wife.id, toPersonId: zhang.zhiyuan.id, relationType: 'BIOLOGICAL_MOTHER_OF', status: 'CONFIRMED' },
      { projectId: projectZhang.id, fromPersonId: zhang.shouren.id, toPersonId: zhang.zhiya.id, relationType: 'BIOLOGICAL_FATHER_OF', status: 'CONFIRMED' },
      { projectId: projectZhang.id, fromPersonId: zhang.wang_wife.id, toPersonId: zhang.zhiya.id, relationType: 'BIOLOGICAL_MOTHER_OF', status: 'CONFIRMED' },
      { projectId: projectZhang.id, fromPersonId: zhang.shouli.id, toPersonId: zhang.zhixin.id, relationType: 'BIOLOGICAL_FATHER_OF', status: 'CONFIRMED' },
      { projectId: projectZhang.id, fromPersonId: zhang.zhiyuan.id, toPersonId: zhang.yujia.id, relationType: 'BIOLOGICAL_FATHER_OF', status: 'CONFIRMED' },
      { projectId: projectZhang.id, fromPersonId: zhang.yujia.id, toPersonId: zhang.haoran.id, relationType: 'BIOLOGICAL_FATHER_OF', status: 'CONFIRMED' },
      { projectId: projectZhang.id, fromPersonId: zhang.shouren.id, toPersonId: zhang.shouyi.id, relationType: 'SIBLING_OF', status: 'CONFIRMED' },
      { projectId: projectZhang.id, fromPersonId: zhang.shouren.id, toPersonId: zhang.shouli.id, relationType: 'SIBLING_OF', status: 'CONFIRMED' }
    ]
  });

  // 2. Li Clan Kinships (P2)
  await prisma.kinshipRelation.createMany({
    data: [
      { projectId: projectLi.id, fromPersonId: li.libingheng.id, toPersonId: li.liwannian.id, relationType: 'BIOLOGICAL_FATHER_OF', status: 'CONFIRMED' },
      { projectId: projectLi.id, fromPersonId: li.liwannian.id, toPersonId: li.lihuai.id, relationType: 'BIOLOGICAL_FATHER_OF', status: 'CONFIRMED' }
    ]
  });

  // 3. Chen Clan Kinships (P3)
  await prisma.kinshipRelation.createMany({
    data: [
      { projectId: projectChen.id, fromPersonId: chen.chenshizeng.id, toPersonId: chen.chenhuaizu.id, relationType: 'BIOLOGICAL_FATHER_OF', status: 'CONFIRMED' }
    ]
  });

  // 4. CROSS-PROJECT MARRIAGES & CHILD RELATIONSHIPS
  // Connect Li Wannian (Li Clan) and Zhang Zhiya (Zhang Clan)
  await prisma.kinshipRelation.create({
    data: {
      projectId: projectLi.id,
      fromPersonId: li.liwannian.id,
      toPersonId: zhang.zhiya.id, // Links directly across projects!
      relationType: 'SPOUSE_OF',
      status: 'CONFIRMED',
      notes: '跨族谱联姻：娶南京张守仁长女张致雅'
    }
  });

  await prisma.kinshipRelation.create({
    data: {
      projectId: projectZhang.id,
      fromPersonId: zhang.zhiya.id,
      toPersonId: li.liwannian.id, // Links directly across projects!
      relationType: 'SPOUSE_OF',
      status: 'CONFIRMED',
      notes: '跨族谱联姻：出嫁至苏州商贾李万年'
    }
  });

  // Connect Li Huai (Li Clan) to mother Zhang Zhiya (Zhang Clan)
  await prisma.kinshipRelation.create({
    data: {
      projectId: projectLi.id,
      fromPersonId: zhang.zhiya.id, // Mother from Zhang Clan
      toPersonId: li.lihuai.id, // Son in Li Clan
      relationType: 'BIOLOGICAL_MOTHER_OF',
      status: 'CONFIRMED',
      notes: '母系跨族谱追溯'
    }
  });


  // ==========================================
  // CROSS-PROJECT SOCIAL ASSOCIATIONS
  // ==========================================
  
  // Classmate relationship: Zhang Zhixin (P1) <-> Chen Huaizu (P3)
  await prisma.socialAssociation.create({
    data: {
      projectId: projectZhang.id,
      fromId: zhang.zhixin.id,
      toId: chen.chenhuaizu.id,
      relationType: 'COLLEAGUE',
      startDate: '1905',
      endDate: '1909',
      notes: '上海南洋公学同窗同届同学（1905年入学）'
    }
  });

  await prisma.socialAssociation.create({
    data: {
      projectId: projectChen.id,
      fromId: chen.chenhuaizu.id,
      toId: zhang.zhixin.id,
      relationType: 'COLLEAGUE',
      startDate: '1905',
      endDate: '1909',
      notes: '上海南洋公学同窗同届同学（1905年入学）'
    }
  });


  // ==========================================
  // ENRICH WITH CAREERS, STATUS RECORDS & CUSTOM FIELDS
  // ==========================================

  // Zhang Zhixin (P1) Career & Education
  await prisma.officeOccupation.create({
    data: {
      projectId: projectZhang.id,
      personId: zhang.zhixin.id,
      title: '南洋公学物理学教授',
      type: 'ACADEMIC',
      placeId: placeShanghai.id,
      startDate: '1912',
      endDate: '1937'
    }
  });

  await prisma.statusRecord.create({
    data: {
      projectId: projectZhang.id,
      personId: zhang.zhixin.id,
      statusType: 'DEGREE',
      statusValue: '清华学堂公派留美康奈尔大学理学学士',
      date: '1911'
    }
  });

  // Li Wannian (P2) custom business fields
  await prisma.officeOccupation.create({
    data: {
      projectId: projectLi.id,
      personId: li.liwannian.id,
      title: '李瑞丰绸缎庄大掌柜',
      type: 'TRADE',
      placeId: placeSuzhou.id,
      startDate: '1898',
      endDate: '1935'
    }
  });

  await prisma.customField.create({
    data: {
      entityType: 'PERSON',
      entityId: li.liwannian.id,
      fieldName: '商会掌管范围',
      fieldValue: '苏松沪绸缎贸易及原料运输',
      fieldType: 'STRING'
    }
  });

  // Chen Huaizu (P3) custom academic career
  await prisma.officeOccupation.create({
    data: {
      projectId: projectChen.id,
      personId: chen.chenhuaizu.id,
      title: '震旦大学国文系讲师',
      type: 'ACADEMIC',
      placeId: placeShanghai.id,
      startDate: '1915',
      endDate: '1940'
    }
  });

  console.log('[seed] ✅ Rich multi-project demo data successfully seeded!');
  console.log('[seed] Projects generated:');
  console.log('       1. "张氏大成宗谱 · 江南支派" (Zhang Clan)');
  console.log('       2. "李氏家乘 · 吴郡支派" (Li Clan)');
  console.log('       3. "陈氏宗谱 · 渤海支派" (Chen Clan)');
  console.log('[seed] Multi-clan relations:');
  console.log('       - Marriage: Zhang Zhiya (P1) <-> Li Wannian (P2)');
  console.log('       - Classmates: Zhang Zhixin (P1) <-> Chen Huaizu (P3) at Nanyang Public School (1905)');
  console.log('       - DNA genetic linkage: Zhang Zhixin (P1) <-> Chen Huaizu (P3) O-M122 STR match');
}

main()
  .catch((e) => {
    console.error('[seed] ❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
