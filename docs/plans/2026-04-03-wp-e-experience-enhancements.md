# WP-E Experience Enhancements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve workflow usability by surfacing runtime blockers earlier in `doctor` and replacing vague pause points with explicit, non-deceptive checkpoints.

**Architecture:** Leave the underlying workflow model alone. Add lightweight runtime diagnostics to `doctor.js`, then rewrite `tech:feature` and `tech:code` so they expose two concise checkpoints with clear “soft gate bypassed” semantics instead of pretending AI self-approval is human approval.

**Tech Stack:** Node.js diagnostics, Markdown workflow specs, Node test runner (`node --test`)

---

### Task 1: Add runtime diagnostics to `doctor`

**Files:**
- Modify: `scripts/doctor.js`
- Modify: `tests/tooling.test.js`

**Step 1: Write the failing test**

Add a test in `tests/tooling.test.js` that exercises project-runtime diagnosis behavior.

At minimum, cover a temporary project root containing a `pom.xml` or equivalent marker and assert that doctor output includes a runtime/environment section rather than only install/hook checks.

If direct Java invocation is too environment-sensitive for tests, structure the implementation so the version detection helper can be tested through stable fallbacks or mocked command output.

**Step 2: Run test to verify it fails**

Run:

```bash
node --test tests/tooling.test.js
```

Expected:

- FAIL because current `doctor.js` does not surface runtime diagnostics

**Step 3: Write minimal implementation**

In `scripts/doctor.js`:

- add project runtime checks for:
  - Java version requirement where detectable
  - Maven / Gradle presence where relevant
- distinguish output buckets:
  - framework install issues
  - project hookup issues
  - runtime environment issues

Prefer warnings or explicit runtime findings over hard failure unless the environment is clearly unusable.

**Step 4: Run tests**

Run:

```bash
node --test tests/tooling.test.js
```

Expected:

- PASS

**Step 5: Commit**

```bash
git add scripts/doctor.js tests/tooling.test.js
git commit -m "feat(doctor): surface project runtime diagnostics"
```

### Task 2: Clarify doctor-facing documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/guides/capability-map.md` (if needed)

**Step 1: Write the failing documentation check**

Find install or tooling text that still implies `doctor` only checks installation completeness.

**Step 2: Run targeted search**

Run:

```bash
rg -n "doctor" README.md docs/guides/capability-map.md
```

Expected:

- Existing text underspecifies the new runtime-diagnostics role

**Step 3: Write minimal implementation**

Update docs so `doctor` is described as:

- install verification
- hook wiring verification
- runtime readiness diagnostics

Do not turn README into a long troubleshooting guide.

**Step 4: Re-run search**

Run:

```bash
rg -n "doctor" README.md docs/guides/capability-map.md
```

Expected:

- Text is consistent with the new behavior

**Step 5: Commit**

```bash
git add README.md docs/guides/capability-map.md
git commit -m "docs(doctor): describe runtime readiness checks"
```

### Task 3: Redesign the `feature -> code` checkpoint

**Files:**
- Modify: `skills/tech-feature/SKILL.md`
- Modify: `docs/guides/workflow-guide.md`

**Step 1: Write the failing expectation**

Identify wording that currently says:

- output `技术方案.md` then pause
- output `任务拆解表.md` then pause

without defining a concrete checkpoint payload or what happens in self-driven execution.

**Step 2: Run targeted search**

Run:

```bash
rg -n "暂停|确认|任务拆解|技术方案" skills/tech-feature/SKILL.md docs/guides/workflow-guide.md
```

Expected:

- Current language describes pauses but not an explicit checkpoint contract

**Step 3: Write minimal implementation**

In `skills/tech-feature/SKILL.md`:

- replace the two vague pause points with one explicit checkpoint
- define the checkpoint payload:
  - requirement summary
  - key decisions
  - task count / readiness
  - main risks
- state that without human confirmation the run may proceed as `soft gate bypassed`

In `docs/guides/workflow-guide.md`:

- mirror the new checkpoint concept at a high level

Do not present this as a hard approval workflow.

**Step 4: Re-run search**

Run:

```bash
rg -n "暂停|确认|checkpoint|soft gate bypassed" skills/tech-feature/SKILL.md docs/guides/workflow-guide.md
```

Expected:

- Results reflect the new explicit checkpoint model

**Step 5: Commit**

```bash
git add skills/tech-feature/SKILL.md docs/guides/workflow-guide.md
git commit -m "docs(feature): replace vague pauses with explicit checkpoint"
```

### Task 4: Redesign the `code -> commit` checkpoint

**Files:**
- Modify: `skills/tech-code/SKILL.md`
- Modify: `docs/guides/workflow-guide.md`

**Step 1: Write the failing expectation**

Identify wording that currently ends review/verification without defining a concrete handoff summary into commit.

**Step 2: Run targeted search**

Run:

```bash
rg -n "审查修复|测试与验证|VERIFICATION.md|checkpoint|暂停" skills/tech-code/SKILL.md docs/guides/workflow-guide.md
```

Expected:

- No explicit `code -> commit` checkpoint contract yet

**Step 3: Write minimal implementation**

In `skills/tech-code/SKILL.md`:

- add an explicit second checkpoint after review and verification
- define required summary fields:
  - change summary
  - test result
  - review verdict
  - decision compliance summary
  - residual risk
- state that self-driven continuation should be recorded as `soft gate bypassed`

In `docs/guides/workflow-guide.md`:

- sync the public explanation of the second checkpoint

This task assumes WP-B has already defined review output; document the dependency clearly if not yet implemented.

**Step 4: Re-run search**

Run:

```bash
rg -n "审查修复|测试与验证|VERIFICATION.md|checkpoint|soft gate bypassed" skills/tech-code/SKILL.md docs/guides/workflow-guide.md
```

Expected:

- Results match the new checkpoint design

**Step 5: Commit**

```bash
git add skills/tech-code/SKILL.md docs/guides/workflow-guide.md
git commit -m "docs(code): add explicit pre-commit checkpoint summary"
```

### Task 5: Verify there is no fake approval language

**Files:**
- Modify: workflow docs only if needed

**Step 1: Run repository-wide search**

Run:

```bash
rg -n "AI-SELF-APPROVED|approved|审批|checkpoint|soft gate bypassed" skills docs README.md
```

Expected:

- Any “approval” language is either removed or clearly scoped to human approval only

**Step 2: Write minimal implementation**

Clean up any wording that:

- implies timeout == approval
- implies AI can grant itself a real approval
- makes checkpoints sound mandatory for all flows when they are meant as explicit summaries

**Step 3: Re-run search**

Run:

```bash
rg -n "AI-SELF-APPROVED|approved|审批|checkpoint|soft gate bypassed" skills docs README.md
```

Expected:

- Wording is consistent and non-deceptive

**Step 4: Commit**

```bash
git add skills docs README.md
git commit -m "docs(workflow): remove fake approval semantics from checkpoints"
```

### Task 6: Run the WP-E verification suite

**Files:**
- Test: `tests/tooling.test.js`

**Step 1: Run focused tests**

Run:

```bash
node --test tests/tooling.test.js
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

- Changes are limited to doctor, tests, and workflow-facing docs

**Step 5: Commit final fixups**

If any final adjustments were needed:

```bash
git add scripts tests skills docs README.md
git commit -m "test(workflow): verify wp-e experience enhancements"
```
