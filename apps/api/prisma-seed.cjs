/* eslint-disable */
// Rich 200+ multi-project demo seed script
// Run via: node prisma-seed.cjs
// Cleans existing demo data and seeds projects: Zhang Clan, Li Clan, Chen Clan, and Wang Clan with cross-project associations, DNA matches, classmates, and adoption cross-genealogy tracking.

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
  '陈氏宗谱 · 渤海支派',
  '王氏宗谱 · 豫章支派'
];

async function main() {
  console.log('[seed] Cleaning up existing demo projects and users...');
  
  // Clean all relational records across the target projects in a safe, non-violating sequence
  const targetProjectIds = (await prisma.project.findMany({
    where: { name: { in: demoProjectNames } },
    select: { id: true }
  })).map(p => p.id);

  if (targetProjectIds.length > 0) {
    const demoPersons = await prisma.person.findMany({
      where: { projectId: { in: targetProjectIds } },
      select: { id: true }
    });
    const demoPersonIds = demoPersons.map(p => p.id);

    await prisma.kinshipRelation.deleteMany({
      where: {
        OR: [
          { projectId: { in: targetProjectIds } },
          { fromPersonId: { in: demoPersonIds } },
          { toPersonId: { in: demoPersonIds } }
        ]
      }
    });
    
    await prisma.officeOccupation.deleteMany({ where: { projectId: { in: targetProjectIds } } });
    await prisma.statusRecord.deleteMany({ where: { projectId: { in: targetProjectIds } } });
    await prisma.socialAssociation.deleteMany({ where: { projectId: { in: targetProjectIds } } });
    
    const persons = await prisma.person.findMany({ where: { projectId: { in: targetProjectIds } }, select: { id: true } });
    const personIds = persons.map(p => p.id);
    await prisma.customField.deleteMany({ where: { entityId: { in: personIds } } });
    
    await prisma.person.deleteMany({ where: { projectId: { in: targetProjectIds } } });
    await prisma.projectMember.deleteMany({ where: { projectId: { in: targetProjectIds } } });
    await prisma.generation.deleteMany({ where: { projectId: { in: targetProjectIds } } });
    await prisma.branch.deleteMany({ where: { projectId: { in: targetProjectIds } } });
    await prisma.source.deleteMany({ where: { projectId: { in: targetProjectIds } } });
    await prisma.project.deleteMany({ where: { id: { in: targetProjectIds } } });
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
  const placeNanchang = await prisma.place.create({
    data: { name: '南昌', fullName: '江西省南昌府南昌县', placeType: 'CITY', historicalName: '豫章', currentName: '南昌' }
  });

  // ==========================================
  // PROJECT 1: 张氏大成宗谱 (Zhang Clan)
  // ==========================================
  const projectZhang = await prisma.project.create({
    data: {
      name: '张氏大成宗谱 · 江南支派',
      description: '演示数据一：江南张氏支系谱牒，包含 100+ 成员。本谱有女性成员【张致雅】联姻嫁入李氏宗谱，成员【张致新】与陈氏宗谱【陈怀祖】为同窗好友。特别载有第十四代【张宇轩】出嗣豫章王氏为子，通过 Y-DNA 测试，其王氏曾孙【王绍祥】与本谱主编【张浩然】指纹高度吻合，证实了出嗣记录。',
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

  // ==========================================
  // PROJECT 2: 李氏家乘 (Li Clan)
  // ==========================================
  const projectLi = await prisma.project.create({
    data: {
      name: '李氏家乘 · 吴郡支派',
      description: '演示数据二：吴门李氏商贾望族，包含 50+ 成员。本谱通过跨族谱联姻关系与张氏宗谱【张致雅】互通，并育有后代【李怀】。',
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
      description: '演示数据三：海派陈氏书香世家，主要记载近代学者成员，包含 30+ 成员。其中【陈怀祖】与张氏【张致新】为上海南洋公学同班同学，且通过 Y-DNA 测试发现二人存在近 2000 年内的同宗父系关联。',
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

  // ==========================================
  // PROJECT 4: 王氏宗谱 (Wang Clan - Adoption Target)
  // ==========================================
  const projectWang = await prisma.project.create({
    data: {
      name: '王氏宗谱 · 豫章支派',
      description: '演示数据四：江西豫章王氏族谱，包含 30+ 成员。本谱记载了第十四代【王宇轩】（原系江南张氏，出嗣王氏为子），并通过其曾孙【王绍祥】的 Y-DNA 数据成功匹配张氏家族，印证了族谱中“承嗣”的真实性。',
      projectType: 'CLAN',
      defaultPrivacy: 'Private',
      ownerId: zhangCurator.id,
    }
  });

  await prisma.projectMember.createMany({
    data: [
      { projectId: projectWang.id, userId: zhangCurator.id, role: 'OWNER' },
      { projectId: projectWang.id, userId: admin.id, role: 'ADMIN' },
      { projectId: projectWang.id, userId: guestUser.id, role: 'VIEWER' }
    ]
  });

  // --- CREATE SEEDING DATA MAPS ---
  const zhang = {};
  const li = {};
  const chen = {};
  const wang = {};

  // ==========================================
  // 1. ZHANG CLAN (P1) CORE INDIVIDUALS
  // ==========================================
  async function addZhang(key, data) {
    zhang[key] = await prisma.person.create({
      data: { projectId: projectZhang.id, ...data }
    });
  }

  await addZhang('shouren', {
    surname: '张', givenName: '守仁', sex: 'Male',
    birthDate: '1845-03-12', deathDate: '1912-08-30',
    isLiving: false, generationCharacter: '守', generationNumber: 12,
    courtesyName: '厚甫', artName: '退思',
    biography: '字厚甫，清咸丰举人，曾任江宁府学训导。',
    ancestralPlaceId: placeNanjing.id,
    patrilinealDna: 'O-M122',
    avatarUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='46' fill='%23fefaf2' stroke='%23b91c1c' stroke-width='4'/><text x='50' y='62' font-size='38' font-family='SimSun, serif' font-weight='bold' text-anchor='middle' fill='%23b91c1c'>守仁</text></svg>",
  });

  await addZhang('shouyi', {
    surname: '张', givenName: '守义', sex: 'Male',
    birthDate: '1848-07-05', deathDate: '1915-02-14',
    isLiving: false, generationCharacter: '守', generationNumber: 12,
    biography: '同治年间迁居苏州，经营绸缎庄。',
    ancestralPlaceId: placeNanjing.id,
    patrilinealDna: 'O-M122',
    avatarUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='46' fill='%23fefaf2' stroke='%23b91c1c' stroke-width='4'/><text x='50' y='62' font-size='38' font-family='SimSun, serif' font-weight='bold' text-anchor='middle' fill='%23b91c1c'>守义</text></svg>",
  });

  await addZhang('shouli', {
    surname: '张', givenName: '守礼', sex: 'Male',
    birthDate: '1851-11-20', deathDate: '1920-05-08',
    isLiving: false, generationCharacter: '守', generationNumber: 12,
    biography: '盛宣怀幕僚，参与创办南洋公学。',
    ancestralPlaceId: placeNanjing.id,
    patrilinealDna: 'O-M122',
    avatarUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='46' fill='%23fefaf2' stroke='%23b91c1c' stroke-width='4'/><text x='50' y='62' font-size='38' font-family='SimSun, serif' font-weight='bold' text-anchor='middle' fill='%23b91c1c'>守礼</text></svg>",
  });

  await addZhang('wang_wife', {
    surname: '王', givenName: '氏', sex: 'Female',
    birthDate: '1849-02-18', deathDate: '1918-04-22',
    isLiving: false, generationNumber: 12,
  });

  await addZhang('zhiyuan', {
    surname: '张', givenName: '致远', sex: 'Male',
    birthDate: '1872-05-08', deathDate: '1945-03-15',
    isLiving: false, generationCharacter: '致', generationNumber: 13,
    biography: '守仁长子，日本法政大学毕业，上海市议员。',
    patrilinealDna: 'O-M122',
  });

  await addZhang('zhiya', {
    surname: '张', givenName: '致雅', sex: 'Female',
    birthDate: '1875-10-22', deathDate: '1948-07-11',
    isLiving: false, generationCharacter: '致', generationNumber: 13,
    biography: '守仁长女，于1899年嫁入吴门李万年家。',
  });

  await addZhang('zhixin', {
    surname: '张', givenName: '致新', sex: 'Male',
    birthDate: '1878-04-19', deathDate: '1956-11-22',
    isLiving: false, generationCharacter: '致', generationNumber: 13,
    courtesyName: '德清',
    biography: '守礼之子，南洋公学物理学教授。与陈氏【陈怀祖】为同窗挚友。',
    patrilinealDna: 'O-M122',
    dnaSampleId: 'DNA-ZHANG-013',
    dnaMarkers: 'DYS393=13;DYS390=24;DYS19=14;DYS391=11;D3S1358=15,16',
  });

  await addZhang('yujia', {
    surname: '张', givenName: '宇佳', sex: 'Male',
    birthDate: '1898-11-12', deathDate: '1978-04-20',
    isLiving: false, generationCharacter: '宇', generationNumber: 14,
    patrilinealDna: 'O-M122',
  });

  // A姓嗣B姓：张宇轩 (出嗣王氏)
  await addZhang('yuxuan', {
    surname: '张', givenName: '宇轩', sex: 'Male',
    birthDate: '1902-05-18', deathDate: '1980-03-24',
    isLiving: false, generationCharacter: '宇', generationNumber: 14,
    originalSurname: '张', adoptedSurname: '王',
    biography: '致远次子，谱载：“出嗣豫章王氏为子，承王氏香火”。改名王宇轩。',
    patrilinealDna: 'O-M122',
  });

  await addZhang('haoran', {
    surname: '张', givenName: '浩然', sex: 'Male',
    birthDate: '1948-03-15',
    isLiving: true, generationCharacter: '浩', generationNumber: 15,
    biography: '宇佳之子，退休教授。本族谱现任主编。',
    patrilinealDna: 'O-M122',
    dnaSampleId: 'DNA-ZHANG-MAIN',
    dnaMarkers: 'DYS393=13;DYS390=24;DYS19=14;DYS391=11;D3S1358=15,16',
  });

  // ==========================================
  // 2. LI CLAN (P2) CORE INDIVIDUALS
  // ==========================================
  async function addLi(key, data) {
    li[key] = await prisma.person.create({
      data: { projectId: projectLi.id, ...data }
    });
  }

  await addLi('libingheng', {
    surname: '李', givenName: '秉恒', sex: 'Male',
    birthDate: '1846-01-20', deathDate: '1918-10-15',
    isLiving: false, generationNumber: 18,
    biography: '吴门绸缎大商，“李瑞丰”商号创始人。',
    ancestralPlaceId: placeSuzhou.id,
    patrilinealDna: 'O-CTS201',
  });

  await addLi('liwannian', {
    surname: '李', givenName: '万年', sex: 'Male',
    birthDate: '1873-04-15', deathDate: '1942-12-05',
    isLiving: false, generationNumber: 19,
    biography: '秉恒长子。迎娶南京张致雅为妻。',
    ancestralPlaceId: placeSuzhou.id,
    patrilinealDna: 'O-CTS201',
  });

  await addLi('lihuai', {
    surname: '李', givenName: '怀', sex: 'Male',
    birthDate: '1901-08-30', deathDate: '1982-05-18',
    isLiving: false, generationNumber: 20,
    biography: '万年与张致雅所生独子，上海大律师。',
    ancestralPlaceId: placeSuzhou.id,
    patrilinealDna: 'O-CTS201',
  });

  // ==========================================
  // 3. CHEN CLAN (P3) CORE INDIVIDUALS
  // ==========================================
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
    biography: '上海震旦大学教授。曾就读上海南洋公学，与张致新为同窗同学。',
    ancestralPlaceId: placeShanghai.id,
    patrilinealDna: 'O-M122',
    dnaSampleId: 'DNA-CHEN-024',
    dnaMarkers: 'DYS393=13;DYS390=24;DYS19=14;DYS391=11;D3S1358=15,17', // Match with Zhang Zhixin
  });

  // ==========================================
  // 4. WANG CLAN (P4) CORE INDIVIDUALS
  // ==========================================
  async function addWang(key, data) {
    wang[key] = await prisma.person.create({
      data: { projectId: projectWang.id, ...data }
    });
  }

  await addWang('wangtinglan', {
    surname: '王', givenName: '廷兰', sex: 'Male',
    birthDate: '1856-02-10', deathDate: '1924-08-19',
    isLiving: false, generationNumber: 13,
    biography: '豫章王氏族长，晚清南昌儒绅。因膝下无子，于光绪末年收养张致远之子张宇轩。',
    ancestralPlaceId: placeNanchang.id,
  });

  // Adopted Person: 王宇轩 (A姓嗣B姓)
  await addWang('yuxuan_shadow', {
    surname: '王', givenName: '宇轩', sex: 'Male',
    birthDate: '1902-05-18', deathDate: '1980-03-24',
    isLiving: false, generationNumber: 14,
    originalSurname: '张', adoptedSurname: '王',
    genealogicalName: '张宇轩/王宇轩',
    biography: '王廷兰嗣子。原系南京张致远之次子，出嗣王氏。',
    ancestralPlaceId: placeNanchang.id,
    patrilinealDna: 'O-M122', // Retains biological father's Y-DNA!
  });

  await addWang('wangxian', {
    surname: '王', givenName: '世贤', sex: 'Male',
    birthDate: '1928-11-20', deathDate: '2005-09-08',
    isLiving: false, generationNumber: 15,
    biography: '王宇轩长子。',
    ancestralPlaceId: placeNanchang.id,
    patrilinealDna: 'O-M122',
  });

  await addWang('shaoxiang', {
    surname: '王', givenName: '绍祥', sex: 'Male',
    birthDate: '1952-05-12',
    isLiving: true, generationNumber: 16,
    biography: '王世贤之子，王宇轩曾孙。现居南昌。经 Y-DNA 测试为 O-M122 且与江南张氏【张浩然】STR 标记完全吻合。族谱中亦有“张宇轩出嗣王氏”之记载，基因测序完美印证了这一脉嗣承关系！',
    ancestralPlaceId: placeNanchang.id,
    patrilinealDna: 'O-M122',
    dnaSampleId: 'DNA-WANG-SHAO',
    dnaMarkers: 'DYS393=13;DYS390=24;DYS19=14;DYS391=11;D3S1358=15,16', // 100% Match with Zhang Haoran
  });


  // ==========================================
  // PROGRAMMATIC BULK DESCENDANT GENERATION (To reach 200+ individuals)
  // ==========================================
  console.log('[seed] Generating bulk descendant trees to exceed 200+ individuals...');

  const givenNames = [
    '志强', '志伟', '志明', '致远', '致新', '宇轩', '宇博', '宇翔', '宇浩', '宇杰',
    '浩然', '浩宇', '浩文', '浩海', '浩林', '泽宇', '泽洋', '泽民', '泽国', '泽深',
    '建国', '建华', '建设', '建业', '建军', '德华', '德明', '德茂', '德成', '德林',
    '家骏', '家豪', '家琪', '家瑞', '家和', '文彬', '文轩', '文博', '文瀚', '文斌',
    '国华', '国安', '云飞', '天翔', '明辉', '承德', '远航', '绍辉', '宏图', '盛业',
    '婉莹', '婉茹', '丽华', '雅珍', '美玲', '淑贤', '惠兰', '小红', '雅琴', '梦婷',
    '秀英', '雪梅', '雨婷', '丹华', '玉琴', '静宜', '秋红', '彩霞', '春燕', '晓晴'
  ];

  async function generateBulkDescendants(project, rootPerson, count, surnamePattern, startGen, basePatrilineal) {
    let queue = [rootPerson];
    let createdCount = 0;
    let personIndex = 0;
    
    while (createdCount < count && queue.length > 0) {
      const parent = queue.shift();
      const parentGen = parent.generationNumber || startGen;
      const numChildren = Math.floor(Math.random() * 2) + 1; // 1-2 children
      
      for (let i = 0; i < numChildren; i++) {
        if (createdCount >= count) break;
        const sex = Math.random() > 0.4 ? 'Male' : 'Female';
        const given = givenNames[personIndex % givenNames.length];
        personIndex++;
        const birthYear = parseInt(parent.birthDate?.split('-')[0] || '1880') + 26 + Math.floor(Math.random() * 6);
        
        const child = await prisma.person.create({
          data: {
            projectId: project.id,
            surname: surnamePattern,
            givenName: given,
            sex,
            birthDate: `${birthYear}-06-15`,
            deathDate: birthYear + 75 < 2026 ? `${birthYear + 75}-12-10` : null,
            isLiving: birthYear + 75 >= 2026,
            generationNumber: parentGen + 1,
            patrilinealDna: sex === 'Male' ? basePatrilineal : null,
            privacyLevel: 'Public'
          }
        });
        
        await prisma.kinshipRelation.create({
          data: {
            projectId: project.id,
            fromPersonId: parent.id,
            toPersonId: child.id,
            relationType: parent.sex === 'Male' ? 'BIOLOGICAL_FATHER_OF' : 'BIOLOGICAL_MOTHER_OF',
            status: 'CONFIRMED'
          }
        });
        
        queue.push(child);
        createdCount++;
      }
    }
    console.log(`[seed] Programmed ${createdCount} bulk descendants for ${surnamePattern} Clan under project ${project.name}`);
  }

  // Generate program descendants
  await generateBulkDescendants(projectZhang, zhang.yujia, 90, '张', 14, 'O-M122');
  await generateBulkDescendants(projectLi, li.lihuai, 45, '李', 20, 'O-CTS201');
  await generateBulkDescendants(projectChen, chen.chenhuaizu, 25, '陈', 24, 'O-M122');
  await generateBulkDescendants(projectWang, wang.wangxian, 25, '王', 15, 'O-M122');


  // ==========================================
  // CORE KINSHIP & CROSS-PROJECT LINKS
  // ==========================================
  
  // 1. Core Zhang kinship relations
  await prisma.kinshipRelation.createMany({
    data: [
      { projectId: projectZhang.id, fromPersonId: zhang.shouren.id, toPersonId: zhang.wang_wife.id, relationType: 'SPOUSE_OF', status: 'CONFIRMED' },
      { projectId: projectZhang.id, fromPersonId: zhang.shouren.id, toPersonId: zhang.zhiyuan.id, relationType: 'BIOLOGICAL_FATHER_OF', status: 'CONFIRMED' },
      { projectId: projectZhang.id, fromPersonId: zhang.wang_wife.id, toPersonId: zhang.zhiyuan.id, relationType: 'BIOLOGICAL_MOTHER_OF', status: 'CONFIRMED' },
      { projectId: projectZhang.id, fromPersonId: zhang.shouren.id, toPersonId: zhang.zhiya.id, relationType: 'BIOLOGICAL_FATHER_OF', status: 'CONFIRMED' },
      { projectId: projectZhang.id, fromPersonId: zhang.wang_wife.id, toPersonId: zhang.zhiya.id, relationType: 'BIOLOGICAL_MOTHER_OF', status: 'CONFIRMED' },
      { projectId: projectZhang.id, fromPersonId: zhang.shouli.id, toPersonId: zhang.zhixin.id, relationType: 'BIOLOGICAL_FATHER_OF', status: 'CONFIRMED' },
      { projectId: projectZhang.id, fromPersonId: zhang.zhiyuan.id, toPersonId: zhang.yujia.id, relationType: 'BIOLOGICAL_FATHER_OF', status: 'CONFIRMED' },
      { projectId: projectZhang.id, fromPersonId: zhang.zhiyuan.id, toPersonId: zhang.yuxuan.id, relationType: 'BIOLOGICAL_FATHER_OF', status: 'CONFIRMED' },
      { projectId: projectZhang.id, fromPersonId: zhang.yujia.id, toPersonId: zhang.haoran.id, relationType: 'BIOLOGICAL_FATHER_OF', status: 'CONFIRMED' },
      { projectId: projectZhang.id, fromPersonId: zhang.shouren.id, toPersonId: zhang.shouyi.id, relationType: 'SIBLING_OF', status: 'CONFIRMED' },
      { projectId: projectZhang.id, fromPersonId: zhang.shouren.id, toPersonId: zhang.shouli.id, relationType: 'SIBLING_OF', status: 'CONFIRMED' }
    ]
  });

  // 2. Core Li kinship relations
  await prisma.kinshipRelation.createMany({
    data: [
      { projectId: projectLi.id, fromPersonId: li.libingheng.id, toPersonId: li.liwannian.id, relationType: 'BIOLOGICAL_FATHER_OF', status: 'CONFIRMED' },
      { projectId: projectLi.id, fromPersonId: li.liwannian.id, toPersonId: li.lihuai.id, relationType: 'BIOLOGICAL_FATHER_OF', status: 'CONFIRMED' }
    ]
  });

  // 3. Core Chen kinship relations
  await prisma.kinshipRelation.createMany({
    data: [
      { projectId: projectChen.id, fromPersonId: chen.chenshizeng.id, toPersonId: chen.chenhuaizu.id, relationType: 'BIOLOGICAL_FATHER_OF', status: 'CONFIRMED' }
    ]
  });

  // 4. Core Wang kinship relations (including adoption linking)
  await prisma.kinshipRelation.createMany({
    data: [
      { projectId: projectWang.id, fromPersonId: wang.wangtinglan.id, toPersonId: wang.yuxuan_shadow.id, relationType: 'ADOPTIVE_FATHER_OF', status: 'CONFIRMED' },
      { projectId: projectWang.id, fromPersonId: wang.yuxuan_shadow.id, toPersonId: wang.wangxian.id, relationType: 'BIOLOGICAL_FATHER_OF', status: 'CONFIRMED' },
      { projectId: projectWang.id, fromPersonId: wang.wangxian.id, toPersonId: wang.shaoxiang.id, relationType: 'BIOLOGICAL_FATHER_OF', status: 'CONFIRMED' }
    ]
  });

  // 5. CROSS-PROJECT MARRIAGES & CHILD RELATIONSHIPS
  // Connect Li Wannian (Li Clan) and Zhang Zhiya (Zhang Clan)
  await prisma.kinshipRelation.create({
    data: {
      projectId: projectLi.id,
      fromPersonId: li.liwannian.id,
      toPersonId: zhang.zhiya.id,
      relationType: 'SPOUSE_OF',
      status: 'CONFIRMED',
      notes: '跨族谱联姻：娶江南张氏第十三世张致雅'
    }
  });

  await prisma.kinshipRelation.create({
    data: {
      projectId: projectZhang.id,
      fromPersonId: zhang.zhiya.id,
      toPersonId: li.liwannian.id,
      relationType: 'SPOUSE_OF',
      status: 'CONFIRMED',
      notes: '跨族谱联姻：出嫁至苏州商贾李万年'
    }
  });

  // Connect Li Huai (Li Clan) to mother Zhang Zhiya (Zhang Clan)
  await prisma.kinshipRelation.create({
    data: {
      projectId: projectLi.id,
      fromPersonId: zhang.zhiya.id,
      toPersonId: li.lihuai.id,
      relationType: 'BIOLOGICAL_MOTHER_OF',
      status: 'CONFIRMED',
    }
  });

  // 6. CROSS-PROJECT ADOPTION RELATIONSHIP LINK
  // Connect biological family (Zhang Clan) to adopted person in Wang Clan
  await prisma.kinshipRelation.create({
    data: {
      projectId: projectZhang.id,
      fromPersonId: zhang.yuxuan.id, // Profile in Zhang Clan
      toPersonId: wang.yuxuan_shadow.id, // Profile in Wang Clan
      relationType: 'ADOPTED_OUT_TO',
      status: 'CONFIRMED',
      notes: '嗣出归档：出嗣为豫章王廷兰之子，改名王宇轩'
    }
  });

  await prisma.kinshipRelation.create({
    data: {
      projectId: projectWang.id,
      fromPersonId: wang.yuxuan_shadow.id,
      toPersonId: zhang.yuxuan.id,
      relationType: 'ADOPTED_OUT_TO',
      status: 'CONFIRMED',
      notes: '承嗣记录：收南京张致远次子张宇轩为嗣'
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

  console.log('[seed] ✅ Rich 200+ multi-project demo data successfully seeded!');
  console.log('[seed] Projects generated:');
  console.log('       1. "张氏大成宗谱 · 江南支派" (Zhang Clan - 100 members)');
  console.log('       2. "李氏家乘 · 吴郡支派" (Li Clan - 50 members)');
  console.log('       3. "陈氏宗谱 · 渤海支派" (Chen Clan - 30 members)');
  console.log('       4. "王氏宗谱 · 豫章支派" (Wang Clan - 30 members)');
  console.log('[seed] Multi-clan relations:');
  console.log('       - Marriage: Zhang Zhiya (P1) <-> Li Wannian (P2)');
  console.log('       - Classmates: Zhang Zhixin (P1) <-> Chen Huaizu (P3) at Nanyang Public School (1905)');
  console.log('       - DNA genetic linkage: Zhang Zhixin (P1) <-> Chen Huaizu (P3) O-M122 STR match');
  console.log('       - A-to-B Adoption: Zhang Yuxuan (P1) adopted out as Wang Yuxuan (P4) with matching O-M122 Y-DNA on Wang Shaoxiang.');
}

main()
  .catch((e) => {
    console.error('[seed] ❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
