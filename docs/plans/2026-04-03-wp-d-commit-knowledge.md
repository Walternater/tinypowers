# WP-D Commit & Knowledge Closure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the extra `DONE`-only commit from the intended feature closure flow and turn knowledge capture into a lightweight, opt-in recommendation path.

**Architecture:** Keep `DONE` as an explicit lifecycle state, but change its documented timing so it is included in the final feature commit rather than committed separately afterward. Keep `learnings -> knowledge` as a two-step model, but tighten the rules so knowledge capture is triggered only when the content is clearly worth persisting.

**Tech Stack:** Markdown workflow specs, repository docs, search-based validation

---

### Task 1: Rewrite the `DONE` closure contract in `tech:commit`

**Files:**
- Modify: `skills/tech-commit/SKILL.md`

**Step 1: Write the failing expectation**

Identify the current text in `skills/tech-commit/SKILL.md` that explicitly says:

- commit first
- then set `SPEC-STATE -> DONE`
- then create a separate commit just for the state change

**Step 2: Run targeted search**

Run:

```bash
rg -n "DONE|独立 commit|update spec state to DONE|提交成功后" skills/tech-commit/SKILL.md
```

Expected:

- Multiple hits reflecting the old two-commit closure model

**Step 3: Write minimal implementation**

In `skills/tech-commit/SKILL.md`:

- rewrite the closure flow so `SPEC-STATE -> DONE` is part of the final feature commit
- remove the dedicated chore commit wording
- keep the safety requirement that `DONE` should only describe a fully ready deliverable

Recommended flow wording:

1. Document Sync
2. Update `SPEC-STATE -> DONE`
3. Create the final feature commit
4. Push / PR

**Step 4: Re-run search**

Run:

```bash
rg -n "DONE|独立 commit|update spec state to DONE|提交成功后" skills/tech-commit/SKILL.md
```

Expected:

- Old wording removed or intentionally replaced

**Step 5: Commit**

```bash
git add skills/tech-commit/SKILL.md
git commit -m "docs(commit): remove separate done-state commit flow"
```

### Task 2: Sync the lifecycle explanation in workflow guides

**Files:**
- Modify: `docs/guides/workflow-guide.md`
- Modify: `docs/guides/change-set-model.md`

**Step 1: Write the failing expectation**

Find guide text that still implies:

- `DONE` is pushed only after commit success as a separate repository mutation
- feature closure naturally produces an extra meta commit

**Step 2: Run targeted search**

Run:

```bash
rg -n "DONE|SPEC-STATE|独立 commit|提交成功后" docs/guides/workflow-guide.md docs/guides/change-set-model.md
```

Expected:

- Stale references to the previous closure wording

**Step 3: Write minimal implementation**

Update both guides so they match the new closure contract:

- `DONE` belongs to the final delivery snapshot
- closure is represented by a single feature commit
- `SPEC-STATE.md` remains explicit, but no longer requires a separate cleanup commit

Do not over-specify git minutiae beyond what users need to follow.

**Step 4: Re-run search**

Run:

```bash
rg -n "DONE|SPEC-STATE|独立 commit|提交成功后" docs/guides/workflow-guide.md docs/guides/change-set-model.md
```

Expected:

- Remaining hits are consistent with the new contract

**Step 5: Commit**

```bash
git add docs/guides/workflow-guide.md docs/guides/change-set-model.md
git commit -m "docs(workflow): align guides with single-commit done closure"
```

### Task 3: Redefine knowledge capture as a recommendation path

**Files:**
- Modify: `skills/tech-commit/SKILL.md`
- Modify: `docs/knowledge.md`

**Step 1: Write the failing expectation**

Identify text that still makes knowledge capture sound like:

- a near-default final step
- something that should always run whenever `learnings.md` exists

**Step 2: Run targeted search**

Run:

```bash
rg -n "learnings|knowledge|交付后可选动作|沉淀" skills/tech-commit/SKILL.md docs/knowledge.md
```

Expected:

- Current wording is too principle-based and not operational enough

**Step 3: Write minimal implementation**

In `skills/tech-commit/SKILL.md`:

- define trigger conditions for recommending knowledge capture
- state clearly that empty or low-value `learnings.md` should be ignored
- introduce the optional `[PERSIST]` marker as the clearest signal for persistence-worthiness

In `docs/knowledge.md`:

- add a short usage note on what belongs there
- add a short note on what does *not* belong there
- keep the file lightweight

**Step 4: Re-run search**

Run:

```bash
rg -n "learnings|knowledge|交付后可选动作|沉淀|PERSIST" skills/tech-commit/SKILL.md docs/knowledge.md
```

Expected:

- wording now supports a clear recommendation flow

**Step 5: Commit**

```bash
git add skills/tech-commit/SKILL.md docs/knowledge.md
git commit -m "docs(knowledge): make persistence a lightweight recommendation path"
```

### Task 4: Sync the feature-level knowledge chain docs

**Files:**
- Modify: `docs/guides/workflow-guide.md`
- Modify: `docs/guides/change-set-model.md`
- Modify: `README.md` (if needed)

**Step 1: Write the failing expectation**

Find text that still implies:

- all features produce `learnings.md`
- feature learnings should usually flow into project knowledge
- the knowledge chain is active by default

**Step 2: Run targeted search**

Run:

```bash
rg -n "learnings|knowledge|PERSIST" docs/guides README.md
```

Expected:

- Existing text is too generic or too strong

**Step 3: Write minimal implementation**

Update docs to say:

- `learnings.md` is a feature-level scratchpad, only when needed
- `docs/knowledge.md` is a project-level curated memory
- promotion from learnings to knowledge is selective, not automatic

Avoid introducing new workflow complexity.

**Step 4: Re-run search**

Run:

```bash
rg -n "learnings|knowledge|PERSIST" docs/guides README.md
```

Expected:

- Remaining references are consistent and intentional

**Step 5: Commit**

```bash
git add docs/guides/workflow-guide.md docs/guides/change-set-model.md README.md
git commit -m "docs(workflow): clarify learnings-to-knowledge promotion rules"
```

### Task 5: Run the WP-D documentation verification pass

**Files:**
- Test: repository docs and validation output

**Step 1: Run workflow text search**

Run:

```bash
rg -n "独立 commit|update spec state to DONE|提交成功后推进|learnings|knowledge|PERSIST" skills docs README.md
```

Expected:

- No stale references to the old DONE closure model
- Knowledge references are selective and consistent

**Step 2: Run repository validation**

Run:

```bash
npm run validate
```

Expected:

- PASS

**Step 3: Inspect git diff**

Run:

```bash
git diff --stat
```

Expected:

- Changes limited to commit and knowledge related docs

**Step 4: Commit final fixups**

If any final adjustments were needed:

```bash
git add skills docs README.md
git commit -m "docs(commit): verify wp-d closure and knowledge updates"
```
