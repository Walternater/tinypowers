# knowledge-scanning.md

## 作用

定义 `/tech:init` 在 Step 2（领域知识扫描）中的具体扫描策略和输出格式。

## 核心原则

**只提取模型无法从公开资料获取的内容。**

判断标准：如果你需要翻内部文档或问老员工才能回答的问题，就属于领域知识。Google 能搜到的，不需要。

## 扫描策略

### 1. 依赖扫描

读取依赖声明文件，识别非公开包：

| 文件 | 提取内容 |
|------|---------|
| `package.json` | dependencies/devDependencies 中的非 npm 公开包（@company/*、私有 registry） |
| `pom.xml` | 非 Maven Central 的依赖（内部 groupId） |
| `go.mod` | 非 github.com 公开仓库的 replace 指令 |
| `build.gradle` | 自定义 repository 和内部依赖 |

对识别到的内部依赖，采样 2-3 个使用文件，记录用法要点。

### 2. 请求封装扫描

采样 2-3 个 API 调用文件，提取请求封装模式：

- 请求库和封装方式（axios 实例、fetch wrapper、统一 Response 包装）
- URL 构造规则（hostMap、代理配置、路径前缀要求）
- 错误处理模式（全局拦截、统一错误码、特殊重试逻辑）

### 3. 组件用法扫描

采样 2-3 个页面/组件文件，提取组件组合模式：

- UI 组件库选型和关键组件用法（特别是与公开版本行为不同的内部组件）
- 状态管理模式（全局状态、页面级状态、组件间通信）
- 页面结构惯例（文件拆分方式、目录组织）

### 4. 配置约束扫描

读取构建和路由配置，提取隐性约束：

- 路由配置中的 URL 格式要求
- 构建配置中的特殊 loader/plugin
- 环境变量或配置项的必填约束

## 采样方法

不是全量扫描，是采样：

```text
1. 用 Glob 找到所有 Controller/Service/Page 文件
2. 选取 2-3 个最有代表性的（通常是最近的、最完整的）
3. Read 这些文件，提取模式
4. 不需要记录每个细节，只记录"这个项目特有的惯例"
```

## 输出格式

扫描结果整理为三类，对应 `docs/knowledge.md` 的三个分区：

```markdown
## 组件用法

### @company/ui-lib 的 ProTable

- 必须通过 `columns` 配置而非 children 传递列定义
- 分页需要传 `pagination={{ current, pageSize, total }}` 而非自动处理
- 代码示例: src/pages/order/ListPage.tsx 第 45-60 行

## 平台约束

### 接口地址必须以 `/api/` 开头

- 网关拦截不以 `/api/` 开头的请求，返回 404
- 正确: `/api/order/list`
- 错误: `/order/list`

## 踩坑记录

### ProTable cacheKey 必须全局唯一 → 发现于 init

- 同一页面有两个 ProTable 时，如果 cacheKey 重复，切换页面数据会串
- 必须为每个 ProTable 设置唯一的 cacheKey
```

## 空项目处理

以下情况跳过扫描，保留空模板：
- 新项目没有任何源码
- 项目只有配置文件（package.json、pom.xml）没有实现代码
- 采样文件不足 2 个

空模板后续由 `/tech:code` Phase 5（知识沉淀）通过物料飞轮逐步填充。
