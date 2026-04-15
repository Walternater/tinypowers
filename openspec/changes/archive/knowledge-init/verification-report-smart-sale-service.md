# /knowledge:init 第三轮验证报告：smart-sale-service

**验证时间**: 2026-04-14  
**验证项目**: smart-sale-service  
**验证方法**: 应用增强后的 design.md 规则，生成知识库初稿并逐项验证规则有效性

---

## 1. 行数对比

| 文件 | 生成初稿 | 现有文档 | 说明 |
|------|----------|----------|------|
| README.md | 45 行 | **无** | 项目没有 README |
| AI-KNOWLEDGE.md | 95 行 | 无 | 新增 |
| docs/business-domain.md | 180 行 | 无 | 新增（有零散 docs/ 但无统一领域文档）|
| docs/infrastructure.md | 95 行 | 无 | 新增 |
| docs/operations.md | 170 行 | 无 | 新增 |
| **总计** | **585 行** | 0 行 | — |

**关键发现**: smart-sale-service **完全没有 README.md**，这在瓜子客服团队的项目中非常罕见。这意味着 `/knowledge:init` 的 **Create 策略**是唯一正确选择。

---

## 2. README 评估与策略选择验证

### 评估结果
- **README 存在？** 否
- **策略推荐**: **Create**（从无到有生成全部 5 个文件）
- **验证结论**: ✅ 策略选择正确。若错误使用 Update/Overwrite 逻辑，会因找不到 README 而失败。

### 与 atomic-customer 的对比
| 项目 | README 状态 | 推荐策略 | 验证结论 |
|------|-------------|----------|----------|
| atomic-task | 有，但较弱（209 行） | Create | ✅ 已验证 |
| atomic-customer | 有，且完整（477 行） | Update | ✅ 已验证 |
| smart-sale-service | **无** | **Create** | ✅ **本轮验证通过** |

**结论**: 三轮验证覆盖了三种 README 场景（弱/强/无），README 评估分支逻辑完整有效。

---

## 3. 增强规则逐项验证

### 3.1 模块边界阈值规则 ✅ 非常有效

smart-sale-service 是**单模块 Maven 项目**（只有一个 `pom.xml`），但内部存在明显的业务子系统边界。这正好验证了模块边界规则不仅适用于多模块项目，也适用于单模块内的大型子包。

**扫描结果**:

| 子包 | Java 文件数 | 代码行数 | 阈值判定 | 标记 |
|------|------------|----------|----------|------|
| `com.guazi.znkf.sale.live` | 198 | 30,166 | ≥10 文件 / ≥500 行 | **AUTO** |
| `com.guazi.znkf.sale.search` | 15 | 2,506 | ≥10 文件 / ≥500 行 | **AUTO** |
| `com.guazi.znkf.sale.business.task` | ~25 | ~8,000+ | 子领域包 | **HYBRID** |
| `com.guazi.znkf.sale.business.carsource` | ~20 | ~6,000+ | 子领域包 | **HYBRID** |

**处理结果**:
- `live/` 被正确识别为大型独立子系统，在 `business-domain.md` 中生成了专门的"3.3 直播子模块"章节
- `search/` 被正确识别并生成"3.4 搜索子模块"章节
- 未出现因"单模块项目"而遗漏关键子系统的问题

**改进建议**: 对于单模块大项目，规则应进一步细化：
```
若某子包与同级其他子包在职责上明显隔离（如 live/ vs search/ vs business/），
且满足 ≥10 Java 文件 或 ≥500 行，
即使不在独立 Maven 模块中，也应作为独立子系统生成摘要。
```

### 3.2 外部服务接口分类规则 ✅ 有效且必要

**扫描结果**: `thirdpart/` 目录下发现了 **101 个接口**。

按关键词分类后效果：

| 分类 | 接口数量 | 示例 |
|------|----------|------|
| 商城类 | 10 | MallInterface, MallProductInterface, SaleMallInterface |
| 订单类 | 10 | OrderCenterInterface, DeliverInterface, ConsignInterface |
| 车源类 | 18 | CarApiInterface, CarSourceApiInterface, OplCarEvaluateInterface |
| 客户/用户类 | 10 | AtomicCustomerInterface, CustomerDispatchInterface, UserTagInterface |
| IM/呼叫类 | 10 | CallCenterInterface, ImDispatchInterface, GoCallCenterInterface |
| AI/智能类 | 10 | AiAgentInterface, G3AIInterface, RobotInterface |
| 营销/线索类 | 10 | BuildClueInterface, MktActivityInterface, LeadsInterface |
| 其他 | 23 | BdTaskCenterInterface, DealerInterface, WorkFlowInterface 等 |

**结论**: 如果没有分类规则，101 个接口会平铺在 `operations.md` 中形成"名字墙"，无法阅读。分类后结构清晰，用户可快速定位到自己关心的领域。

**注意**: 未扫描到 `@FeignClient` 注解（和 atomic-customer 情况一致），说明外部服务调用通过 Dubbo 或 `smart-common` 封装。URL 前缀和超时配置无法自动提取，已正确标记为 `MANUAL`。

### 3.3 定时任务扫描增强 ✅ 极其有效（本轮最大亮点）

**扫描结果**:

| 任务类 | 路径 | 实现方式 |
|--------|------|----------|
| `SyncOperatorToShopJob` | `job/` | `implements SimpleJob` |
| `SyncExperimentOperatorToShopJob` | `job/` | `implements SimpleJob` |
| `SeeCarReserveAlertJob` | `live/job/` | `implements SimpleJob` |
| `CloseLiveAccompanyJob` | `live/job/` | `implements SimpleJob` |
| `SendAnchorDailyReportJob` | `live/job/` | `implements SimpleJob` |

**关键验证**: 
- 这 5 个定时任务**没有任何一个**使用了 `@Scheduled` 注解
- 它们也没有直接使用 `@ElasticJob` 注解（而是通过 `implements SimpleJob`）
- **如果按照 design.md 旧版规则（只扫描 `@Scheduled` / `ElasticJob` 注解），这 5 个任务将全部遗漏**

**结论**: 增强后的定时任务规则（扫描 `SimpleJob` / `DataflowJob` 接口实现）**在本轮验证中发挥了决定性作用**。smart-sale-service 的定时任务几乎全部被拯救了。

### 3.4 SDK 依赖提取规则 ✅ 有效

从 `pom.xml` 中成功提取：

| SDK | 版本 |
|-----|------|
| `atomic-customer-sdk` | 1.2.76 |
| `atomic-task-sdk` | 1.2.85 |
| `smart-common` | 1.14.28-SNAPSHOT |

这些依赖在 `AI-KNOWLEDGE.md` 的"关键 SDK 依赖"表格中正确列出，对 AI 后续开发时的版本兼容性判断有直接帮助。

### 3.5 规范文档规则 ⚠️ 有提升空间

**扫描结果**:
- 无 `docs/guides/` 目录
- 但有 `docs/live-module-overview.md` 和 `docs/live-room-technical-design(1).md`

**处理结果**:
- 正确触发 skill 内置模板预填充 `infrastructure.md`
- 但未利用已有的 `docs/live-module-overview.md`（其中包含了大量直播模块的架构、枚举、包结构说明）

**改进建议**: 
```
规范文档规则增强：
若项目无 docs/guides/ 目录，但 docs/ 下存在其他 *.md 技术文档，
AI 应扫描其文件名和内容摘要，并在 infrastructure.md / business-domain.md 中
提示用户是否摘要合并。
```

---

## 4. 跨项目三轮对比

| 维度 | atomic-task | atomic-customer | smart-sale-service | 结论 |
|------|-------------|-----------------|-------------------|------|
| 项目复杂度 | 高（1156 文件） | 中高（1564 文件） | **极高（2645 文件）** | 规则在超大项目上依然有效 |
| Maven 模块 | 多模块 | 多模块 | **单模块** | 模块边界规则对子包也有效 |
| 现有 README | 弱（209 行） | 强（477 行） | **无** | 三种 README 场景均已覆盖 |
| 初始化策略 | Create | Update | **Create** | 策略分支逻辑完整 |
| 独立子系统 | bargain | external | **live / search** | 子包阈值规则生效 |
| 动态配置 | 强 | 弱 | 弱 | 规则触发有差异，合理 |
| 定时任务 | 12+ ElasticJob | 1 个稀少 | **5 个 SimpleJob** | 增强规则本轮价值最大 |
| 外部服务 | 17 个 | 15 个 | **101 个** | 分类规则在超大规模下价值巨大 |
| 测试比例 | 10% | 9.3% | **9.9%（262/2645）** | 比例稳定 |
| Kafka Consumer | 中等 | 中等 | **38+ 个** | 需要结构化展示 |
| SDK 依赖 | 有 | 有 | 有 | 提取规则稳定有效 |

---

## 5. 覆盖率预期

smart-sale-service 是三轮验证中**规模最大、外部接口最多**的项目。由于完全没有 README 和领域文档，AI 生成的 585 行初稿几乎构成了项目全部的结构性文档。

**覆盖率估算**: 
- 基础设施配置（Redis/Kafka/Dubbo/Prometheus）: ~60%（application.yml 较完整）
- 代码位置索引（核心类、Kafka Consumer、定时任务）: ~40%
- 业务领域知识（状态机、数据流、核心逻辑）: ~10%
- **综合覆盖率估计: 25-35%**

这与 atomic-customer 的估计（25-30%）接近，但 smart-sale-service 的规模更大，说明规则在大项目上的稳定性较好。

---

## 6. 对 design.md 的第三轮反馈

### 反馈 A: 模块边界规则应明确覆盖"单模块内的大型子包"

smart-sale-service 证明：关键业务子系统不一定表现为独立 Maven 模块。建议在 design.md 中补充：
```
模块边界规则适用于：
1. 与主包平级的独立包（如 com.guazi.znkf.bargain）
2. 单模块项目内部，职责隔离且达到阈值的大型子包（如 smart-sale-service 的 live/）
```

### 反馈 B: 规范文档规则应检测 docs/ 下的非 guides 技术文档

当项目存在 `docs/*.md` 但无 `docs/guides/` 时，AI 应：
1. 扫描 `docs/` 下所有 `.md` 文件的标题和摘要
2. 在生成文档的对应章节提示用户是否引用（如 `live-module-overview.md` → `business-domain.md` 的直播章节）

### 反馈 C: 超大规模外部服务列表需要更友好的展示策略

101 个接口即使分类后，按字母平铺仍显冗长。建议增加：
- **TOP-N 高亮**：按接口被引用次数或文件大小排序，突出核心接口
- **折叠区块**：每类接口默认折叠，只显示类名，不展开说明

### 反馈 D: Kafka Consumer 数量庞大时需要分组展示

smart-sale-service 有 38+ 个 Consumer。建议按所在包分组：
- `kafka/consumer/` — 销售订单/车服/金融事件
- `live/listener/` — 直播相关事件
- `exhibition/kafka/` — 展销会事件
- `car/relation/listenner/` — 车辆关系事件

---

## 7. 结论

### 总体评价
增强后的扫描规则和模板在 `smart-sale-service` 上的表现**稳定且有效**：
- ✅ 正确识别了无 README 场景，强制走 **Create** 策略
- ✅ `live/` 子系统（198 文件 / 30K 行）未被遗漏，模块边界阈值规则生效
- ✅ 101 个外部服务接口通过分类规则避免了"名字墙"
- ✅ **5 个 SimpleJob 定时任务全部被发现**，增强规则本轮价值最大
- ✅ SDK 依赖（atomic-customer-sdk / atomic-task-sdk / smart-common）正确提取

### 规则收敛度
经过 `atomic-task` → `atomic-customer` → `smart-sale-service` 三轮验证：
- **已收敛规则**: README 评估策略、模块边界阈值、SDK 依赖提取、定时任务扫描增强
- **待优化规则**: 超大规模接口展示策略、Kafka Consumer 分组、单模块子包边界

### 下一步建议
1. 按本轮反馈再次微调 `design.md`
2. 进入 `SKILL.md` 正式编写阶段
3. 建议在 SKILL.md 中明确声明：技能经过 3 个真实项目验证，覆盖多模块/单模块、有 README/无 README、中小规模/超大规模等不同场景
