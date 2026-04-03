# WP-B Review Automation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the `/tech:code` review stage into a real execution path with explicit review agents and automatic `VERIFICATION.md` updates.

**Architecture:** Keep the current review order of “compliance first, quality second”, but formalize it as a concrete chain: `compliance-reviewer` -> `code-reviewer` -> `update-verification.js`. The implementation should define a stable review output contract, add the missing code-review agent, add a verification update script, then sync `tech:code` documentation and validation tests to match.

**Tech Stack:** Node.js scripts, Markdown agents, Node test runner (`node --test`)

---

### Task 1: Normalize the compliance review output contract

**Files:**
- Modify: `agents/compliance-reviewer.md`
- Test: `scripts/validate.js`

**Step 1: Write the failing expectation**

Review `agents/compliance-reviewer.md` and identify places where the output contract is too free-form to be machine-merged into `VERIFICATION.md`.

The new output must explicitly contain:

- review title
- findings grouped by severity
- overall verdict
- wording that can be parsed or reliably merged

**Step 2: Run validation to establish baseline**

Run:

```bash
npm run validate
```

Expected:

- PASS before changes

**Step 3: Write minimal implementation**

In `agents/compliance-reviewer.md`:

- Keep its role as “方案符合性 + 安全”
- Normalize the report structure so it can be consumed by a script
- Ensure the report sections clearly map to:
  - decision compliance
  - security findings
  - overall verdict

Recommended normalized severity / verdict vocabulary:

- `BLOCK`
- `WARNING`
- `SUGGESTION`
- `PASS`
- `CONDITIONAL`
- `FAIL`

**Step 4: Run validation**

Run:

```bash
npm run validate
```

Expected:

- PASS

**Step 5: Commit**

```bash
git add agents/compliance-reviewer.md
git commit -m "refactor(review): normalize compliance review output contract"
```

### Task 2: Add a dedicated code-review agent

**Files:**
- Create: `agents/code-reviewer.md`
- Test: `scripts/validate.js`

**Step 1: Write the failing expectation**

Create a new agent spec in mind that:

- does not duplicate compliance checks
- focuses on code quality, maintainability, and engineering risk
- uses the same output contract style as `compliance-reviewer`

**Step 2: Run validation to verify the file is missing**

Run:

```bash
test -f agents/code-reviewer.md || echo "missing"
```

Expected:

- `missing`

**Step 3: Write minimal implementation**

Create `agents/code-reviewer.md` with:

- valid frontmatter (`name`, `description`)
- sections expected by `validate.js`
- explicit responsibilities:
  - readability
  - maintainability
  - exception handling
  - test support
  - concurrency / resource risk
- structured output format aligned with `compliance-reviewer`

Do not make it judge product or architecture intent. That remains outside its scope.

**Step 4: Run validation**

Run:

```bash
npm run validate
```

Expected:

- PASS

**Step 5: Commit**

```bash
git add agents/code-reviewer.md
git commit -m "feat(review): add dedicated code review agent"
```

### Task 3: Add a verification report merge script

**Files:**
- Create: `scripts/update-verification.js`
- Modify: `scripts/validate.js`
- Test: `tests/update-verification.test.js`

**Step 1: Write the failing test**

Create `tests/update-verification.test.js` with at least these cases:

1. creates `VERIFICATION.md` when missing
2. merges a compliance review report into a dedicated section
3. merges a code review report into a dedicated section
4. updates final verdict away from PASS when a BLOCK / FAIL finding exists

**Step 2: Run test to verify it fails**

Run:

```bash
node --test tests/update-verification.test.js
```

Expected:

- FAIL because `scripts/update-verification.js` does not exist yet

**Step 3: Write minimal implementation**

Create `scripts/update-verification.js` with a minimal CLI:

```bash
node scripts/update-verification.js \
  --root <project-root> \
  --feature <feature-dir> \
  --compliance-report <path> \
  --code-review-report <path>
```

Minimum behavior:

- locate the feature directory
- create `VERIFICATION.md` if missing
- write/update:
  - `## 决策合规性`
  - `## 代码审查`
  - `## 已知问题 / 残留风险`
  - `## 结论`
- preserve deterministic section order
- avoid appending duplicate sections on repeated runs

Update `scripts/validate.js` so the new script is treated as part of the workflow skeleton.

**Step 4: Run tests**

Run:

```bash
node --test tests/update-verification.test.js
npm run validate
```

Expected:

- PASS

**Step 5: Commit**

```bash
git add scripts/update-verification.js scripts/validate.js tests/update-verification.test.js
git commit -m "feat(verification): add review result merge script"
```

### Task 4: Wire the review chain into `tech:code`

**Files:**
- Modify: `skills/tech-code/SKILL.md`
- Modify: `docs/guides/workflow-guide.md`
- Modify: `docs/guides/capability-map.md`

**Step 1: Write the failing documentation check**

Identify stale language that still describes review as:

- a loose recommendation
- a single generic code-review step
- a path that does not mention `VERIFICATION.md` merge behavior

**Step 2: Run targeted search**

Run:

```bash
rg -n "compliance-reviewer|requesting-code-review|VERIFICATION.md|审查修复" skills/tech-code/SKILL.md docs/guides/workflow-guide.md docs/guides/capability-map.md
```

Expected:

- Existing text still describes review at a higher level than the new implementation

**Step 3: Write minimal implementation**

In `skills/tech-code/SKILL.md`:

- explicitly define the review chain:
  - `compliance-reviewer`
  - `code-reviewer`
  - `update-verification.js`
  - repair loop
- define failure handling:
  - `BLOCK` / `FAIL` blocks progression
  - `WARNING` / `SUGGESTION` enters repair loop or is recorded as residual risk

In `docs/guides/workflow-guide.md` and `docs/guides/capability-map.md`:

- sync the public explanation with the new review chain
- avoid mentioning behavior that is no longer true

**Step 4: Re-run search**

Run:

```bash
rg -n "compliance-reviewer|requesting-code-review|VERIFICATION.md|审查修复" skills/tech-code/SKILL.md docs/guides/workflow-guide.md docs/guides/capability-map.md
```

Expected:

- Results are intentional and consistent with the new review model

**Step 5: Commit**

```bash
git add skills/tech-code/SKILL.md docs/guides/workflow-guide.md docs/guides/capability-map.md
git commit -m "docs(review): wire automated review chain into tech-code"
```

### Task 5: Define the commit-stage contract for review results

**Files:**
- Modify: `skills/tech-commit/SKILL.md`
- Modify: `docs/guides/change-set-model.md`

**Step 1: Write the failing documentation expectation**

Identify current `tech:commit` text that only checks for the existence of verification artifacts, but does not reflect that review findings are now merged into `VERIFICATION.md`.

**Step 2: Run targeted search**

Run:

```bash
rg -n "VERIFICATION.md|测试计划.md|测试报告.md|前置条件" skills/tech-commit/SKILL.md docs/guides/change-set-model.md
```

Expected:

- Existing text lacks the new review-result contract

**Step 3: Write minimal implementation**

In `skills/tech-commit/SKILL.md`:

- clarify that commit preconditions include review result convergence
- reference `VERIFICATION.md` as the merged evidence entrypoint

In `docs/guides/change-set-model.md`:

- update the meaning of `VERIFICATION.md`
- clarify where decision compliance and code review conclusions now live

**Step 4: Re-run search**

Run:

```bash
rg -n "VERIFICATION.md|测试计划.md|测试报告.md|前置条件" skills/tech-commit/SKILL.md docs/guides/change-set-model.md
```

Expected:

- Remaining references are consistent with the new review contract

**Step 5: Commit**

```bash
git add skills/tech-commit/SKILL.md docs/guides/change-set-model.md
git commit -m "docs(commit): reflect merged review evidence contract"
```

### Task 6: Run the WP-B verification suite

**Files:**
- Test: `tests/update-verification.test.js`
- Test: `scripts/validate.js`

**Step 1: Run focused tests**

Run:

```bash
node --test tests/update-verification.test.js
```

Expected:

- PASS

**Step 2: Run repository validation**

Run:

```bash
npm run validate
```

Expected:

- PASS

**Step 3: Run full repository tests**

Run:

```bash
npm test
```

Expected:

- PASS

**Step 4: Inspect git diff**

Run:

```bash
git diff --stat
```

Expected:

- Changes are limited to review agents, verification script, tests, and docs

**Step 5: Commit final fixups**

If any final adjustments were needed:

```bash
git add agents scripts tests skills docs
git commit -m "test(review): verify wp-b review automation"
```
