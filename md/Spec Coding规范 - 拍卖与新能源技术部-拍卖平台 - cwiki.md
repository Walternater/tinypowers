# Spec Coding规范

* 1[一、开发准备](#SpecCoding规范-一、开发准备)
* 2[二、工程目录结构](#SpecCoding规范-二、工程目录结构)
* 3[三、多工程开发协作规范](#SpecCoding规范-三、多工程开发协作规范)
* 4[四、自定义Skill](#SpecCoding规范-四、自定义Skill)
  * 4.1[1、/tech:init](#SpecCoding规范-1、/tech:init)
  * 4.2[2、/tech:feature](#SpecCoding规范-2、/tech:feature)
    * 4.2.1[阶段一：理解与澄清](#SpecCoding规范-阶段一：理解与澄清)
    * 4.2.2[阶段二：方案设计](#SpecCoding规范-阶段二：方案设计)
    * 4.2.3[阶段三：生成测试用例](#SpecCoding规范-阶段三：生成测试用例)
  * 4.3[3、/tech:code](#SpecCoding规范-3、/tech:code)
    * 4.3.1[阶段一：开发执行](#SpecCoding规范-阶段一：开发执行)
    * 4.3.2[阶段二：代码审查](#SpecCoding规范-阶段二：代码审查)
    * 4.3.3[阶段三：测试与报告](#SpecCoding规范-阶段三：测试与报告)
    * 4.3.4[阶段四：验证与交付](#SpecCoding规范-阶段四：验证与交付)
  * 4.4[4、/tech:commit](#SpecCoding规范-4、/tech:commit)

# 一、开发准备

开发工具：Cluade+SuperPowers

# 二、工程目录结构

```
?├src/├──main/    ├──java/    ├──resource/├──test/├doc    ├──guides/        ├──prd-analysis-spec.md 产品需求 PRD 分析与任务拆解指南        ├──code-review-spec.md  代码审查清单        ├──test-plan-spec.md  测试计划规范    ├──rules/      ├──ai-guardrails.md - AI约束与开发流程      ├──ai-development-backend.md - 团队内开发规范    ├──templates/        ├──技术方案模版.md        ├──任务拆解模版.md        ├──测试计划模版.md        ├──Code Review模版.md├──features/    ├──CSS-2005-mark-customer/        ├──CSS-2005-需求文档.md        ├──CSS-2005-技术方案.md        ├──CSS-2005-任务拆解表.md        ├──CSS-2005-测试计划.md        ├──CSS-2005-code-review.md        ├──CSS-2005-测试报告.md├claude.md - 入口文件，定义工作流程
```

# 三、多工程开发协作规范

car-source

README.md

sale-tech

README.md

agent-service

README.md

Claude

![](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjRweCIgdmlld0JveD0iMCAtOTYwIDk2MCA5NjAiIHdpZHRoPSIyNHB4IiBmaWxsPSIjMDAwMDAwIj48cGF0aCBkPSJNMjQwLTQwMGg0ODB2LTgwSDI0MHY4MFptMC0xMjBoNDgwdi04MEgyNDB2ODBabTAtMTIwaDQ4MHYtODBIMjQwdjgwWk04ODAtODAgNzIwLTI0MEgxNjBxLTMzIDAtNTYuNS0yMy41VDgwLTMyMHYtNDgwcTAtMzMgMjMuNS01Ni41VDE2MC04ODBoNjQwcTMzIDAgNTYuNSAyMy41VDg4MC04MDB2NzIwWk0xNjAtMzIwaDU5NGw0NiA0NXYtNTI1SDE2MHY0ODBabTAgMHYtNDgwIDQ4MFoiLz48L3N2Zz4=)

未命名绘图-1774340901423

RDADME.md需要包含如下内容：

1、工程总体介绍

2、接口规范文档：Dubbo API、Http API

3、Jar类工程需要包含：

1）@Compoent @Service @Bean 定义的抽象类以及类中所有public方法

2）自定义注解，如：@Access、@TokenNoRequire、@Attribute等

3）基础类：如BaseController、XException定义

4）工具类：全部public static定义的方法

# 四、自定义Skill

## 1、/tech:init

初始化/claude.md、/doc/rules、/doc/guides、/doc/templates

## 2、/tech:feature

工作流程：

a、创建需求feature目录，如：features/CSS-2005-mark-customer

b、创建代码分支：git branch -b CSS-2005-mark-customer

c、访问Jira，获取需求文档，存储需求PRD稿：Jira MCP→CWiki MCP，输入：CSS-2005-需求文档.md

d、需求分析

需求文档 → 需求理解 → 技术方案设计 → 任务拆解

交付清单：

CSS-2005-技术方案.md  
CSS-2005-任务拆解表.md  
CSS-2005-测试计划.md

点击此处展开...

### 阶段一：理解与澄清

|  |  |  |
| :-- | :-- | :-- |
| 1 | 阅读feature/CSS-2005-需求文档.md，按 guides/prd-analysis-spec.md 执行需求分析 | 需求理解确认 |
| 2 | 使用 superpowers:brainstorming 分析代码现状 | 复用方案、技术难点 |

### 阶段二：方案设计

|  |  |  |
| :-- | :-- | :-- |
| 1 | 按 feature/CSS-2005-技术方案.md | 技术方案文档 |
| 2 | 按 guides/prd-analysis-spec.md 执行任务拆解 | 任务拆解表 |

**关键确认**：技术方案输出后暂停，等待确认后再进入开发阶段。

### 阶段三：生成测试用例

|  |  |  |
| :-- | :-- | :-- |
| 1 | 按 guides/test-plan-spec.md 规范编写测试计划 | 测试计划文档 |

  
  

## 3、/tech:code

工作流程：

Spec Code

Code Review

Vibe Code

Finish

Test

![](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjRweCIgdmlld0JveD0iMCAtOTYwIDk2MCA5NjAiIHdpZHRoPSIyNHB4IiBmaWxsPSIjMDAwMDAwIj48cGF0aCBkPSJNMjQwLTQwMGg0ODB2LTgwSDI0MHY4MFptMC0xMjBoNDgwdi04MEgyNDB2ODBabTAtMTIwaDQ4MHYtODBIMjQwdjgwWk04ODAtODAgNzIwLTI0MEgxNjBxLTMzIDAtNTYuNS0yMy41VDgwLTMyMHYtNDgwcTAtMzMgMjMuNS01Ni41VDE2MC04ODBoNjQwcTMzIDAgNTYuNSAyMy41VDg4MC04MDB2NzIwWk0xNjAtMzIwaDU5NGw0NiA0NXYtNTI1SDE2MHY0ODBabTAgMHYtNDgwIDQ4MFoiLz48L3N2Zz4=)

未命名绘图-1774339366555

交付清单：

CSS-2005-code-review.md  
CSS-2005-测试报告.md

  

点击此处展开...

### 阶段一：开发执行

  

|  |  |  |
| :-- | :-- | :-- |
| 1 | 直接编写代码，遵循rules/ai-guardrails.md和rules/ai-development-backend.md | 代码文件 |

* * *

### 阶段二：代码审查

  

|  |  |  |
| :-- | :-- | :-- |
| 1 | 使用 superpowers:requesting-code-review 进行审查 | 审查报告 |
| 2 | 按审查报告修复问题 | 修复后代码 |
| 3 | 验证修复是否正确 | 自检结果 |
| 4 | 确认所有问题已解决 | 审查通过 |

> 迭代：当修复后新问题暴露，应继续修复直到审查通过

* * *

### 阶段三：测试与报告

  

|  |  |  |
| :-- | :-- | :-- |
| 1 | 按 guides/test-plan-spec.md 规范编写测试计划 | 测试计划文档 |
| 2 | 使用 superpowers:test-driven-development 编写单元测试 | 单元测试 |
| 3 | 使用 superpowers:test-driven-development 进行集成测试 | 集成测试 |
| 4 | 按 template/test-report.md 模板填写测试报告 | 测试报告 |

**关键确认**：测试报告输出后暂停，等待确认后再进入验证阶段。

* * *

### 阶段四：验证与交付

  

|  |  |  |
| :-- | :-- | :-- |
| 1 | 使用 superpowers:verification-before-completion 进行最终验证 | 验证报告 |
| 2 | 检查交付物完整性 | 交付清单 |

## 4、/tech:commit

a、Redoc阶段：基于现有代码逻辑，复写如下文档：CSS-2005-技术方案.md，README.md

b、commit分支代码