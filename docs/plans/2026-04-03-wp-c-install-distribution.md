# WP-C Install & Distribution Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make global install the clear recommended path and reduce the default installation footprint so target projects only receive runtime-essential tinypowers assets.

**Architecture:** Keep both install modes, but tighten the default installation surface through `manifests/components.json` and make `install.sh`, `install-manifest.js`, `doctor.js`, and README tell the same story. This is a distribution cleanup, not a workflow redesign.

**Tech Stack:** Bash installer, Node.js manifest/tooling scripts, Node test runner (`node --test`)

---

### Task 1: Redefine the default component footprint

**Files:**
- Modify: `manifests/components.json`
- Test: `tests/install-manifest.test.js`

**Step 1: Write the failing test expectation**

Extend `tests/install-manifest.test.js` so the resolved profile output reflects the new component model.

At minimum add expectations that:

- default/full profiles do not implicitly include archive-style documentation
- the resolved component list matches the new runtime-oriented split

If you add optional components such as `docs-runtime` or `repo-maintenance`, assert the exact resolved component string.

**Step 2: Run test to verify it fails**

Run:

```bash
node --test tests/install-manifest.test.js
```

Expected:

- FAIL because current manifest still treats `docs/` and other repo materials as part of `core`

**Step 3: Write minimal implementation**

In `manifests/components.json`:

- shrink `core.sources` to runtime-essential files only
- remove broad `docs/` from `core`
- if needed, introduce optional components for non-runtime materials
- update profiles so default profiles stay practical but slim

Do not move anything that `doctor`, `init-project`, or runtime hooks still require.

**Step 4: Run test to verify it passes**

Run:

```bash
node --test tests/install-manifest.test.js
```

Expected:

- PASS

**Step 5: Commit**

```bash
git add manifests/components.json tests/install-manifest.test.js
git commit -m "refactor(install): slim default component footprint"
```

### Task 2: Keep manifest resolution behavior aligned with the new component model

**Files:**
- Modify: `scripts/install-manifest.js`
- Test: `tests/install-manifest.test.js`

**Step 1: Write the failing test**

Add or adjust tests to verify:

- profile expansion still includes required dependencies
- optional components remain opt-in
- target auto-detection still resolves the expected default component set

**Step 2: Run test to verify it fails**

Run:

```bash
node --test tests/install-manifest.test.js
```

Expected:

- FAIL if the new manifest shape is not fully supported by `install-manifest.js`

**Step 3: Write minimal implementation**

In `scripts/install-manifest.js`:

- keep dependency expansion logic intact
- ensure new optional components resolve correctly
- ensure auto-detection does not accidentally pull repo-maintenance or archive components into the default set

**Step 4: Run test to verify it passes**

Run:

```bash
node --test tests/install-manifest.test.js
```

Expected:

- PASS

**Step 5: Commit**

```bash
git add scripts/install-manifest.js tests/install-manifest.test.js
git commit -m "refactor(install): align manifest resolver with slim install model"
```

### Task 3: Reframe `install.sh` around the recommended global path

**Files:**
- Modify: `install.sh`

**Step 1: Write the failing expectation**

Review `install.sh --help` and installation output. Identify stale wording that:

- treats project-local install as the implicit primary path
- does not clearly distinguish global vs project install
- does not explain the slim default runtime footprint

**Step 2: Run installer help**

Run:

```bash
bash install.sh --help
```

Expected:

- Output does not yet clearly communicate the preferred install path

**Step 3: Write minimal implementation**

In `install.sh`:

- update help text to recommend `--global`
- if adding a new flag such as `--minimal`, make it map cleanly onto manifest behavior
- improve completion output so it clearly states which install mode was used

Do not introduce unnecessary flag complexity.

**Step 4: Re-run help**

Run:

```bash
bash install.sh --help
```

Expected:

- Help text clearly explains:
  - global install
  - project-local install
  - when each mode is appropriate

**Step 5: Commit**

```bash
git add install.sh
git commit -m "docs(install): clarify recommended install mode"
```

### Task 4: Improve `doctor` install-mode diagnosis

**Files:**
- Modify: `scripts/doctor.js`
- Modify: `tests/tooling.test.js`

**Step 1: Write the failing test**

Add tests in `tests/tooling.test.js` that cover:

- repository mode
- explicit `--install-root`
- global-install style resolution

At minimum, assert that the output distinguishes the current install context without incorrectly failing.

**Step 2: Run test to verify it fails**

Run:

```bash
node --test tests/tooling.test.js
```

Expected:

- FAIL because current doctor output does not fully explain install mode / path semantics

**Step 3: Write minimal implementation**

In `scripts/doctor.js`:

- surface install mode in `info` output
- clarify whether the tool is checking:
  - repo workspace
  - project-local install
  - global install
- avoid reporting the absence of a project-local framework copy as an error when using global install

Keep existing success behavior intact.

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
git commit -m "feat(doctor): explain install mode and root selection"
```

### Task 5: Sync README and install-facing docs

**Files:**
- Modify: `README.md`
- Modify: `docs/guides/runtime-matrix.md` (if needed)
- Modify: `docs/guides/generated-vs-curated-policy.md` (if needed)

**Step 1: Write the failing documentation check**

Search for install instructions and identify text that still implies:

- the project-local framework copy is the main path
- the full repository is expected to be copied into target projects

**Step 2: Run targeted search**

Run:

```bash
rg -n "install|--global|components|docs/archive|.claude/skills/tinypowers" README.md docs/guides
```

Expected:

- Results that require wording cleanup

**Step 3: Write minimal implementation**

Update docs so they clearly explain:

- recommended use of `--global`
- the reason for slimmer default installs
- the difference between runtime assets and repo-internal materials

Avoid over-explaining installer internals.

**Step 4: Re-run search**

Run:

```bash
rg -n "install|--global|components|docs/archive|.claude/skills/tinypowers" README.md docs/guides
```

Expected:

- Remaining references are intentional and consistent

**Step 5: Commit**

```bash
git add README.md docs/guides/runtime-matrix.md docs/guides/generated-vs-curated-policy.md
git commit -m "docs(install): sync install guidance with slim distribution model"
```

### Task 6: Run the WP-C verification suite

**Files:**
- Test: `tests/install-manifest.test.js`
- Test: `tests/tooling.test.js`

**Step 1: Run focused tests**

Run:

```bash
node --test tests/install-manifest.test.js tests/tooling.test.js
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

- Changes are limited to installer, manifest, doctor, tests, and install-facing docs

**Step 5: Commit final fixups**

If any final adjustments were needed:

```bash
git add install.sh manifests scripts tests README.md docs/guides
git commit -m "test(install): verify wp-c distribution cleanup"
```
