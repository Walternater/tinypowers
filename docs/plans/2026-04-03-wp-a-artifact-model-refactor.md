# WP-A Artifact Model Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the feature artifact model so PLAN only scaffolds planning artifacts, `SPEC-STATE.md` reflects real content state, and Fast vs Medium/Standard verification requirements diverge cleanly.

**Architecture:** Keep the existing `PLAN -> EXEC -> REVIEW -> DONE` lifecycle and track model, but change the artifact contract underneath it. The implementation should first shrink scaffold output, then make artifact status semantic instead of file-existence-based, then update REVIEW gates and docs to match the new model.

**Tech Stack:** Node.js scripts, Markdown templates, Node test runner (`node --test`)

---

### Task 1: Refactor scaffold output to plan-only artifacts

**Files:**
- Modify: `scripts/scaffold-feature.js`
- Modify: `tests/scaffold-feature.test.js`

**Step 1: Write the failing test expectation**

Update `tests/scaffold-feature.test.js` so both Standard and Fast track cases expect only:

```js
[
  'SPEC-STATE.md',
  'PRD.md',
  '技术方案.md',
  '任务拆解表.md'
]
```

And explicitly expect these files to be absent:

```js
[
  '测试计划.md',
  '测试报告.md'
]
```

Also assert:

```js
assert.equal(fs.existsSync(path.join(featureDir, 'notepads', 'learnings.md')), false);
```

**Step 2: Run test to verify it fails**

Run:

```bash
node --test tests/scaffold-feature.test.js
```

Expected:

- FAIL because the current scaffold still creates `测试计划.md`
- FAIL because the current scaffold still creates `测试报告.md`
- FAIL because the current scaffold still creates `notepads/learnings.md`

**Step 3: Write minimal implementation**

In `scripts/scaffold-feature.js`:

- Remove `测试计划.md` and `测试报告.md` from `ARTIFACTS`
- Remove `test-plan.md` and `test-report.md` from all `TRACKS.*.templates`
- Remove `fs.mkdirSync(path.join(featureDir, 'notepads'), { recursive: true });`
- Remove the block that writes `notepads/learnings.md`

The script should still:

- create `featureDir`
- render `SPEC-STATE.md`
- render `PRD.md`
- render track-specific `技术方案.md`
- render track-specific `任务拆解表.md`

**Step 4: Run test to verify it passes**

Run:

```bash
node --test tests/scaffold-feature.test.js
```

Expected:

- PASS

**Step 5: Commit**

```bash
git add tests/scaffold-feature.test.js scripts/scaffold-feature.js
git commit -m "refactor(scaffold): generate plan-only feature artifacts"
```

### Task 2: Update SPEC-STATE template to match the new artifact contract

**Files:**
- Modify: `configs/templates/spec-state.md`
- Test: `tests/scaffold-feature.test.js`

**Step 1: Add failing expectation**

Extend `tests/scaffold-feature.test.js` to assert the scaffolded `SPEC-STATE.md` marks testing artifacts as pending and only the lifecycle file as active.

Useful assertions:

```js
assert.match(specState, /\| 生命周期状态 \| SPEC-STATE\.md \| active \|/);
assert.match(specState, /\| 验证报告 \| VERIFICATION\.md \| pending \|/);
assert.doesNotMatch(specState, /\| 测试计划 \| 测试计划\.md \| done \|/);
```

**Step 2: Run test to verify it fails**

Run:

```bash
node --test tests/scaffold-feature.test.js
```

Expected:

- FAIL because the template still lists testing artifacts as default scaffold outputs

**Step 3: Write minimal implementation**

In `configs/templates/spec-state.md`:

- Keep the YAML phase block
- Update the artifact table so default rows reflect the new PLAN contract
- Remove any expectation that `测试计划.md` and `测试报告.md` are scaffolded during PLAN
- Keep `VERIFICATION.md` as `pending`
- Keep `STATE.md` as `optional`

**Step 4: Run test to verify it passes**

Run:

```bash
node --test tests/scaffold-feature.test.js
```

Expected:

- PASS

**Step 5: Commit**

```bash
git add configs/templates/spec-state.md tests/scaffold-feature.test.js
git commit -m "refactor(spec-state): align template with plan-stage artifacts"
```

### Task 3: Replace file-exists status with semantic artifact states

**Files:**
- Modify: `scripts/update-spec-state.js`
- Modify: `tests/spec-state.test.js`

**Step 1: Write the failing test**

Add a test to `tests/spec-state.test.js` that:

- scaffolds a new feature
- reads `SPEC-STATE.md`
- expects planning files to be `scaffolded`
- expects missing verification files to be `pending`

Add another test that:

- writes valid PRD / design / task content
- runs `update-spec-state.js --to EXEC`
- expects artifact statuses to become `filled`

**Step 2: Run test to verify it fails**

Run:

```bash
node --test tests/spec-state.test.js
```

Expected:

- FAIL because current `artifactStatus()` returns only `done` or `pending`

**Step 3: Write minimal implementation**

In `scripts/update-spec-state.js`:

- Add helper functions for semantic checks:
  - `hasAcceptanceCriteria(content)`
  - `hasConfirmedDecision(content)`
  - `hasTaskRows(content)`
  - `hasVerificationConclusion(content)`
- Replace `artifactStatus()` with semantic mapping:
  - missing file -> `pending`
  - `SPEC-STATE.md` -> `active`
  - `STATE.md` -> `optional`
  - file exists but required semantic content missing -> `scaffolded`
  - semantic content exists -> `filled`
  - verification artifact with PASS / FAIL conclusion -> `verified`

Do not change `PLAN -> EXEC` prerequisite checks in this task.

**Step 4: Run test to verify it passes**

Run:

```bash
node --test tests/spec-state.test.js
```

Expected:

- PASS for new semantic-state tests
- Existing phase-transition tests remain green

**Step 5: Commit**

```bash
git add scripts/update-spec-state.js tests/spec-state.test.js
git commit -m "refactor(spec-state): use semantic artifact statuses"
```

### Task 4: Diverge REVIEW gates by track

**Files:**
- Modify: `scripts/update-spec-state.js`
- Modify: `tests/spec-state.test.js`
- Modify: `skills/tech-code/SKILL.md`
- Modify: `skills/tech-commit/SKILL.md`

**Step 1: Write the failing test**

Adjust or add `tests/spec-state.test.js` cases so:

- Fast track can enter `REVIEW` with only `VERIFICATION.md`
- Standard track still fails without `测试计划.md` and `测试报告.md`
- Medium track behaves like Standard

**Step 2: Run test to verify it fails**

Run:

```bash
node --test tests/spec-state.test.js
```

Expected:

- FAIL on Fast path REVIEW transition because current code always requires three files

**Step 3: Write minimal implementation**

In `scripts/update-spec-state.js`:

- Update `validatePrerequisites.REVIEW()` to branch on `track`
- Use:

```js
if (track === 'fast') {
  // require VERIFICATION.md only
} else {
  // require 测试计划.md + 测试报告.md + VERIFICATION.md
}
```

In `skills/tech-code/SKILL.md`:

- Rewrite the testing section so Fast has minimum verification output
- Keep Medium / Standard as full evidence paths

In `skills/tech-commit/SKILL.md`:

- Rewrite preconditions so they match script behavior exactly

**Step 4: Run tests to verify they pass**

Run:

```bash
node --test tests/spec-state.test.js
```

Expected:

- PASS

**Step 5: Commit**

```bash
git add scripts/update-spec-state.js tests/spec-state.test.js skills/tech-code/SKILL.md skills/tech-commit/SKILL.md
git commit -m "feat(workflow): split review evidence requirements by track"
```

### Task 5: Sync workflow docs to the new artifact model

**Files:**
- Modify: `docs/guides/workflow-guide.md`
- Modify: `docs/guides/change-set-model.md`
- Modify: `README.md`

**Step 1: Write the failing check**

Manually identify stale statements that still say:

- scaffold always creates testing artifacts
- all tracks require the same verification outputs
- `测试计划.md` and `测试报告.md` are always present

**Step 2: Run targeted search**

Run:

```bash
rg -n "测试计划.md|测试报告.md|VERIFICATION.md|features/\\{id\\}-\\{name\\}" docs/guides README.md
```

Expected:

- Multiple stale references that need rewriting

**Step 3: Write minimal implementation**

Update docs so they explicitly say:

- PLAN stage scaffolds planning artifacts only
- Fast path uses lightweight verification
- Medium / Standard paths keep fuller testing evidence

Do not over-document implementation internals.

**Step 4: Run search again**

Run:

```bash
rg -n "测试计划.md|测试报告.md|VERIFICATION.md|features/\\{id\\}-\\{name\\}" docs/guides README.md
```

Expected:

- Remaining references are intentional and consistent with the new model

**Step 5: Commit**

```bash
git add docs/guides/workflow-guide.md docs/guides/change-set-model.md README.md
git commit -m "docs(workflow): sync guides with refactored artifact model"
```

### Task 6: Run the WP-A verification suite

**Files:**
- Test: `tests/scaffold-feature.test.js`
- Test: `tests/spec-state.test.js`

**Step 1: Run focused tests**

Run:

```bash
node --test tests/scaffold-feature.test.js tests/spec-state.test.js
```

Expected:

- PASS

**Step 2: Run full repository tests**

Run:

```bash
npm test
```

Expected:

- PASS

**Step 3: Run repository validation**

Run:

```bash
npm run validate
```

Expected:

- PASS

**Step 4: Inspect git diff**

Run:

```bash
git diff --stat
```

Expected:

- Only WP-A related scripts, tests, and docs changed

**Step 5: Commit final fixups**

If any final adjustments were needed:

```bash
git add scripts tests skills docs README.md
git commit -m "test(workflow): verify wp-a artifact model refactor"
```
