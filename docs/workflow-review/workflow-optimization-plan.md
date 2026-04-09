# tinypowers Workflow 优化方案

> **生成日期**: 2026-04-03  
> **基于**: 5份端到端Workflow审查报告综合分析  
> **测试工程**: demo-order-service (Java + Spring Boot 3.2 + MyBatis)  
> **Skill版本**: tech-init 5.0 / tech-feature 8.0 / tech-code 9.0 / tech-commit 5.0

---

## 一、问题总览

### 1.1 核心问题（按严重度排序）

| 严重度 | 编号 | 问题 | 影响阶段 | 影响范围 |
|--------|------|------|---------|---------|
| **P0** | I-01 | 框架副本膨胀（145+文件被复制到项目） | init/commit | 所有选手 |
| **P0** | C-02 | 审查环节完全缺失 | code | 所有选手 |
| **P0** | C-05 | 测试文档三文件重叠>70% | code | 所有选手 |
| **P0** | F-01 | SPEC-STATE模板与脚本格式不匹配 | feature | opencode |
| **P1** | F-02 | SPEC-STATE假done状态 | feature | 所有选手 |
| **P1** | F-04 | 审批点在AI自驱时失效 | feature | 所有选手 |
| **P1** | C-01 | Deep Agent超时（30min） | code | opencode |
| **P1** | C-03 | Java版本不匹配 | code/init | opencode, codex |
| **P1** | C-04 | 测试文档事后补写 | code | 所有选手 |
| **P1** | M-01 | SPEC-STATE独立commit | commit | 所有选手 |
| **P1** | M-02 | 知识沉淀未激活 | commit | 所有选手 |
| **P2** | M-03 | Push/PR在本地仓库失败 | commit | 所有选手 |
| **P2** | I-02 | init升级感知缺失 | init | codex |
| **P2** | I-03 | .gitignore缺失 | init | opencode |

### 1.2 问题影响量化

```
文档效率损失
  │
40%├███████████████████████████ 测试文档重复（3文件→1文件）
  │
30%├█████████████████████ 文档提前创建（PLAN阶段创建测试文档）
  │
20%├██████████████ 审批点失效（4次暂停→0次有效暂停）
  │
10%├███████ 知识沉淀未激活（learnings→knowledge链路断裂）
  │
 0└───────────────────────────────────────────────────────

提交质量损失
  │
80%├███████████████████████████████████████████████████████ 框架副本膨胀
  │
20%├██████████████ 构建产物提交（.gitignore缺失）
  │
 0└───────────────────────────────────────────────────────
```

---

## 二、P0级优化方案（必须立即实施）

### 优化1: 框架安装机制重构 ⭐⭐⭐⭐⭐

#### 现状

```
install.sh 把整个框架仓库复制到目标项目：
- .claude/skills/tinypowers/agents/
- .claude/skills/tinypowers/docs/archive/
- .claude/skills/tinypowers/manifests/
- .claude/skills/tinypowers/scripts/（非运行时）
= 145+ 个文件，~400KB
```

#### 影响

- **opencode**: 提交包含178个文件，其中145个是框架副本
- **所有选手**: git历史膨胀，review困难

#### 优化方案

**方案A（推荐）: 全局安装**

```bash
# 安装时
install.sh --global
# 安装到: ~/.claude/skills/tinypowers/

# 目标项目只保留:
.claude/
├── CLAUDE.md              # 项目配置
├── settings.json          # 项目设置
├── hooks/                 # git hooks（5个）
│   ├── spec-state-guard
│   ├── gsd-session-manager
│   ├── pre-commit
│   ├── prepare-commit-msg
│   └── post-commit
└── rules/                 # 项目规则
    └── coding-standards.md

# skills 通过全局路径引用:
# ~/.claude/skills/tinypowers/skills/
```

**方案B: 精简安装**

```bash
# install.sh 只复制运行时需要的文件
.claude/skills/tinypowers/
├── skills/               # *.md 文件
│   ├── tech-init/
│   ├── tech-feature/
│   ├── tech-code/
│   └── tech-commit/
├── hooks/                # *.js 文件
├── rules/                # 项目规则
├── CLAUDE.md             # 模板
└── guides/               # 快速参考

# 不复制:
# - docs/archive/
# - manifests/
# - scripts/（除运行时需要的）
# - 框架自身文档
```

#### 改动范围

| 文件 | 改动 |
|------|------|
| `install.sh` | 增加`--global`和`--minimal`参数 |
| `manifests/` | 更新文件清单，区分core和optional |
| `CLAUDE.md` | 增加全局路径引用说明 |
| `doctor` | 增加全局安装检测 |

#### 预期收益

```
提交文件数: 178 → ~35（减少80%）
提交大小: ~500KB → ~100KB（减少80%）
git历史清洁度: 显著提升
```

---

### 优化2: 审查环节自动化 ⭐⭐⭐⭐⭐

#### 现状

```
/tech:code SKILL.md 规划了:
1. compliance-reviewer（方案符合性审查）
2. code-review（代码质量审查）

实际执行:
❌ 两个审查环节完全缺失，所有选手都跳过
```

#### 影响

- 技术方案中的锁定决策是否在代码中被遵守，没有经过验证
- 安全和质量问题无法被发现
- 代码质量依赖AI自我约束

#### 优化方案

```yaml
在/tech:code的"审查修复"步骤中:

Step 1: 自动触发compliance-reviewer
  输入:
    - 技术方案.md（锁定决策部分）
    - 本次变更的所有代码文件
  输出:
    - 决策合规性报告
    - 每条决策的符合状态: PASS / WARN / FAIL

Step 2: 自动code-review
  输入:
    - 代码diff
    - 项目编码规范
  输出:
    - 代码审查报告
    - 问题分级: critical / warning / suggestion

Step 3: 自动更新VERIFICATION.md
  - 将审查结果写入"决策合规性"部分
  - 将代码审查问题写入"已知问题"部分

Step 4: 人工介入判断
  - 仅当发现critical问题时暂停
  - warning和suggestion由AI自行修复
```

#### 审查检查清单

**compliance-reviewer检查项**:

| 检查项 | 示例 | 优先级 |
|--------|------|--------|
| 决策D-001 | 乐观锁CAS用法是否正确 | P0 |
| 决策D-002 | OutBox模式是否实现 | P0 |
| 决策D-003 | 幂等性Key是否生成 | P1 |
| 决策D-004 | 事务边界是否正确 | P1 |

**code-review检查项**:

| 检查项 | 示例 | 优先级 |
|--------|------|--------|
| SQL注入 | 是否使用预编译语句 | P0 |
| NPE风险 | 是否有空指针检查 | P1 |
| 资源泄漏 | 连接是否正确关闭 | P1 |
| 并发安全 | 共享变量是否正确同步 | P1 |

#### 改动范围

| 文件 | 改动 |
|------|------|
| `/tech:code/SKILL.md` | 增加审查自动化步骤 |
| `agents/compliance-reviewer.md` | 创建审查agent定义 |
| `agents/code-reviewer.md` | 创建审查agent定义 |
| `update-verification.js` | 增加审查结果自动写入 |

#### 预期收益

```
代码质量: 显著提升
决策合规性: 100%可追溯
人工介入: 仅critical问题（减少90%审查负担）
```

---

### 优化3: 测试文档三合一 ⭐⭐⭐⭐⭐

#### 现状

```
测试计划.md（测试用例表）
+ 测试报告.md（执行结果表）
+ VERIFICATION.md（AC映射）
= 3个文件，信息重叠>70%
```

#### 影响

- 维护成本高，改一处要改三处
- 容易不一致
- 文档/代码比=0.8:1，比例失衡

#### 优化方案

**合并为一个 VERIFICATION.md**

```markdown
# VERIFICATION.md

## 1. 测试用例

| 编号 | 场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|------|------|---------|---------|---------|---------|------|
| TC-01 | 正常下单 | 用户已登录 | 1. 选择商品<br>2. 提交订单 | 订单创建成功 | 订单创建成功 | PASS |
| TC-02 | 库存不足 | 商品库存为0 | 1. 选择商品<br>2. 提交订单 | 返回错误提示 | 返回错误提示 | PASS |

## 2. AC映射

| 验收标准 | 对应测试用例 | 验证结果 | 备注 |
|---------|-------------|---------|------|
| AC-01: 用户能成功创建订单 | TC-01 | PASS | - |
| AC-02: 库存不足时给出明确提示 | TC-02 | PASS | - |

## 3. 决策合规性

| 决策编号 | 决策内容 | 代码实现 | 验证结果 |
|---------|---------|---------|---------|
| D-001 | 使用乐观锁CAS更新库存 | OrderMapper.updateStock | PASS |
| D-002 | 订单状态变更使用OutBox模式 | OrderEventPublisher | PASS |

## 4. 结论

- **整体状态**: PASS
- **测试通过率**: 10/10 (100%)
- **已知问题**: 无
- **残留风险**: 无
```

#### 改动范围

| 文件 | 改动 |
|------|------|
| `scaffold-feature.js` | 删除测试计划/报告模板创建 |
| `/tech:code/SKILL.md` | 输出产物从4个减到2个 |
| `/tech:commit/SKILL.md` | 前置条件不再检查测试计划/报告 |
| `update-spec-state.js` | EXEC→REVIEW的前置检查只验证VERIFICATION.md |

#### 预期收益

```
文档量: -40%（3文件→1文件）
维护成本: 显著降低
文档/代码比: 0.8:1 → 0.4:1
```

---

### 优化4: SPEC-STATE模板与脚本统一 ⭐⭐⭐⭐

#### 现状

```markdown
<!-- 模板格式 -->
## 当前阶段
当前阶段: PLAN

<!-- 脚本期望格式 -->
```yaml
phase: PLAN
track: medium
```
```

#### 影响

- **opencode**: `update-spec-state.js`报错"缺少合法的phase"
- 需要反复修正格式才能通过

#### 优化方案

**方案A（推荐）: 脚本兼容多格式**

```javascript
// update-spec-state.js
function parsePhase(content) {
  // 支持格式1: YAML代码块
  const yamlMatch = content.match(/```yaml\nphase:\s*(\w+)/);
  if (yamlMatch) return yamlMatch[1];
  
  // 支持格式2: 中文格式
  const cnMatch = content.match(/当前阶段[:：]\s*(\w+)/);
  if (cnMatch) return cnMatch[1];
  
  // 支持格式3: 英文格式
  const enMatch = content.match(/phase[:：]\s*(\w+)/i);
  if (enMatch) return enMatch[1];
  
  return null;
}
```

**方案B: 统一模板格式**

```markdown
<!-- spec-state.md模板 -->
```yaml
phase: PLAN
track: medium
```

## 产物状态

| 产物 | 状态 | 说明 |
|------|------|------|
| PRD.md | scaffolded | 待填写 |
| 技术方案.md | scaffolded | 待填写 |
| 任务拆解表.md | scaffolded | 待填写 |
```

#### 改动范围

| 文件 | 改动 |
|------|------|
| `update-spec-state.js` | 增加多格式兼容解析 |
| `spec-state.md`模板 | 统一使用YAML代码块 |

#### 预期收益

```
格式调试时间: 减少80%
错误率: 显著降低
```

---

## 三、P1级优化方案（强烈建议）

### 优化5: scaffold分阶段创建 ⭐⭐⭐⭐

#### 现状

```
scaffold-feature.js 一次创建7个文件:
- PRD.md
- 技术方案.md
- 任务拆解表.md
- SPEC-STATE.md
- 测试计划.md      ← PLAN阶段不需要
- 测试报告.md      ← PLAN阶段不需要
- notepads/learnings.md  ← 空模板
```

#### 优化方案

```
feature阶段创建（4个）:
  SPEC-STATE.md + PRD.md + 技术方案.md + 任务拆解表.md

code阶段按需创建（1个）:
  VERIFICATION.md（开始测试时创建）

不再创建:
  notepads/learnings.md（改为EXEC阶段按需创建）
  测试计划.md / 测试报告.md（被VERIFICATION.md替代）
```

#### 产物状态流转

```
scaffolded → filled → verified
   │           │          │
   │           │          └── 验证通过后
   │           └── 内容填写后
   └── scaffold创建时
```

#### 改动范围

| 文件 | 改动 |
|------|------|
| `scaffold-feature.js` | 增加`--phase`参数，默认`plan`只创建4个文件 |
| `/tech:code/SKILL.md` | 进入时检查并创建VERIFICATION.md |
| `update-spec-state.js` | 状态流转: scaffolded → filled → verified |

#### 预期收益

```
PLAN阶段体验: 更干净，无空模板
假done状态: 消除
```

---

### 优化6: 状态判断基于内容而非文件存在 ⭐⭐⭐⭐

#### 现状

```javascript
// update-spec-state.js 当前逻辑
function checkArtifactStatus(filePath) {
  return fs.existsSync(filePath) ? 'done' : 'pending';
}
// 问题: 空模板也显示done
```

#### 优化方案

```javascript
// 新逻辑
function checkArtifactStatus(filePath, minLength = 200) {
  if (!fs.existsSync(filePath)) {
    return 'pending';
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const meaningfulContent = content.replace(/\s+/g, '').length;
  
  if (meaningfulContent < minLength) {
    return 'scaffolded';  // 空模板
  }
  
  // 检查关键内容
  if (filePath.includes('PRD.md')) {
    const hasAC = content.match(/AC-\d+[:：]|When.*Then/);
    return hasAC ? 'filled' : 'scaffolded';
  }
  
  if (filePath.includes('技术方案.md')) {
    const hasDecision = content.match(/已锁定决策|决策记录|锁定决策/);
    return hasDecision ? 'filled' : 'scaffolded';
  }
  
  return 'filled';
}
```

#### 状态定义

| 状态 | 含义 | 触发条件 |
|------|------|---------|
| pending | 未创建 | 文件不存在 |
| scaffolded | 已创建但为空 | 文件存在但内容<200字符 |
| filled | 已填写 | 内容>=200字符且有关键字段 |
| verified | 已验证 | 审查通过 |

#### 改动范围

| 文件 | 改动 |
|------|------|
| `update-spec-state.js` | 增加内容质量检查 |
| `spec-state.md`模板 | 更新状态说明 |

#### 预期收益

```
状态准确性: 显著提升
误导性: 消除
```

---

### 优化7: doctor增加构建运行时检查 ⭐⭐⭐

#### 现状

```
doctor --project 检查:
✅ hooks接线
✅ 目录存在
❌ 不检查Java运行时是否满足项目构建要求
```

#### 优化方案

```javascript
// doctor.js 新增检查
function checkBuildRuntime() {
  const checks = [];
  
  // 检查pom.xml中的Java版本要求
  if (fs.existsSync('pom.xml')) {
    const pom = fs.readFileSync('pom.xml', 'utf8');
    const javaVersionMatch = pom.match(/<java\.version>(\d+)</);
    const requiredJava = javaVersionMatch ? javaVersionMatch[1] : '8';
    
    // 检查当前Java版本
    const currentJava = execSync('java -version 2>&1').toString();
    const currentVersionMatch = currentJava.match(/version "(\d+)/);
    const currentVersion = currentVersionMatch ? currentVersionMatch[1] : 'unknown';
    
    if (parseInt(currentVersion) < parseInt(requiredJava)) {
      checks.push({
        status: 'FAIL',
        message: `Java版本不匹配: 项目要求${requiredJava}, 当前${currentVersion}`,
        suggestion: '使用: export JAVA_HOME=/opt/homebrew/opt/openjdk'
      });
    }
  }
  
  return checks;
}
```

#### 改动范围

| 文件 | 改动 |
|------|------|
| `doctor.js` | 增加Java版本检查 |
| `doctor.js` | 增加Maven/Gradle检查 |

#### 预期收益

```
环境问题前置暴露: 100%
code阶段阻塞: 消除
```

---

### 优化8: SPEC-STATE变更并入feature commit ⭐⭐⭐

#### 现状

```bash
# 当前流程
git commit -m "feat(ORDER-102): add payment callback"
# 修改SPEC-STATE.md → DONE
git commit -m "chore(ORDER-102): update spec state to DONE"
# 问题: 2个commits，增加噪音
```

#### 优化方案

**方案A: 合并到feature commit**

```bash
# 修改SPEC-STATE.md → DONE
git add .
git commit -m "feat(ORDER-102): add payment callback"
# 只有1个commit
```

**方案B: 自动amend**

```bash
# feature commit后
git commit -m "feat(ORDER-102): add payment callback"
# 修改SPEC-STATE.md → DONE
git add SPEC-STATE.md
git commit --amend --no-edit
# 只有1个commit
```

#### 改动范围

| 文件 | 改动 |
|------|------|
| `/tech:commit/SKILL.md` | 修改SPEC-STATE提交流程 |

#### 预期收益

```
commit数量: 2 → 1
历史清洁度: 提升
```

---

## 四、P2级优化方案（建议实施）

### 优化9: 知识沉淀半自动化 ⭐⭐⭐

#### 现状

```
知识沉淀链路:
实现细节 → notepads/learnings.md → docs/knowledge.md

实际执行:
❌ learnings.md 未创建或为空
❌ knowledge.md 无更新
❌ 链路全程未触发
```

#### 优化方案

```yaml
在/tech:commit的"交付后可选动作"中:

Step 1: 扫描learnings.md
  - 如果文件存在且有内容，提取条目
  - 如果文件不存在，检查本次feature是否有沉淀价值

Step 2: 判断沉淀价值
  触发条件（至少满足一条）:
    - 遇到了非显而易见的bug并解决
    - 发现了框架自身的限制或问题
    - 有对后续feature有价值的决策经验
    - 技术方案中有新的模式应用

Step 3: 推荐升级项
  - 从learnings.md中提取1-3条推荐升级项
  - 向用户展示推荐列表
  - 用户确认后写入knowledge.md

Step 4: 写入knowledge.md
  - 按分类写入（Patterns/Decisions/Lessons）
  - 添加时间戳和feature引用
```

#### learnings.md格式

```markdown
# ORDER-102 Learnings

## [PERSIST] 乐观锁CAS用法
`cancelByIdAndVersion`必须双条件WHERE，仅version有复用风险
<!-- /PERSIST -->

## 测试技巧
Mockito在Java 25下对具体类inline mock不稳定，建议用接口mock
```

#### 改动范围

| 文件 | 改动 |
|------|------|
| `/tech:commit/SKILL.md` | 增加知识沉淀步骤 |
| `notepads/learnings.md`模板 | 增加[PERSIST]标记说明 |

#### 预期收益

```
知识沉淀率: 0% → 50%+
知识库价值: 逐步积累
```

---

### 优化10: 暂停点重设计 ⭐⭐⭐

#### 现状

```
tech:feature: 2个暂停点（方案后 + 任务拆解后）
tech:code: 2个暂停点（Gate Check + 审查后）
= 4个暂停点

AI自驱时: 全部失效，变成AI自问自答
```

#### 优化方案

```
将4个隐式暂停改为2个显式检查点：

CHECK-1（feature → code边界）:
  触发: DESIGN.md完成后
  AI输出:
    📋 方案摘要
    - 需求: ORDER-102 订单退款申请与审批流
    - 决策: 4条锁定决策
    - 任务: 6个任务，3个Wave
    - 风险: 无
  
  等待: 人工输入'go'指令
  超时: 记录[AI-SELF-APPROVED]，继续执行

CHECK-2（code → commit边界）:
  触发: VERIFICATION.md完成后
  AI输出:
    🔍 变更摘要
    - 新增文件: 8个
    - 修改文件: 3个
    - 测试: 6/6 PASS
    - 决策合规: 4/4 PASS
  
  等待: 人工输入'go'指令
  超时: 记录[AI-SELF-APPROVED]，继续执行
```

#### 改动范围

| 文件 | 改动 |
|------|------|
| `/tech:feature/SKILL.md` | 合并2个暂停点为1个CHECK-1 |
| `/tech:code/SKILL.md` | 合并2个暂停点为1个CHECK-2 |

#### 预期收益

```
有效暂停: 0 → 2
无效暂停: 4 → 0
用户体验: 显著提升
```

---

## 五、实施路线图

### 5.1 阶段一（立即实施，1-2天）

| 优化项 | 负责人 | 预计工时 |
|--------|--------|---------|
| 框架安装机制重构 | 架构组 | 1天 |
| SPEC-STATE模板与脚本统一 | 工具组 | 0.5天 |
| .gitignore自动创建 | 工具组 | 0.5天 |

### 5.2 阶段二（短期实施，1周内）

| 优化项 | 负责人 | 预计工时 |
|--------|--------|---------|
| 测试文档三合一 | 文档组 | 2天 |
| scaffold分阶段创建 | 工具组 | 1天 |
| 状态判断基于内容 | 工具组 | 1天 |
| SPEC-STATE并入commit | 工具组 | 0.5天 |

### 5.3 阶段三（中期实施，2周内）

| 优化项 | 负责人 | 预计工时 |
|--------|--------|---------|
| 审查环节自动化 | AI组 | 3天 |
| doctor运行时检查 | 工具组 | 1天 |
| 知识沉淀半自动化 | AI组 | 2天 |
| 暂停点重设计 | 流程组 | 1天 |

### 5.4 预期效果

```
阶段一完成后:
  - 提交文件数: -80%
  - 格式错误: -80%

阶段二完成后:
  - 文档量: -40%
  - 假done状态: 消除
  - commit噪音: -50%

阶段三完成后:
  - 代码质量: 显著提升
  - 知识沉淀率: 50%+
  - 用户满意度: 显著提升
```

---

## 六、验证方案

### 6.1 回归测试

使用demo-order-service重新执行全流程，验证：

| 检查项 | 验证方法 | 通过标准 |
|--------|---------|---------|
| 框架副本 | `git status` | 提交文件<50个 |
| 文档合并 | `ls features/ORDER-XXX/` | 只有4-5个文件 |
| SPEC-STATE格式 | `update-spec-state.js` | 无报错 |
| 状态准确性 | 查看SPEC-STATE.md | 空模板显示scaffolded |
| 审查环节 | 查看VERIFICATION.md | 有决策合规性部分 |

### 6.2 性能测试

| 指标 | 当前 | 目标 | 验证方法 |
|------|------|------|---------|
| 全流程耗时 | 30-50min | 20-30min | 计时 |
| 文档/代码比 | 0.8:1 | 0.4:1 | 统计 |
| 提交文件数 | 178 | <50 | `git diff --stat` |
| 知识沉淀率 | 0% | >50% | 统计 |

---

## 七、附录

### 7.1 参考文档

- [2026-04-03-demo-order-service-e2e-review.md](2026-04-03-demo-order-service-e2e-review.md) - codex+GPT-5.4
- [2026-04-03-e2e-workflow-review.md](2026-04-03-e2e-workflow-review.md) - opencode+qwen-3.6-plus
- [OPTIMIZATION-2026-04-03.md](OPTIMIZATION-2026-04-03.md) - claude+glm-5.1
- [ORDER-102-workflow-review.md](ORDER-102-workflow-review.md) - codebuddy+default
- [workflow-review.md](workflow-review.md) - kilo+minimax-2.7

### 7.2 术语表

| 术语 | 说明 |
|------|------|
| tinypowers | AI辅助开发框架 |
| SKILL.md | 技能定义文件 |
| SPEC-STATE.md | 需求生命周期状态 |
| scaffold | 脚手架，自动生成文件 |
| worktree | git工作树 |
| compliance-reviewer | 方案符合性审查 |
| code-review | 代码质量审查 |

---

**文档版本**: v1.0  
**最后更新**: 2026-04-03  
**维护者**: Workflow优化小组
