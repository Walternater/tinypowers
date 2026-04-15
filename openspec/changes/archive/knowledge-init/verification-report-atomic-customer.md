# /knowledge:init 第二轮验证报告：atomic-customer

**验证时间**: 2026-04-14  
**验证项目**: atomic-customer  
**验证方法**: 应用增强后的扫描规则和模板，生成知识库初稿并与现有 README 对比

---

## 1. 行数对比

| 文件 | 生成初稿 | 现有文档 | 说明 |
|------|----------|----------|------|
| README.md | 71 行 | 477 行 | 现有 README 较丰富 |
| AI-KNOWLEDGE.md | 118 行 | 无 | 新增 |
| docs/business-domain.md | 125 行 | 无 | 新增 |
| docs/infrastructure.md | 59 行 | 无 | 新增 |
| docs/operations.md | 70 行 | 无 | 新增 |
| **总计** | **443 行** | **477 行** (仅 README) | — |

---

## 2. 增强规则验证结果

### 2.1 模块边界规则 ✅ 有效

**发现**: `atomic-customer-external/` 是一个与 `atomic-customer-provider/` 平级的独立模块，包含：
- 自己的 `business/`, `controller/`, `kafka/`, `repository/` 结构
- 独立的 Kafka 消费者 `FactZnkfPushDataMsgConsumer`

**处理**: 生成内容中正确识别并纳入了 external 模块：
- `AI-KNOWLEDGE.md` 中增加了"独立模块"一节
- `business-domain.md` 的模块结构中包含了 external
- 增加了 `MANUAL` 标注提醒用户补充 external 模块的职责说明

**结论**: 模块边界规则有效解决了 atomic-task 中 `bargain` 被遗漏的问题。

### 2.2 动态配置规则 ⚠️ 部分有效

**扫描结果**:
- 未发现类似 `TaskConfig` 或 `docs/data/*.json` 的动态配置中心文件
- 但发现了 `atomic-customer-provider` 依赖了 `atomic-task-sdk`（任务系统）
- `CustomerStateEnum` 只有 4 个硬编码状态，没有"配置型"vs"硬编码型"的复杂性

**结论**: 此规则在 atomic-customer 上触发较弱，但规则本身是合理的（只在有动态配置的项目生效）。

### 2.3 定时任务规则 ⚠️ 效果一般

**发现**: `job/` 目录下只有 1 个定时任务类 `BIDataTagBusiness.java`，且未扫描到 `@Scheduled` 或 `ElasticJob` 注解（可能在类内部或父类中）。

**问题**: 扫描规则对"注解在方法上但不在类声明上"或"通过 XML 配置"的定时任务覆盖不足。

**改进建议**: 增强定时任务扫描逻辑：
- 不仅扫描 `@Scheduled`，还要扫描 `SimpleJob` / `DataflowJob` 等 ElasticJob 接口实现
- 读取 `job/` 目录下所有类的完整内容，查找 `cron` 字符串或 `Sharding` 配置

### 2.4 HTTP 接口规则 ⚠️ 有提升空间

**发现**: `thirdpart/` 下有 15 个接口，但代码中未明显使用 `@FeignClient` 注解（可能通过 `smart-common` 封装或 XML 配置）。

**结果**: 只能提取到接口名列表，无法获取 URL 前缀和超时配置。

**结论**: 这是预期内的边界。HTTP 规则在遇到纯 Dubbo 或封装 Feign 的项目时效果会打折扣，需要在 `MANUAL` 标注中明确提醒用户补充。

### 2.5 规范文档规则 ✅ 有效

**发现**: 
- 项目没有 `docs/guides/` 目录
- 但有 `AGENTS.md` 和 `md/` 目录（含风险分析、代码审查报告等）

**处理**: 
- 正确判断为"无 guides 目录"，触发 skill 内置模板预填充
- `infrastructure.md` 中测试规范、日志规范、安全规范均标记为 `MANUAL` 并保留占位

**结论**: 规则有效。但可进一步增强：检测到 `md/` 目录下的技术文档时，可建议用户是否摘要合并。

---

## 3. 与现有 README.md 的对比

atomic-customer 的 README 已经相当完整（477 行），包含：

### README 已有的优质内容
- 详细的项目简介和核心功能列表（带 emoji）
- 完整的架构设计图（ASCII）
- 技术栈表格（含版本号）
- 项目结构树
- 快速开始指南
- 环境要求
- 核心模块说明
- 数据流说明
- 部署说明
- 贡献规范

### knowledge:init 生成 README 的差距
| 缺失项 | 原因 | 改进建议 |
|--------|------|----------|
| 架构设计图 | 无法从代码扫描生成 | 模板中增加 `MANUAL` 占位，提示用户补充 |
| 数据流说明 | 需要理解业务链路 | `MANUAL` 占位 |
| 部署说明 | 不在代码中 | `MANUAL` 占位 |
| 贡献规范 | 团队约定 | `MANUAL` 占位，或从 `.github/` / `CLAUDE.md` 提取 |
| 详细的模块职责描述 | README 已有较详细的描述 | 若项目已有 README，知识库初始化应**增量更新**而非覆盖重写 |

**关键发现**: 
> 当项目已有较完整的 README 时，`/knowledge:init` 不应盲目覆盖，而应采用 **Update 策略**：
> 1. 保留现有 README 的结构和风格
> 2. 仅补充缺失的导航链接（指向 AI-KNOWLEDGE.md / docs/）
> 3. 在 README 末尾增加"文档导航"区块

---

## 4. 跨项目对比：atomic-task vs atomic-customer

| 维度 | atomic-task | atomic-customer | 结论 |
|------|-------------|-----------------|------|
| 项目复杂度 | 高（1156 文件，多层业务） | 中高（1564 文件，external 模块） | 两者都适合三层知识库 |
| 现有 README | 弱（209 行，信息分散） | 强（477 行，结构完整） | customer 更适合 Update 策略 |
| 动态配置 | 强（secode_type.json, 175+ 配置） | 弱（主要硬编码枚举） | 动态配置规则触发有差异 |
| 独立模块 | bargain（后添加，易遗漏） | external（一开始就独立） | 模块边界规则两者都有效 |
| 定时任务 | 丰富（12+ 个 ElasticJob） | 稀少（1 个 BIDataTagBusiness） | 规则触发有差异 |
| 测试比例 | 116 / 1156 = 10% | 146 / 1564 = 9.3% | 两者测试比例相近 |
| 外部服务 | 17+ 个 | 15 个 | 数量相近 |

---

## 5. 对 design.md 的第二轮反馈

### 反馈 A: 需要支持三种初始化策略
基于 atomic-customer 已有完整 README 的情况，design.md 目前只提到了 `Update / Skip / Overwrite` 三种策略（在 `tech:init` 层面），但 `/knowledge:init` 自身也应支持：

1. **Create** — 从无到有生成全部 5 个文件（如 atomic-task）
2. **Update** — 增量补全，保留现有 README 风格（如 atomic-customer）
3. **Resync** — 只更新 AI-KNOWLEDGE.md 和 docs/，不动 README

**建议修改**: 在 design.md Phase 3 前增加"初始化策略检测"步骤：
```
if README.md 已存在且信息丰富:
    默认推荐 Update 策略
    生成时保留 README 原有结构和内容
    仅追加 AI-KNOWLEDGE.md / docs/ 的导航链接
else:
    默认推荐 Create 策略
    按完整模板生成 README
```

### 反馈 B: AUTO/MANUAL 标注需要更智能
在 atomic-customer 上，某些内容对于这个项目是 AUTO，对于另一个项目是 MANUAL。例如：
- `atomic-task` 的 bargain 模块有 1509 行代码 → 应标记为 `AUTO`（扫描可识别）
- 但如果某个项目的 external 模块只有 1 个控制器 → 可能更适合 `MANUAL`（询问用户是否值得写）

建议增加一个阈值规则：
```
独立包若包含 >= 10 个 Java 文件 或 >= 500 行代码:
    标记为 AUTO（自动生成摘要）
else:
    标记为 MANUAL（仅提示，让用户决定）
```

### 反馈 C: 外部服务接口的分类
atomic-customer 的 `thirdpart/` 下有 15 个接口，但 README 把它们叫做"第三方接口集成"，而 AI-KNOWLEDGE 只罗列了名字。

建议模板增加一个简单分类规则：
```
若接口名含:
  - Mall/MallUser/Product → 商城类接口
  - Wechat/Im/Call → 通讯类接口
  - Search → 搜索类接口
  - Order/Car → 业务类接口
```
这样可以让外部服务列表更有结构，而不只是名字堆砌。

### 反馈 D: 依赖版本提取需要更完整
扫描 `pom.xml` 时，当前只提取了 `znkf-parent` 版本。但 atomic-customer 还依赖了 `atomic-task-sdk`、`smart-common` 等有意义的版本。

建议增加"关键 SDK 依赖"提取规则：
- 提取所有 `*-sdk.version` 和 `smart-common.version`
- 在 AI-KNOWLEDGE.md 的依赖表中列出

---

## 6. 改进后的设计要点总结

经过 atomic-task 和 atomic-customer 两轮验证，`design.md` 应在以下方面进一步迭代：

1. **初始化策略分支** — 根据现有 README 丰富度选择 Create / Update / Resync
2. **模块边界阈值** — 独立包达到一定规模才 AUTO 生成
3. **外部服务分类** — 按接口名关键词做简单归类
4. **定时任务增强** — 扫描 ElasticJob 接口实现，不只扫描注解
5. **SDK 依赖提取** — 提取 `*-sdk.version` 到 AI-KNOWLEDGE.md
6. **README 保护机制** — 已有优质 README 时不覆盖，只追加导航

---

## 7. 结论

### 总体评价
增强后的扫描规则和模板在 `atomic-customer` 上的表现**优于第一轮 atomic-task**：
- `external` 模块未被遗漏（模块边界规则生效）
- 没有产生明显的"虚假事实"
- AUTO/MANUAL 标注让用户能清楚知道需要补什么

### 覆盖率预期
若 atomic-task 的纯扫描覆盖率约为 **18%**，atomic-customer 估计约为 **25-30%**（因为它的 README 更完整，且结构相对清晰）。这说明覆盖率与项目自身的文档成熟度强相关。

### 下一步建议
1. 按本轮反馈再次更新 `design.md`
2. 选择第三个项目做验证（推荐 `smart-common` 这种小型公共库）
3. 三轮验证收敛后，进入 SKILL.md 正式编写
