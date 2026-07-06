# **OpenZupu 开源中国族谱知识图谱系统 PRD**

## **0. 文档信息**

|**项目**|**内容**|
|---|---|
|产品名称|OpenZupu|
|产品定位|面向中国族谱、家族史与数字人文研究的开源谱系知识图谱系统|
|英文定位|Open-source lineage knowledge graph system for Chinese genealogy, family history, and prosopographical research|
|文档版本|v0.2|
|文档状态|Draft|
|目标用户|家族史研究者、修谱团队、宗亲会、地方文史研究者、数字人文研究者、普通家庭用户|
|核心能力|中国族谱字段、亲属与宗法关系、证据链、CBDB 式人物传记数据库、GEDCOM 7 导入导出、图数据库、自定义字段、多视图展示、开源自托管|

---

# **1. 产品背景**

## **1.1 现实问题**

中国族谱长期依赖纸质谱牒形态，包括：

- 谱序
- 凡例
- 世系图
- 吊线图
- 欧式图
- 行传
- 字辈表
- 房支分卷
- 祠堂记
- 墓图
- 捐修名录
- 迁徙记
- 家训祠规

这些形式适合纸质出版，但不适合电子时代的数据管理。

当前所谓“电子族谱”常见问题包括：

1. 只是纸谱扫描或网页化，未真正结构化。
2. 仍以页面排版为中心，而不是以数据模型为中心。
3. 难以表达中国族谱中的复杂关系，如出继、入继、兼祧、承祧、继配、庶出、嗣子、无嗣、立嗣、房支、堂号、谱名、字辈、迁徙祖等。
4. 难以处理同一人物多姓名、多身份、多来源、多说法。
5. 难以管理证据链，无法清楚说明某个结论来自族谱、墓碑、口述、档案、地方志还是 DNA。
6. 难以支持研究型工作，如人物关系推断、社会网络分析、地方家族网络、婚姻圈、迁徙路径、职业结构等。
7. 数据格式封闭，平台迁移困难。
8. 现有 GEDCOM 格式适合国际家谱交换，但不能充分表达中国谱牒语义。
9. 现有华人修谱平台偏服务化、商业化，开源性、数据主权和研究能力不足。

因此需要一个新的开源系统，把中国族谱从“电子化纸谱”升级为：

结构化、可证据追溯、可关系计算、可长期保存、可自由迁移、可协作修订、可多样化出版的家族知识图谱系统。

---

# **2. 产品愿景**

OpenZupu 的目标不是做一个普通“家谱树”软件，而是建立一套中国族谱数字基础设施。

## **2.1 一句话愿景**

让每个家族都能拥有一套开放、自主、可验证、可扩展、可计算、可传承的族谱知识图谱。

## **2.2 核心目标**

OpenZupu 应同时满足三类需求：

### **A. 家庭与宗族层面**

- 记录家族成员。
- 展示亲属关系。
- 管理房支、字辈、堂号、祠堂、墓地。
- 支持修谱、续谱和家族成员协作。
- 导出传统族谱。

### **B. 家族史研究层面**

- 管理口述、档案、墓碑、族谱、照片、地方志、报纸、学校名录、公司资料、DNA 等来源。
- 处理冲突信息。
- 支持人物小传、事件时间线、迁徙地图。
- 支持推测关系与证据等级。

### **C. 数字人文与社会史研究层面**

- 支持 CBDB 式人物传记数据库结构。
- 支持亲属网络、姻亲网络、同学网络、同僚网络、机构网络、地理网络分析。
- 支持 GraphML、GEXF、Neo4j、Pajek 等图数据导出。
- 支持跨家族、跨地域、跨时代的 prosopographical research。

---

# **3. 产品定位**

## **3.1 产品定义**

OpenZupu 是一个开源、自托管、以中国族谱语义为核心、兼容 GEDCOM 7、借鉴 CBDB 人物传记数据库思想、支持图数据库和证据链管理的族谱知识图谱系统。

它不是单纯的：

- 家谱绘图工具；
- 在线修谱网站；
- GEDCOM 编辑器；
- 族谱扫描管理器；
- 家族纪念册；
- 个人笔记系统。

它是一个完整的数据系统：

```text
中国族谱数据模型
+ CBDB 式人物传记数据库
+ GEDCOM 7 导入导出
+ 证据链与断言管理
+ 图数据库与网络分析
+ 多视图展示
+ 协作修谱流程
+ 开源自托管基础设施
```

---

# **4. 核心设计原则**

## **4.1 数据优先，而非版式优先**

纸谱中的世系图、行传、谱序、墓图都是数据的一种输出形式。OpenZupu 的底层必须是结构化数据库，而不是固定页面。

## **4.2 证据优先，而非结论优先**

家族史资料经常存在冲突。系统必须允许：

- 多个来源并存；
- 多个说法并存；
- 可信度分级；
- 采用版本与备选版本区分；
- 假设、推断、已证实、已否定状态并存。

## **4.3 关系分型，而非单一亲属树**

中国族谱不能只用“父母—配偶—子女”表达。

系统必须区分：

- 生物学关系；
- 谱牒关系；
- 法律关系；
- 宗法关系；
- 户籍关系；
- 抚养关系；
- 婚姻关系；
- 姻亲关系；
- 社会关系；
- 机构关系；
- 推测关系。

## **4.4 中国谱牒语义原生支持**

系统应原生支持：

- 房支；
- 堂号；
- 字辈；
- 谱名；
- 行第；
- 祠堂；
- 墓地；
- 始祖；
- 迁徙祖；
- 支祖；
- 出继；
- 入继；
- 兼祧；
- 承祧；
- 继配；
- 妾；
- 庶出；
- 无嗣；
- 立嗣；
- 修谱；
- 谱序；
- 行传。

## **4.5 兼容国际标准，但不被国际标准限制**

GEDCOM 7 适合作为交换格式，但不能作为唯一主模型。

OpenZupu 的策略是：

```text
OpenZupu Native Model 作为主数据库模型
GEDCOM 7 作为导入导出与跨软件交换格式
JSON Sidecar 保存 GEDCOM 无法表达的中国谱牒语义
Graph Export 支持研究分析
```

## **4.6 开源、自托管、数据主权**

用户必须可以完整导出自己的数据，包括：

- 数据库；
- 媒体文件；
- 来源文件；
- GEDCOM；
- JSON；
- CSV；
- Markdown；
- HTML；
- GraphML；
- Neo4j Cypher；
- SQLite Archive。

用户不应被锁定在某个平台内。

---

# **5. 产品架构思想**

OpenZupu 采用三层模型：

## **5.1 Layer 1：Genealogy Core 家谱核心层**

用于表达国际通用家谱结构。

核心内容：

- 人物；
- 姓名；
- 出生；
- 死亡；
- 婚姻；
- 父母；
- 子女；
- 兄弟姐妹；
- 事件；
- 地点；
- 来源；
- 媒体。

该层负责与 GEDCOM 7 兼容。

---

## **5.2 Layer 2：Chinese Lineage Extension 中国族谱扩展层**

用于表达中国谱牒特有结构。

核心内容：

- 宗族；
- 房支；
- 堂号；
- 祠堂；
- 字辈；
- 谱名；
- 字、号、讳、谥；
- 行第；
- 嗣承；
- 出继；
- 入继；
- 兼祧；
- 承祧；
- 始祖；
- 迁徙祖；
- 支祖；
- 墓地；
- 祭祀关系；
- 修谱记录；
- 谱序与凡例。

---

## **5.3 Layer 3：Prosopography Layer 人物传记数据库层**

借鉴 CBDB 思路，用于支持中国家族史和地方社会史研究。

核心内容：

- 社会关系；
- 师生关系；
- 同学关系；
- 同僚关系；
- 雇佣关系；
- 同乡关系；
- 同机构关系；
- 职官；
- 职业；
- 学历；
- 学校；
- 公司；
- 军队；
- 农场；
- 监狱 / 劳教单位；
- 社会身份；
- 政治身份；
- 作品；
- 著述；
- 地方志记载；
- 人物群体分析；
- 社会网络分析；
- 空间分析。

该层使 OpenZupu 不只是“家谱软件”，而是“家族史知识图谱系统”。

---

# **6. 目标用户**

## **6.1 家族史研究者**

### **特征**

- 有大量口述、照片、档案、地方志、墓碑、族谱资料。
- 资料不完整，存在冲突。
- 需要不断推断、验证、修正。
- 最终可能要写家族史、非虚构作品或研究文章。

### **核心需求**

- 证据链管理；
- 冲突信息并存；
- 假设关系管理；
- 人物传记；
- 事件时间线；
- 地图迁徙；
- 图谱分析；
- Markdown / Word / PDF 导出。

---

## **6.2 修谱团队 / 宗亲会**

### **特征**

- 多人协作。
- 需要收集各房资料。
- 需要审核。
- 需要生成传统谱式。
- 需要区分公开信息和内部信息。

### **核心需求**

- 房支管理；
- 字辈管理；
- 成员信息采集；
- 审核流；
- 修订记录；
- 权限控制；
- 传统世系导出；
- PDF 出版；
- 在线族谱展示。

---

## **6.3 地方文史与数字人文研究者**

### **特征**

- 研究地方家族、婚姻网络、士绅网络、移民网络、职业群体。
- 不一定属于该宗族。
- 重视结构化数据和可计算分析。

### **核心需求**

- 数据批量导入；
- 人物规范库；
- 地名规范库；
- 来源规范库；
- 社会关系网络；
- GraphML / GEXF / Neo4j 导出；
- API；
- 时间和空间分析。

---

## **6.4 普通家庭用户**

### **特征**

- 只想记录祖辈、亲戚、照片和故事。
- 不熟悉复杂谱牒术语。
- 需要低门槛界面。

### **核心需求**

- 快速创建家庭树；
- 添加照片；
- 写人物故事；
- 分享给亲戚；
- 隐私保护；
- 简洁视图。

---

# **7. 使用场景**

## **7.1 记录一位存在多种说法的祖先**

用户录入某祖先：

- 家族口述称其 1960 年去世；
- 墓碑显示 1961 年；
- 档案线索指向 1962 年；
- 姓名有两个版本；
- 曾在上海、福建、安徽多地活动。

系统应允许：

- 同一人物存在多个姓名；
- 同一字段存在多个 Claim；
- 每个 Claim 绑定来源；
- 显示冲突；
- 用户选择当前采用版本；
- 保留其他说法。

---

## **7.2 记录出继关系**

例如：

- 某人本姓钱，原名钱维熹；
- 生父为钱家声；
- 出继姑丈曹朝选为嗣；
- 改名曹宗，字引松；
- 后代以曹姓入谱。

系统必须表达：

```text
生物学父亲：钱家声
谱牒 / 宗法父亲：曹朝选
本姓：钱
承嗣姓：曹
原名：钱维熹
谱名：曹宗
字：引松
关系类型：出继姑丈为嗣
来源：某族谱卷页
```

不能简单把曹朝选作为唯一父亲。

---

## **7.3 记录一个地方家族网络**

研究者录入某地多个家族：

- 曹氏；
- 钱氏；
- 唐氏；
- 李氏。

系统可以分析：

- 哪些家族之间频繁通婚；
- 哪些人同校；
- 哪些人同一时期在同一机构任职；
- 哪些人物出现在同一族谱、县志、通讯录中；
- 某一支从何地迁往何地。

---

## **7.4 修谱团队续修族谱**

宗亲会邀请各房成员提交资料。

流程：

1. 管理员创建宗族项目。
2. 创建房支结构。
3. 上传旧谱扫描件。
4. 贡献者录入本房信息。
5. 审核者核对来源。
6. 系统生成世系图、行传、索引。
7. 导出 PDF / Word / HTML。
8. 发布在线族谱。

---

## **7.5 族谱扫描页结构化**

用户上传旧谱页面。

系统支持：

- 上传图像；
- 手动转录；
- 标注人名；
- 标注父子关系；
- 标注配偶；
- 标注出继；
- 将文本证据转化为 Claim；
- 所有结构化结果回链到原始页面。

AI 可辅助识别，但不得自动写入正式数据，必须进入人工审核。

---

# **8. 产品范围**

## **8.1 MVP 必须包含**

MVP 应完成系统最小闭环：

1. 项目 / 家族库创建；
2. 用户与权限；
3. 人物管理；
4. 姓名管理；
5. 亲属关系管理；
6. 中国族谱字段；
7. 事件管理；
8. 地点管理；
9. 来源管理；
10. Claim / Evidence 证据链；
11. 房支管理；
12. 字辈管理；
13. 自定义字段；
14. 基础搜索；
15. 人物详情页；
16. 祖先 / 后代图；
17. 传统世系表；
18. JSON 导入导出；
19. GEDCOM 7 基础导入导出；
20. CSV 导入导出；
21. 修订历史；
22. 基础审核流；
23. 基础隐私控制。

---

## **8.2 MVP 暂不包含**

以下功能进入后续版本：

- OCR 自动识别；
- AI 自动抽取世系；
- DNA 匹配管理；
- 高级图数据库同步；
- 复杂社会网络分析；
- 手机 App；
- 微信小程序；
- 自动出版排版；
- 多家族合并；
- 公开族谱平台；
- 商业 SaaS 托管；
- 区块链存证。

---

# **9. 核心数据模型总览**

OpenZupu 的核心实体包括：

```text
Project               项目 / 家族库
Person                人物
Name                  姓名
KinshipRelation       亲属 / 宗法关系
SocialAssociation     社会关系
InstitutionRelation   机构关系
Event                 事件
Place                 地点
Source                来源
Evidence              证据
Claim                 断言
Clan                  宗族
Branch                房支
Generation            字辈
House                 堂号 / 宗祠
Institution           机构
OfficeOccupation      职官 / 职业
StatusRecord          身份状态
Document              文献
Media                 媒体
Repository            收藏机构
CustomField           自定义字段
Revision              修订记录
User                  用户
Role                  角色
Permission            权限
```

---

# **10. Project 项目模型**

## **10.1 定义**

一个 Project 是一个独立的家族数据库或研究数据库。

可以是：

- 某姓某地宗族；
- 某一家庭；
- 某一地方多个家族；
- 某一研究专题，如“盐阜地区唐氏人物数据库”。

## **10.2 字段**

|**字段**|**类型**|**说明**|
|---|---|---|
|project_id|UUID|项目 ID|
|name|string|项目名称|
|description|rich_text|项目说明|
|project_type|enum|家庭、宗族、地方家族、研究项目|
|owner_id|UUID|所有者|
|default_privacy|enum|默认隐私级别|
|data_license|string|数据许可|
|created_at|datetime|创建时间|
|updated_at|datetime|更新时间|

---

# **11. Person 人物模型**

## **11.1 基础字段**

|**字段**|**类型**|**必填**|**说明**|
|---|---|---|---|
|person_id|UUID|是|人物 ID|
|project_id|UUID|是|所属项目|
|primary_name_id|UUID|否|主姓名|
|sex|enum|否|男、女、未知、其他|
|birth_date|DateExpression|否|出生日期|
|death_date|DateExpression|否|死亡日期|
|is_living|boolean|否|是否在世|
|native_place_id|UUID|否|籍贯|
|ancestral_place_id|UUID|否|祖籍|
|residence_place_id|UUID|否|主要居住地|
|biography|rich_text|否|人物小传|
|notes|rich_text|否|备注|
|privacy_level|enum|是|隐私等级|
|confidence|number|否|整体可信度|
|created_at|datetime|是|创建时间|
|updated_at|datetime|是|更新时间|

---

## **11.2 中国族谱字段**

|**字段**|**类型**|**说明**|
|---|---|---|
|surname|string|姓|
|original_surname|string|本姓|
|adopted_surname|string|承嗣姓 / 改姓|
|given_name|string|名|
|genealogical_name|string|谱名|
|courtesy_name|string|字|
|art_name|string|号|
|taboo_name|string|讳|
|posthumous_name|string|谥号|
|childhood_name|string|乳名|
|alias_names|array|别名 / 曾用名|
|generation_character|string|字辈字|
|generation_number|integer|世代数|
|rank_in_siblings|string|行第|
|branch_id|UUID|所属房支|
|sub_branch_id|UUID|所属小支|
|house_id|UUID|堂号 / 宗祠|
|lineage_role|enum|始祖、迁徙祖、支祖、房祖、普通成员|
|adoption_status|enum|无、出继、入继、兼祧、承祧、抚养、未详|
|heir_status|enum|嗣子、承嗣、无嗣、有嗣、立嗣、未详|
|marital_order|string|原配、继配、侧室、妾、未详|
|birth_order_text|string|原谱排行文字|
|burial_place_id|UUID|墓地|
|tomb_inscription|text|墓碑文字|
|ancestral_hall_role|string|祠堂身份|
|examination_title|string|科举功名|
|official_title|string|官职|
|occupation_text|string|职业原文|
|social_status_text|string|社会身份原文|
|source_style_text|string|原文称谓|

## **11.3 DNA 基因谱系与基因数据字段**

|**字段**|**类型**|**说明**|
|---|---|---|
|patrilineal_dna|string|父系单倍群 / Y-DNA 标记 (如 O-M122)|
|matrilineal_dna|string|母系单倍群 / mtDNA 标记 (如 D4)|
|dna_sample_id|string|DNA 样本 ID / 参考编号|
|dna_markers|string|基因 STR/SNP 位点标记数据 (以逗号分隔，支持亲缘相似度对比)|

---

# **12. Name 姓名模型**

## **12.1 设计目标**

一个人物可以有多个姓名，且每个姓名都应有：

- 类型；
- 使用时间；
- 使用语境；
- 来源；
- 可信度。

## **12.2 姓名类型**

```text
PRIMARY_NAME       主姓名
BIRTH_NAME         出生名
GENEALOGICAL_NAME  谱名
COURTESY_NAME      字
ART_NAME           号
TABOO_NAME         讳
POSTHUMOUS_NAME    谥号
CHILDHOOD_NAME     乳名
ALIAS              别名
FORMER_NAME        曾用名
ADOPTED_NAME       出继 / 改姓后名
LEGAL_NAME         法律姓名
ARCHIVAL_NAME      档案名
PEN_NAME           笔名
RELIGIOUS_NAME     法名 / 道号
MISTAKEN_NAME      误写名
UNKNOWN            未知
```

## **12.3 字段**

|**字段**|**类型**|**说明**|
|---|---|---|
|name_id|UUID|姓名 ID|
|person_id|UUID|所属人物|
|name_value|string|姓名全文|
|surname|string|姓|
|given_name|string|名|
|name_type|enum|姓名类型|
|language|string|语言|
|script|string|简体、繁体、异体字|
|start_date|DateExpression|开始使用时间|
|end_date|DateExpression|停止使用时间|
|context|string|使用语境|
|source_id|UUID|来源|
|confidence|number|可信度|

---

# **13. KinshipRelation 亲属 / 宗法关系模型**

## **13.1 设计原则**

亲属关系必须从普通 `Relationship` 中独立出来，因为它是族谱系统的核心。

必须支持：

- 多父模型；
- 多母模型；
- 谱牒父子和生物学父子分离；
- 出继、入继、兼祧、承祧；
- 配偶顺序和配偶类型；
- 疑似关系；
- 关系来源；
- 关系可信度。

## **13.2 字段**

|**字段**|**类型**|**说明**|
|---|---|---|
|relation_id|UUID|关系 ID|
|project_id|UUID|项目 ID|
|from_person_id|UUID|起点人物|
|to_person_id|UUID|终点人物|
|relation_type|enum|关系类型|
|inverse_relation_type|enum|反向关系|
|start_date|DateExpression|开始时间|
|end_date|DateExpression|结束时间|
|status|enum|确认、高度可能、可能、待证、已否定|
|confidence|number|可信度|
|source_id|UUID|来源|
|claim_id|UUID|对应断言|
|notes|text|备注|
|created_by|UUID|创建者|
|created_at|datetime|创建时间|
|updated_at|datetime|更新时间|

---

## **13.3 亲属关系类型**

```text
BIOLOGICAL_FATHER_OF          生父
BIOLOGICAL_MOTHER_OF          生母
BIOLOGICAL_CHILD_OF           生物学子女

GENEALOGICAL_FATHER_OF        谱牒父
GENEALOGICAL_MOTHER_OF        谱牒母
GENEALOGICAL_CHILD_OF         谱牒子女

LEGAL_PARENT_OF               法律父母
LEGAL_CHILD_OF                法律子女

ADOPTIVE_PARENT_OF            养父母 / 过继父母
ADOPTIVE_CHILD_OF             养子女 / 过继子女

ADOPTED_OUT_TO                出继至
ADOPTED_IN_FROM               入继自

JIANTIAO_HEIR_OF              兼祧
CHENGTIAO_HEIR_OF             承祧
POSTHUMOUS_HEIR_OF            立嗣
RITUAL_DESCENDANT_OF          祭祀继承

SPOUSE_OF                     配偶
PRIMARY_WIFE_OF               原配
SECOND_WIFE_OF                继配
CONCUBINE_OF                  妾 / 侧室
WIDOW_OF                      寡居关系
DIVORCED_FROM                 离异
BETROTHED_TO                  婚约

SIBLING_OF                    兄弟姐妹
HALF_SIBLING_OF               同父异母 / 同母异父
COUSIN_OF                     堂表亲
IN_LAW_OF                     姻亲

CLANSMAN_OF                   同宗
SAME_BRANCH_AS                同房
SAME_GENERATION_AS            同辈
POSSIBLE_KIN_OF               疑似亲属
SAME_PERSON_AS                同一人
POSSIBLY_SAME_PERSON_AS       疑似同一人
```

---

# **14. SocialAssociation 社会关系模型**

## **14.1 设计目标**

借鉴 CBDB 的 social associations 思路，记录人物之间非亲属关系。

这对于家族史研究非常重要，因为很多线索来自：

- 同乡；
- 同学；
- 同僚；
- 师生；
- 雇佣；
- 同一学校；
- 同一工厂；
- 同一农场；
- 同一邮局地址；
- 同一修谱活动；
- 同一案件；
- 同一报纸报道。

## **14.2 社会关系类型**

```text
TEACHER_OF             师
STUDENT_OF             学生
CLASSMATE_OF           同学
COLLEAGUE_OF           同僚
EMPLOYER_OF            雇主
EMPLOYEE_OF            雇员
FELLOW_TOWNSMAN_OF     同乡
FRIEND_OF              朋友
CORRESPONDENT_OF       书信往来
CO_AUTHOR_OF           共同作者
CO_COMPILER_OF         共同修谱
CO_RESIDENT_OF         同住
CO_WORKER_OF           同厂 / 同单位
CO_FARM_INMATE_OF      同农场 / 同劳教单位
CASE_ASSOCIATE_OF      同案
BUSINESS_PARTNER_OF    商业伙伴
POLITICAL_ASSOCIATE_OF 政治关系
RELIGIOUS_ASSOCIATE_OF 宗教关系
MENTIONED_TOGETHER     同源共现
UNKNOWN_ASSOCIATION    关系未详
```

## **14.3 字段**

|**字段**|**类型**|**说明**|
|---|---|---|
|association_id|UUID|社会关系 ID|
|from_person_id|UUID|起点人物|
|to_person_id|UUID|终点人物|
|association_type|enum|社会关系类型|
|date|DateExpression|时间|
|place_id|UUID|地点|
|institution_id|UUID|机构|
|source_id|UUID|来源|
|claim_id|UUID|断言|
|confidence|number|可信度|
|status|enum|确认、可能、待证、已否定|
|notes|text|备注|

---

# **15. Institution 机构模型**

## **15.1 机构类型**

```text
SCHOOL              学校
COMPANY             公司
FACTORY             工厂
GOVERNMENT          政府机构
MILITARY            军队
CLAN_ORGANIZATION   宗亲组织
ANCESTRAL_HALL      宗祠
TEMPLE              庙宇
MONASTERY           寺院
FARM                农场
LABOR_CAMP          劳教 / 劳改单位
PRISON              监狱
ASSOCIATION         协会
NEWSPAPER           报社
LAW_FIRM            律师事务所
SHOP                商号
OTHER               其他
```

## **15.2 字段**

|**字段**|**类型**|**说明**|
|---|---|---|
|institution_id|UUID|机构 ID|
|name|string|名称|
|institution_type|enum|机构类型|
|place_id|UUID|地点|
|start_date|DateExpression|存在开始|
|end_date|DateExpression|存在结束|
|aliases|array|别名|
|description|rich_text|描述|
|source_id|UUID|来源|
|notes|text|备注|

---

# **16. OfficeOccupation 职官 / 职业模型**

## **16.1 设计目标**

不要把职业简单塞进 Person 字段，而应建成独立记录，因为一个人一生可以有多个身份、职官和任职经历。

## **16.2 类型**

```text
IMPERIAL_EXAM_TITLE     科举功名
OFFICIAL_POSITION       官职
MILITARY_POSITION       军职
OCCUPATION              职业
EMPLOYMENT              任职
BUSINESS_ROLE           商业身份
EDUCATIONAL_ROLE        教育身份
RELIGIOUS_ROLE          宗教身份
CLAN_ROLE               宗族职务
POLITICAL_STATUS        政治身份
LEGAL_STATUS            法律身份
```

## **16.3 字段**

|**字段**|**类型**|**说明**|
|---|---|---|
|record_id|UUID|记录 ID|
|person_id|UUID|人物|
|type|enum|类型|
|title|string|职称 / 身份|
|institution_id|UUID|机构|
|start_date|DateExpression|开始|
|end_date|DateExpression|结束|
|place_id|UUID|地点|
|source_id|UUID|来源|
|confidence|number|可信度|
|privacy_level|enum|隐私|
|notes|text|备注|

---

# **17. StatusRecord 身份状态模型**

## **17.1 设计目标**

用于记录社会身份、政治身份、阶层身份、法律身份等敏感或时代性强的信息。

例如：

- 中农；
- 富农；
- 地主；
- 商人；
- 律师；
- 历史反革命；
- 管制人员；
- 劳教人员；
- 刑释人员；
- 烈属；
- 侨眷；
- 宗教人士。

## **17.2 字段**

|**字段**|**类型**|**说明**|
|---|---|---|
|status_id|UUID|身份记录 ID|
|person_id|UUID|人物|
|status_type|enum|身份类型|
|status_value|string|身份值|
|start_date|DateExpression|开始|
|end_date|DateExpression|结束|
|source_id|UUID|来源|
|confidence|number|可信度|
|privacy_level|enum|隐私等级|
|notes|text|备注|

---

# **18. Event 事件模型**

## **18.1 事件类型**

```text
BIRTH              出生
DEATH              死亡
BURIAL             安葬
MARRIAGE           婚姻
DIVORCE            离异
ADOPTION           出继 / 入继 / 收养
NAME_CHANGE        改名
MIGRATION          迁徙
RESIDENCE          居住
EDUCATION          教育
GRADUATION         毕业
EXAMINATION        科举 / 考试
OFFICE_HOLDING     任官
EMPLOYMENT         任职
BUSINESS           经商
PROPERTY           置产 / 分家 / 败产
LAWSUIT            诉讼
MILITARY           从军
POLITICAL          政治事件
PUNISHMENT         刑罚 / 管制 / 劳教
RELIGIOUS          宗教事件
CLAN_ACTIVITY      修谱 / 建祠 / 祭祖
SCHOOL_FOUNDING    办学
MEDICAL            疾病
TRAVEL             旅行
PHOTO_TAKEN        照片拍摄
DOCUMENT_CREATED   文献形成
ORAL_HISTORY       口述采集
DNA_TEST           DNA 检测
OTHER              其他
```

## **18.2 字段**

|**字段**|**类型**|**说明**|
|---|---|---|
|event_id|UUID|事件 ID|
|project_id|UUID|项目|
|event_type|enum|事件类型|
|title|string|标题|
|date|DateExpression|日期|
|place_id|UUID|地点|
|participants|array|参与人物|
|institution_id|UUID|机构|
|description|rich_text|描述|
|source_id|UUID|来源|
|claim_id|UUID|断言|
|confidence|number|可信度|
|privacy_level|enum|隐私|
|notes|text|备注|

---

# **19. DateExpression 日期模型**

## **19.1 支持日期类型**

|**类型**|**示例**|
|---|---|
|精确日期|1928-06-01|
|年份|1928|
|年月|1928-06|
|约略|约 1900 年|
|之前|1949 年前|
|之后|1958 年后|
|区间|1950-1954|
|农历|光绪三十四年九月初三|
|年号|宣统元年|
|干支|己酉年|
|不详|生卒不详|
|多说法|1960 / 1961 / 1962|
|原文日期|民国十七年六月|

## **19.2 字段**

|**字段**|**类型**|**说明**|
|---|---|---|
|raw_text|string|原始日期文本|
|calendar|enum|公历、农历、年号、干支、未知|
|normalized_start|date|标准化开始|
|normalized_end|date|标准化结束|
|certainty|enum|精确、约略、之前、之后、区间、未知|
|display_text|string|前端展示文本|
|conversion_note|text|转换说明|

---

# **20. Place 地点模型**

## **20.1 设计目标**

中国家族史地点复杂，必须支持历史地名、行政区变迁、自然村、祠堂、墓地、机构地址和模糊地点。

## **20.2 地点类型**

```text
COUNTRY             国家
PROVINCE            省
PREFECTURE          府 / 市
COUNTY              县
TOWN                镇
VILLAGE             村
NATURAL_VILLAGE     自然村
HAMLET              聚落
ANCESTRAL_HALL      祠堂
TOMB                墓地
SCHOOL              学校
FACTORY             工厂
FARM                农场
PRISON              监狱
POST_OFFICE         邮局
ADDRESS             地址
REGION              区域
UNKNOWN             未详
```

## **20.3 字段**

|**字段**|**类型**|**说明**|
|---|---|---|
|place_id|UUID|地点 ID|
|name|string|地点名|
|full_name|string|完整地名|
|place_type|enum|地点类型|
|parent_place_id|UUID|上级地点|
|historical_name|string|历史名称|
|current_name|string|当前名称|
|aliases|array|别名|
|start_date|DateExpression|使用开始|
|end_date|DateExpression|使用结束|
|latitude|number|纬度|
|longitude|number|经度|
|uncertainty_radius|number|坐标不确定半径|
|geocode_source|string|坐标来源|
|source_id|UUID|来源|
|notes|text|备注|

---

# **21. Source 来源模型**

## **21.1 来源类型**

```text
GENEALOGY_BOOK        族谱 / 宗谱
LOCAL_GAZETTEER       地方志
ARCHIVE               档案
TOMBSTONE             墓碑
ORAL_HISTORY          口述
PHOTO                 照片
LETTER                信件
DIARY                 日记
NEWSPAPER             报纸
DIRECTORY             通讯录
SCHOOL_RECORD         学校记录
EMPLOYMENT_RECORD     工作记录
LEGAL_DOCUMENT        法律文书
HOUSEHOLD_REGISTER    户籍材料
DNA                   DNA 匹配
WEBSITE               网站
BOOK                  书籍
ARTICLE               论文 / 文章
DATABASE              数据库
BUSINESS_RECORD       工商资料
OTHER                 其他
```

## **21.2 字段**

|**字段**|**类型**|**说明**|
|---|---|---|
|source_id|UUID|来源 ID|
|project_id|UUID|项目|
|source_type|enum|来源类型|
|title|string|标题|
|author|string|作者|
|compiler|string|编修者|
|year|string|年份|
|dynasty|string|朝代|
|volume|string|卷|
|page|string|页码|
|repository_id|UUID|收藏机构|
|url|string|链接|
|citation|string|引文格式|
|reliability|enum|高、中、低、未知|
|media_ids|array|扫描件 / 照片|
|transcription|text|转录文本|
|translation|text|翻译|
|notes|text|备注|

---

# **22. Evidence 证据模型**

## **22.1 设计目标**

Evidence 是从 Source 中抽取出的具体证据片段。

一个 Source 可以支持多个 Evidence；一个 Evidence 可以支持多个 Claim。

例如：

- 一页族谱是 Source；
- 其中一句“维熹出继姑丈曹朝选为嗣”是 Evidence；
- 它支持“钱维熹出继曹朝选”“钱维熹改名曹宗”“曹朝选为谱牒父亲”等多个 Claim。

## **22.2 字段**

|**字段**|**类型**|**说明**|
|---|---|---|
|evidence_id|UUID|证据 ID|
|source_id|UUID|来源|
|location_in_source|string|卷、页、栏、行|
|original_text|text|原文|
|transcription|text|转录|
|translation|text|翻译|
|interpretation|text|解释|
|media_region|JSON|图像区域坐标|
|confidence|number|可信度|
|created_by|UUID|创建者|
|created_at|datetime|创建时间|

---

# **23. Claim 断言模型**

## **23.1 设计目标**

Claim 是系统的事实最小单元。

系统不应直接把所有信息写成最终事实，而应记录：

```text
某来源 / 某证据声称了什么
用户如何解释该证据
当前是否采纳该断言
```

## **23.2 Claim 状态**

```text
ACCEPTED       已采纳
ALTERNATIVE    备选
CONFLICTING    冲突
HYPOTHESIS     假设
INFERRED       推断
REJECTED       已否定
UNREVIEWED     未审核
```

## **23.3 字段**

|**字段**|**类型**|**说明**|
|---|---|---|
|claim_id|UUID|断言 ID|
|subject_type|enum|Person、Relation、Event、Place 等|
|subject_id|UUID|断言对象|
|predicate|string|断言属性|
|object_value|any|断言内容|
|evidence_id|UUID|证据|
|source_id|UUID|来源|
|quote|text|原文引用|
|interpretation|text|解释|
|confidence|number|可信度|
|status|enum|状态|
|privacy_level|enum|隐私|
|created_by|UUID|创建者|
|reviewed_by|UUID|审核者|
|created_at|datetime|创建时间|
|updated_at|datetime|更新时间|

---

# **24. Clan 宗族模型**

|**字段**|**类型**|**说明**|
|---|---|---|
|clan_id|UUID|宗族 ID|
|project_id|UUID|项目|
|surname|string|姓|
|name|string|宗族名称|
|hall_name|string|堂号|
|origin_place_id|UUID|发源地|
|founding_ancestor_id|UUID|始祖|
|migration_ancestor_id|UUID|迁徙祖|
|description|rich_text|描述|
|source_id|UUID|来源|
|notes|text|备注|

---

# **25. Branch 房支模型**

## **25.1 字段**

|**字段**|**类型**|**说明**|
|---|---|---|
|branch_id|UUID|房支 ID|
|clan_id|UUID|所属宗族|
|parent_branch_id|UUID|上级房支|
|name|string|房支名称|
|alias|array|别名|
|founder_person_id|UUID|支祖|
|migration_ancestor_id|UUID|迁徙祖|
|generation_start|integer|起始世代|
|place_id|UUID|主要地点|
|ancestral_hall_id|UUID|宗祠|
|description|rich_text|描述|
|source_id|UUID|来源|
|status|enum|确认、待证、传说|
|notes|text|备注|

---

# **26. Generation 字辈模型**

## **26.1 字段**

|**字段**|**类型**|**说明**|
|---|---|---|
|generation_id|UUID|字辈 ID|
|clan_id|UUID|宗族|
|branch_id|UUID|房支|
|sequence_number|integer|顺序|
|character|string|字辈字|
|poem_line|string|字辈诗句|
|generation_number|integer|对应世代|
|source_id|UUID|来源|
|notes|text|备注|

## **26.2 功能要求**

系统应支持：

- 多套字辈；
- 不同房支不同字辈；
- 字辈断裂；
- 字辈重启；
- 字辈字不在姓名中；
- 自动识别姓名中的字辈字；
- 用户手动覆盖。

---

# **27. CustomField 自定义字段系统**

## **27.1 设计目标**

中国不同地区、不同宗族、不同研究项目差异极大。核心字段不可能覆盖所有情况，因此必须支持自定义字段。

## **27.2 适用实体**

自定义字段可添加到：

- Person；
- Name；
- KinshipRelation；
- SocialAssociation；
- Event；
- Place；
- Source；
- Evidence；
- Claim；
- Clan；
- Branch；
- Institution；
- OfficeOccupation；
- StatusRecord；
- Document；
- Media。

## **27.3 字段类型**

```text
Text          单行文本
LongText      多行文本
RichText      富文本
Number        数字
Boolean       布尔值
Date          标准日期
DateExpr      模糊日期
Enum          单选
MultiEnum     多选
PersonRef     人物引用
PlaceRef      地点引用
SourceRef     来源引用
File          文件
URL           链接
JSON          JSON
GeoPoint      坐标
```

## **27.4 字段属性**

|**字段**|**类型**|**说明**|
|---|---|---|
|field_id|UUID|字段 ID|
|entity_type|enum|适用实体|
|field_key|string|字段键名|
|label|string|显示名称|
|field_type|enum|字段类型|
|options|array|选项|
|required|boolean|是否必填|
|default_value|any|默认值|
|privacy_level|enum|隐私|
|display_order|integer|显示顺序|
|import_mapping|JSON|导入映射|
|export_mapping|JSON|导出映射|
|description|text|字段说明|

---

# **28. GEDCOM 7 兼容设计**

## **28.1 原则**

OpenZupu 支持 GEDCOM 7，但不以 GEDCOM 7 作为主模型。

导出策略：

```text
family.ged                  标准 GEDCOM 7
openzupu.sidecar.json        OpenZupu 完整语义
media/                       媒体文件
sources/                     来源文件
README.md                    数据说明
schema.json                  数据字典
```

## **28.2 映射表**

|**OpenZupu**|**GEDCOM**|
|---|---|
|Person|INDI|
|Name|NAME|
|Birth Event|BIRT|
|Death Event|DEAT|
|Burial Event|BURI|
|Marriage|MARR|
|Source|SOUR|
|Media|OBJE|
|Place|PLAC|
|Note|NOTE|
|Family|FAM|
|Branch|_BRANCH|
|Generation Character|_GEN_CHAR|
|Courtesy Name|_ZI|
|Art Name|_HAO|
|Genealogical Name|_PU_NAME|
|Original Surname|_ORIG_SURN|
|Adopted Surname|_ADOPT_SURN|
|Adopted Out|_ADOPT_OUT|
|Adopted In|_ADOPT_IN|
|Jiti / Chengti|_HEIR_TYPE|
|Clan Hall|_HALL|
|Lineage Role|_LINEAGE_ROLE|
|Claim|_CLAIM|
|Evidence|_EVID|

## **28.3 GEDCOM 扩展示例**

```gedcom
0 @I123@ INDI
1 NAME 曹宗 /曹/
2 GIVN 宗
2 SURN 曹
1 _ORIG_NAME 钱维熹
1 _ZI 引松
1 _GEN_CHAR 维
1 _BRANCH 姜堰西桥南曹氏
1 _HALL 文昌堂
1 _ADOPT_TYPE 出继姑丈为嗣
1 _BIO_FATHER @I045@
1 _GENEALOGICAL_FATHER @I078@
1 NOTE 原名钱维熹，出继姑丈曹朝选为嗣，改名曹宗，字引松。
```

## **28.4 验收标准**

- 标准 GEDCOM 文件可导入。
- OpenZupu 导出的 GEDCOM 可被主流软件识别基础人物和家庭关系。
- OpenZupu 再导入自己导出的数据时，不丢失中国族谱扩展语义。
- 导入前必须提供预览和冲突提示。

---

# **29. 图数据库与网络分析**

## **29.1 图模型**

节点类型：

```text
Person
Name
Clan
Branch
Place
Event
Source
Evidence
Claim
Institution
OfficeOccupation
StatusRecord
Document
Media
```

边类型：

```text
KINSHIP
ASSOCIATION
PARTICIPATED_IN
LOCATED_AT
SUPPORTED_BY
MENTIONED_IN
BELONGS_TO_BRANCH
BELONGS_TO_CLAN
HAS_NAME
HAS_STATUS
HELD_OFFICE
AFFILIATED_WITH
```

## **29.2 内置图查询**

系统应支持：

- 查询某人的祖先；
- 查询某人的后代；
- 查询两人的最近共同祖先；
- 查询两人的关系路径；
- 查询某房所有成员；
- 查询所有出继关系；
- 查询所有兼祧关系；
- 查询某地迁徙人物；
- 查询某一时期同校人物；
- 查询某一机构相关人物；
- 查询某一来源支持的所有人物和关系；
- 查询缺少来源的人物；
- 查询存在冲突 Claim 的人物；
- 查询某地区家族间姻亲网络；
- 查询某时期职业结构。

## **29.3 导出格式**

```text
GraphML
GEXF
Pajek .net
Neo4j Cypher
Node CSV
Edge CSV
JSON Graph
RDF / JSON-LD
```

---

# **30. 核心功能需求**

## **30.1 人物管理**

### **功能**

- 创建人物；
- 编辑人物；
- 删除人物；
- 合并人物；
- 标记疑似同一人；
- 添加多个姓名；
- 添加生卒；
- 添加籍贯、祖籍、居住地；
- 添加房支、字辈、行第；
- 添加人物小传；
- 添加事件；
- 添加来源；
- 设置隐私；
- 查看修订历史。

### **验收标准**

- 普通人物 3 分钟内可完成基础录入。
- 一个人物可拥有多个姓名和多个来源。
- 合并人物时保留所有来源、Claim、事件和关系。
- 删除人物前提示关系影响。

---

## **30.2 亲属关系管理**

### **功能**

- 添加父母；
- 添加配偶；
- 添加子女；
- 添加兄弟姐妹；
- 添加出继、入继、兼祧、承祧；
- 添加疑似亲属；
- 添加同一人；
- 设置关系来源；
- 设置可信度；
- 设置状态。

### **验收标准**

- 允许同一人物同时存在生父、嗣父、养父。
- 允许多个配偶并区分原配、继配、妾。
- 允许待证关系。
- 允许关系被否定但保留记录。
- 不强制所有关系归入西方核心家庭模型。

---

## **30.3 社会关系管理**

### **功能**

- 添加同学、同僚、师生、同乡、雇佣等关系。
- 绑定机构、时间、地点、来源。
- 支持关系网络展示。
- 支持社会关系与亲属关系分层显示。

### **验收标准**

- 社会关系不污染亲属树。
- 可单独导出社会关系网络。
- 可按来源反查社会关系。

---

## **30.4 事件管理**

### **功能**

- 创建事件；
- 选择事件类型；
- 绑定人物；
- 绑定地点；
- 绑定机构；
- 设置模糊日期；
- 添加来源；
- 添加媒体；
- 显示在人物时间线和地图中。

### **验收标准**

- 一个事件可关联多人。
- 支持农历、年号、约略、区间日期。
- 事件可绑定多个 Claim。
- 可按时间、地点、人物筛选事件。

---

## **30.5 来源与证据管理**

### **功能**

- 创建来源；
- 上传扫描件、照片、PDF；
- 录入转录文本；
- 标记页码、卷号、栏位；
- 从来源中创建 Evidence；
- 从 Evidence 中创建 Claim；
- 显示引用格式；
- 来源反向关联人物、关系、事件。

### **验收标准**

- 一个族谱页面可支持多条 Evidence。
- 一条 Evidence 可支持多条 Claim。
- 无来源信息必须被标注为 unsourced。
- 冲突 Claim 不得互相覆盖。

---

## **30.6 房支管理**

### **功能**

- 创建宗族；
- 创建房支；
- 设置上级房支；
- 设置支祖；
- 设置迁徙祖；
- 绑定地点；
- 绑定祠堂；
- 查看房支树；
- 按房支筛选人物；
- 按房支导出谱牒。

### **验收标准**

- 支持多级房支。
- 支持房支待证状态。
- 支持支系合并与拆分。
- 支持一个宗族下多个祠堂或堂号。

---

## **30.7 字辈管理**

### **功能**

- 创建字辈表；
- 设置字辈顺序；
- 绑定宗族或房支；
- 自动检测姓名中的字辈字；
- 标记字辈冲突；
- 手动覆盖自动识别。

### **验收标准**

- 系统能显示人物世代数。
- 系统能提示字辈与世代不符。
- 不强制所有人使用字辈。

---

## **30.8 自定义字段管理**

### **功能**

- 创建字段；
- 设置字段类型；
- 设置实体范围；
- 设置是否必填；
- 设置隐私；
- 设置导入导出映射；
- 设置显示位置；
- 字段废弃但保留历史数据。

### **验收标准**

- 不改代码即可新增字段。
- 自定义字段可被搜索和筛选。
- 删除字段前提示数据影响。
- 字段变更进入审计日志。

---

## **30.9 图谱视图**

### **视图类型**

- 祖先图；
- 后代图；
- 亲属网络图；
- 房支图；
- 出继网络图；
- 姻亲网络图；
- 社会关系图；
- 来源证据图；
- 迁徙图；
- 疑似同一人图。

### **交互**

- 缩放；
- 拖拽；
- 折叠；
- 展开；
- 限制代数；
- 按关系类型筛选；
- 按可信度筛选；
- 按时间筛选；
- 按房支筛选；
- 点击节点查看详情；
- 导出 SVG / PNG。

### **验收标准**

- 500 人以内图谱可流畅浏览。
- 默认不展开全族谱，避免性能问题。
- 待证关系、出继关系、继配关系应视觉区分。

---

## **30.10 传统族谱视图**

### **视图类型**

- 世系表；
- 吊线图；
- 欧式图；
- 行传；
- 房支分卷；
- 字辈表；
- 墓地表；
- 迁徙表；
- 配偶附载；
- 人物索引。

### **验收标准**

- 可按房支生成传统谱式。
- 可按世代排序。
- 可导出 Markdown / HTML / PDF。
- 可配置是否显示女性、配偶、庶出、出继等信息。

---

## **30.11 人物详情页**

### **模块**

- 基本信息；
- 姓名列表；
- 生卒；
- 房支；
- 字辈；
- 父母；
- 配偶；
- 子女；
- 兄弟姐妹；
- 亲属关系；
- 社会关系；
- 身份 / 职业；
- 事件时间线；
- 地点地图；
- 来源证据；
- 冲突信息；
- 媒体；
- 修订历史。

### **验收标准**

- 所有模块可配置显示 / 隐藏。
- 在世人物默认隐藏敏感信息。
- 缺少来源的信息明确标注。
- 冲突信息进入争议区。

---

## **30.12 地图视图**

### **功能**

- 地点管理；
- 坐标标注；
- 历史地名；
- 迁徙路线；
- 按人物筛选；
- 按房支筛选；
- 按时间播放；
- 导出地图。

### **验收标准**

- 地点可无坐标，仅文本显示。
- 历史名称和当前名称并存。
- 迁徙事件可连接起点和终点。

---

## **30.13 搜索**

### **搜索范围**

- 人物；
- 姓名；
- 地点；
- 房支；
- 宗族；
- 来源；
- 事件；
- 机构；
- 文献；
- 备注全文。

### **能力**

- 精确搜索；
- 模糊搜索；
- 繁简转换；
- 异体字搜索；
- 曾用名搜索；
- 地名别名搜索；
- 按房支筛选；
- 按世代筛选；
- 按来源筛选；
- 按可信度筛选。

### **验收标准**

- 搜索曾用名可找到人物。
- 搜索历史地名可找到当前地名关联记录。
- 搜索繁体可匹配简体。

---

# **31. 协作、权限与审核**

## **31.1 用户角色**

```text
Owner          所有者
Admin          管理员
Editor         编辑者
Reviewer       审核者
Contributor    贡献者
Viewer         查看者
Public         公开访客
```

## **31.2 权限类型**

- 查看；
- 新增；
- 编辑；
- 删除；
- 审核；
- 导出；
- 管理用户；
- 管理字段；
- 管理隐私；
- 发布。

## **31.3 隐私级别**

```text
Public          公开
FamilyOnly      家族成员可见
EditorsOnly     编辑者可见
AdminsOnly      管理员可见
Private         仅本人可见
Sensitive       敏感，默认隐藏
```

## **31.4 审核状态**

```text
Draft          草稿
Submitted      已提交
Reviewed       已审核
Accepted       已采纳
Rejected       已驳回
Disputed       有争议
Deprecated     已废弃
```

## **31.5 验收标准**

- 在世人物默认不公开。
- 敏感事件默认不公开。
- 贡献者提交的信息不直接覆盖正式数据。
- 审核者可接受、驳回或标记争议。
- 所有修改有修订历史。

---

# **32. 数据导入导出**

## **32.1 导入格式**

```text
GEDCOM 7
OpenZupu JSON
CSV
Excel
Gramps XML
webtrees GEDCOM
Source Image / PDF
```

## **32.2 导出格式**

```text
GEDCOM 7
OpenZupu JSON
CSV
Excel
Markdown
HTML
PDF
GraphML
GEXF
Pajek .net
Neo4j Cypher
RDF / JSON-LD
SQLite Archive
```

## **32.3 验收标准**

- 用户可一键导出完整项目。
- 导出包包含媒体、来源、数据字典。
- 导出时可排除隐私字段。
- 导入前提供预览、冲突检测和回滚机制。

---

# **33. 技术架构建议**

## **33.1 推荐 MVP 技术栈**

### **后端**

```text
Language: TypeScript 或 Python
Framework: NestJS 或 FastAPI
Database: PostgreSQL
Search: Meilisearch 或 OpenSearch
Cache: Redis
File Storage: Local / S3-compatible
Queue: BullMQ / Celery
```

### **前端**

```text
Framework: React / Next.js
UI: Tailwind CSS / shadcn/ui
Graph: Cytoscape.js / D3.js / Sigma.js
Map: MapLibre / Leaflet
Editor: TipTap / ProseMirror
```

### **图数据库**

MVP 可不强制部署 Neo4j，但预留同步层。

```text
Primary DB: PostgreSQL
Graph Sync: optional Neo4j
Export: GraphML / GEXF / Neo4j Cypher
```

## **33.2 推荐架构**

```text
PostgreSQL + JSONB + Search Index + Optional Neo4j
```

理由：

- PostgreSQL 适合事务、权限、审计、结构化数据。
- JSONB 适合自定义字段。
- Search Index 适合全文检索、繁简检索、模糊搜索。
- Neo4j 适合高级关系查询，但不应成为 MVP 部署门槛。

---

# **34. API 设计**

## **34.1 API 风格**

MVP 使用 REST API，后续可增加 GraphQL。

## **34.2 核心接口**

```text
GET    /api/projects
POST   /api/projects

GET    /api/people
POST   /api/people
GET    /api/people/:id
PATCH  /api/people/:id
DELETE /api/people/:id

GET    /api/names
POST   /api/names

GET    /api/kinship-relations
POST   /api/kinship-relations

GET    /api/social-associations
POST   /api/social-associations

GET    /api/events
POST   /api/events

GET    /api/places
POST   /api/places

GET    /api/sources
POST   /api/sources

GET    /api/evidence
POST   /api/evidence

GET    /api/claims
POST   /api/claims

GET    /api/clans
POST   /api/clans

GET    /api/branches
POST   /api/branches

GET    /api/generations
POST   /api/generations

POST   /api/import/gedcom
POST   /api/export/gedcom
POST   /api/export/json
POST   /api/export/graph
```

---

# **35. AI 辅助功能规划**

## **35.1 原则**

AI 只能辅助，不得直接覆盖正式数据。

所有 AI 生成内容必须标记：

```text
generated_by_ai = true
requires_review = true
```

## **35.2 后续功能**

- 族谱 OCR；
- 繁体竖排识别；
- 人名抽取；
- 关系抽取；
- 地名标准化；
- 年号转公历；
- 人物重复检测；
- 疑似亲属推荐；
- 自动生成小传；
- 来源摘要；
- Claim 冲突检测；
- 族谱页结构化录入；
- 迁徙路线推断。

---

# **36. 数据安全与隐私**

## **36.1 关键原则**

- 自托管优先；
- 在世人物默认保护；
- 敏感字段默认隐藏；
- 导出前隐私检查；
- 权限和审计日志；
- 可完整备份；
- 可完整迁移。

## **36.2 敏感信息**

包括但不限于：

- 身份证号；
- 电话；
- 详细住址；
- 疾病；
- DNA；
- 收养；
- 非婚生；
- 政治身份；
- 刑罚；
- 劳教；
- 家族争议；
- 在世人物关系。

---

# **37. 开源策略**

## **37.1 License 建议**

推荐使用：

```text
AGPL-3.0
```

原因：

- 防止商业机构直接闭源 SaaS 化；
- 保证网络服务修改也需开源；
- 更适合数据基础设施类开源项目。

如果希望更宽松，可选：

```text
Apache-2.0
```

但对社区贡献回流保护较弱。

## **37.2 仓库结构**

```text
openzupu/
  apps/
    web/
    api/
  packages/
    schema/
    gedcom/
    graph/
    importer/
    exporter/
    ui/
    search/
  docs/
    prd/
    schema/
    api/
    deployment/
    examples/
  examples/
    demo-family/
    chinese-lineage-sample/
    cbdb-inspired-sample/
  docker/
  scripts/
```

---

# **38. 插件系统**

## **38.1 插件类型**

- 字段插件；
- 导入插件；
- 导出插件；
- 视图插件；
- OCR 插件；
- AI 抽取插件；
- 地图插件；
- GEDCOM 扩展插件；
- Zotero 插件；
- Neo4j 同步插件；
- 地方志数据库插件；
- DNA 数据插件。

## **38.2 示例插件**

```text
openzupu-plugin-gedcom7
openzupu-plugin-neo4j-sync
openzupu-plugin-zotero
openzupu-plugin-chinese-lunar-date
openzupu-plugin-vertical-ocr
openzupu-plugin-gephi-export
openzupu-plugin-cbdb-mapping
```

---

# **39. MVP 里程碑**

## **Phase 0：产品设计与数据模型**

周期：2-4 周

交付：

- 数据模型 v0.1；
- GEDCOM 映射草案；
- API 草案；
- UI 原型；
- 示例数据；
- 开源仓库初始化；
- 技术选型确认。

---

## **Phase 1：核心数据录入**

周期：6-8 周

交付：

- 项目管理；
- 用户系统；
- 人物管理；
- 姓名管理；
- 亲属关系；
- 事件；
- 地点；
- 来源；
- Evidence；
- Claim；
- 自定义字段基础版。

---

## **Phase 2：族谱语义层**

周期：6-8 周

交付：

- 宗族；
- 房支；
- 字辈；
- 堂号 / 宗祠；
- 出继 / 入继 / 兼祧；
- 传统世系表；
- 人物详情页；
- 基础搜索。

---

## **Phase 3：展示与导出**

周期：4-6 周

交付：

- 祖先图；
- 后代图；
- 房支图；
- 人物时间线；
- 地图视图；
- JSON 导出；
- CSV 导入导出；
- GEDCOM 7 基础导入导出。

---

## **Phase 4：协作与审核**

周期：4-6 周

交付：

- 审核流；
- 修订历史；
- 权限系统；
- 隐私控制；
- 冲突 Claim 管理；
- 争议信息展示。

---

## **Phase 5：图谱与研究增强**

周期：6-8 周

交付：

- 社会关系；
- 机构；
- 职业 / 职官；
- 身份状态；
- 图谱导出；
- Neo4j 同步；
- 最近共同祖先；
- 关系路径查询；
- 姻亲网络；
- 社会网络分析。

---

# **40. MVP 成功指标**

## **40.1 功能指标**

- 支持 10,000 人以内家族数据；
- 支持 50,000 条亲属关系；
- 支持 50,000 条社会关系；
- 支持 100,000 条 Claim；
- 支持 10GB 媒体文件；
- 支持至少 30 个中国族谱字段；
- 支持至少 30 种亲属 / 宗法关系；
- 支持 GEDCOM 7 基础导入导出；
- 支持完整 JSON 导出；
- 支持 GraphML / GEXF 导出。

## **40.2 性能指标**

- 500 人以内图谱 3 秒内加载；
- 5000 人搜索 1 秒内响应；
- 普通人物录入 3 分钟内完成；
- 带来源关系录入 2 分钟内完成；
- 10,000 人项目可正常浏览和导出。

## **40.3 开源指标**

- 首年 GitHub Star：1000+；
- 首年外部贡献者：20+；
- 首年插件：5+；
- 示例数据集：3 个；
- 核心文档覆盖率：90%+。

---

# **41. 竞品与参照对象**

## **41.1 Gramps**

优点：

- 开源成熟；
- 个人家谱管理强；
- 支持人物、事件、地点、来源。

不足：

- 中国族谱语义弱；
- 房支、字辈、出继等支持不足；
- 研究型图谱能力有限。

## **41.2 webtrees**

优点：

- 在线家谱展示成熟；
- GEDCOM 生态较好；
- 自托管。

不足：

- 偏西方家谱模型；
- 中国宗族语义不足；
- 证据链和研究能力有限。

## **41.3 华人族谱平台**

优点：

- 中文界面；
- 熟悉修谱流程；
- 适合普通宗亲会。

不足：

- 数据格式封闭；
- 开源性不足；
- 数据主权风险；
- 难以做严肃研究和图谱分析。

## **41.4 CBDB**

优点：

- 中国历史人物数据库范式成熟；
- 支持人物、亲属、社会关系、职官、地点、来源；
- 适合群体传记学、社会网络分析和空间分析。

不足：

- 不是族谱软件；
- 不服务普通家庭修谱；
- 不处理 GEDCOM；
- 不强调传统谱牒出版。

## **41.5 OpenZupu 差异化**

|**维度**|**OpenZupu**|
|---|---|
|开源|是|
|自托管|是|
|中国族谱字段|原生支持|
|GEDCOM 7|支持|
|CBDB 式传记数据库|支持|
|亲属 / 宗法关系|原生支持|
|社会关系|原生支持|
|证据链|原生支持|
|Claim 冲突管理|原生支持|
|图数据库|支持|
|传统谱式导出|支持|
|自定义字段|支持|
|数据主权|完整导出|

---

# **42. 风险与对策**

## **42.1 数据模型过复杂**

风险：

- 普通用户难以上手；
- 开发成本高。

对策：

- 基础模式 + 专家模式；
- 普通用户只看到基础字段；
- 高级族谱字段按需开启；
- 提供模板。

---

## **42.2 GEDCOM 兼容损失**

风险：

- 中国扩展字段在其他软件中丢失。

对策：

- 标准 GEDCOM + JSON Sidecar；
- 明确扩展标签文档；
- 提供导入验证工具；
- 提供 OpenZupu 完整恢复导入。

---

## **42.3 图谱性能问题**

风险：

- 大型族谱图谱过大，无法浏览。

对策：

- 默认限制代数；
- 按需加载；
- 图谱分页；
- 服务端预计算；
- 可选 Neo4j 同步。

---

## **42.4 隐私风险**

风险：

- 在世人物、敏感身份、DNA、政治经历泄露。

对策：

- 在世人物默认不公开；
- 敏感字段默认隐藏；
- 导出前隐私检查；
- 字段级权限；
- 审计日志。

---

## **42.5 中国谱牒差异过大**

风险：

- 各地术语、习惯、谱式不同。

对策：

- 核心字段标准化；
- 术语表支持别名；
- 自定义字段；
- 地区模板；
- 插件机制。

---

# **43. 未来版本路线**

## **v0.1**

- 单用户本地版；
- 人物；
- 姓名；
- 亲属关系；
- 事件；
- 地点；
- 来源；
- JSON 导出；
- 基础图谱。

## **v0.2**

- 多用户；
- 权限；
- 自定义字段；
- 房支；
- 字辈；
- Claim / Evidence；
- GEDCOM 7。

## **v0.3**

- 审核流；
- 修订历史；
- 传统族谱视图；
- 地图；
- 搜索增强。

## **v0.4**

- 社会关系；
- 机构；
- 职业 / 职官；
- 身份状态；
- 图谱导出；
- Neo4j 同步。

## **v0.5**

- OCR；
- AI 辅助抽取；
- 人物重复检测；
- 地名标准化；
- 冲突检测。

## **v1.0**

- 稳定 API；
- 插件系统；
- 完整文档；
- 生产可用；
- 长期数据格式承诺；
- 示例数据集和社区生态。

---

# **44. 结论**

OpenZupu 的核心价值不是“做一个中文家谱软件”，而是建立一套面向中国家族史和族谱研究的开放数据基础设施。

它要解决的问题包括：

- 纸谱版式对电子族谱的限制；
- GEDCOM 对中国谱牒语义表达不足；
- 华人族谱平台数据封闭；
- 家族史证据链难以管理；
- 出继、兼祧、房支、字辈、堂号等关系难以结构化；
- 家族史研究无法充分利用图数据库、社会网络分析和空间分析；
- 家族资料难以长期保存和自由迁移。

最终，OpenZupu 应成为：

```text
中国族谱的开源数据模型
中国家族史研究的知识图谱工具
家族修谱团队的协作系统
普通家庭的长期家谱保存方案
传统谱牒与现代数字人文之间的桥梁
```

---

# **45. AI 调用与 MCP 服务 (Model Context Protocol)**

## **45.1 设计目标**

为了让本地部署的 AI 工具（如 Cursor、Claude Desktop、Claude Code 等 Agent）能够无缝读取、理解、修改和分析 OpenZupu 中的族谱数据，系统原生提供符合 Model Context Protocol (MCP) 规范的 Stdio/HTTP 服务。

AI 可以通过 MCP 客户端自动加载 OpenZupu 作为一个“技能包”，实现以下场景：
- **语义理解**：由 AI 直接读取世系、行传、字辈和迁徙事件，梳理家族网络。
- **自动录入与纠错**：AI 辅助进行人员录入、关系关联、以及重名/逻辑冲突排查。
- **数据分析与可视化**：AI 调用图数据查询，提炼社会网络特征，生成统计结论。

## **45.2 暴露的 MCP 核心工具**

|**工具名称**|**输入参数**|**功能描述**|
|---|---|---|
|`list_projects`|无|列出当前实例中所有的族谱项目（谱书）|
|`search_persons`|`projectId` (UUID), `query` (string)|在特定项目中模糊搜索族人姓名|
|`get_person_details`|`personId` (UUID)|获取特定族人的详细传记、事件、字辈、常住地及直系亲属关系|
|`create_person`|`projectId` (UUID), `surname`, `givenName`, `sex`, `birthDate`, `deathDate`, `biography`等|在指定项目中录入一位新成员|
|`add_kinship_relation`|`projectId`, `fromPersonId`, `toPersonId`, `relationType`等|在两个已存在的族人之间建立血缘或婚姻纽带|
|`find_duplicates`|`projectId`|检测项目中名字、时间相近的疑似重名/重复族人记录|
|`export_graphml`|`projectId`|将指定项目的全套谱系网络导出为 GraphML 字符串以供分析|

---

# **46. 去中心化族谱关联与联邦查询系统 (Cross-DB Federation)**

## **46.1 设计目标**

为了打破传统家谱数据库的“信息孤岛”，建立一个非中心化的、更大规模的全国/全球性数字人名和关系网络（参考哈佛 CBDB 范式，但面向普罗大众），系统提供去中心化的**联邦查询与交叉印证（Federation）协议**。

不同姓氏、不同地域的 OpenZupu 本地数据库可以互相注册为“联邦节点（Peer Peers）”，通过安全比对接口，交叉查找并关联跨谱的姻亲和移居支脉：
- **姻亲印证**：例如张家谱中记载“张三娶曹氏（生于1890年，宣城人）”，曹家谱中记载“曹氏（生于1890年，嫁张三）”，通过联邦接口对齐，两个独立的数据库即可跨网络“握手”。
- **分支迁徙比对**：寻找失联的移居支脉（如某支于明成化年间迁往四川）。

## **46.2 联邦协议架构**

```text
  [ 本地 OpenZupu 实例 ] <=======( HTTP P2P 请求 )=======> [ 远端 Peer OpenZupu 实例 ]
          ||                                                     ||
  (Prisma SQLite 数据库)                                  (Prisma SQLite 数据库)
```

### **1. 远端节点管理 (FederationPeer)**
系统在本地保存合作节点的网络地址白名单，管理员可在后台手动添加 peer 链接。

### **2. 跨节点联邦匹配检索 (API: /api/federation/search)**
- 对外开放的检索服务。接收字段：`surname`（姓）, `givenName`（名）, `sex`（性别）, `birthYear`（约略出生年份）, `generationCharacter`（字辈字）, `ancestralPlace`（祖籍地）。
- 返回最符合的候选人列表，并附带 **匹配相似度评分（Match Confidence Score）**。
- **隐私核验**：此接口**绝对禁止**返回在世人物（`isLiving: true`）的详细档案，仅对已故历史人物开放匹配。

### **3. 跨库关联 (Federated Link)**
- 当管理员通过“跨库匹配”找到印证对象后，可在本地族人卡片上绑定 `federatedId`（外网全局 URI，如 `openzupu://clan-association.org/people/uuid`）和 `externalLink`（对应网页链接）。
- 系统将利用这些 federated 关联边，生成跨数据库的虚拟大宗谱网络。