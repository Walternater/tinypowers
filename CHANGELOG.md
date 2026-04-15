# Changelog

All notable changes to the tinypowers project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-09

### Added

- **Four Core Skills** - Complete tinypowers framework with four orchestrated skills:
  - `tech:init` - Project initialization with stack detection and domain knowledge scanning
  - `tech:feature` - Feature planning with guided Q&A, document generation, and CHECK-1 gate
  - `tech:code` - Pattern scanning, coding with compliance review, and CHECK-2 gate
  - `tech:commit` - Document synchronization, knowledge capture, and commit finalization

- **Five Gate Scripts** - Automation scripts for quality gates and project detection:
  - `scripts/detect-stack.sh` - Detect Maven/Gradle projects and output stack info as JSON
  - `scripts/check-gate-1.sh` - CHECK-1 gate for feature planning completeness
  - `scripts/check-gate-2-enter.sh` - CHECK-2 entry gate for code phase readiness
  - `scripts/check-gate-2-exit.sh` - CHECK-2 exit gate with verification report generation
  - `scripts/pattern-scan.sh` - Scan codebase patterns for Controller/Service/Repository/Entity

- **Six Document Templates** - Standardized templates for consistent documentation:
  - `templates/CLAUDE.md` - Project context and conventions for AI assistants
  - `templates/knowledge.md` - Domain knowledge capture (conventions, gotchas, patterns)
  - `templates/PRD.md` - Product Requirements Document with EARS format acceptance criteria
  - `templates/spec.md` - Technical specification with locked decisions (D-XXX format)
  - `templates/tasks.md` - Task breakdown with dependencies (T-XXX format)
  - `templates/commit-message.md` - Standardized commit message format

- **Compliance Reviewer Agent** - Multi-dimensional specification compliance checking:
  - `agents/compliance-reviewer.md` - Agent definition for 5-dimension review
  - Decision compliance - Verify locked decisions are implemented
  - Interface compliance - Verify API contracts match specification
  - Data compliance - Verify data models match design
  - Scope compliance - Verify implementation stays within defined scope
  - Security compliance - Verify security requirements are met

- **Full Integration Test Suite** - Comprehensive end-to-end testing:
  - `tests/integration/test-init.sh` - Test stack detection and init templates
  - `tests/integration/test-feature.sh` - Test feature planning and CHECK-1 gate
  - `tests/integration/test-code.sh` - Test pattern scan, compliance review, CHECK-2 gates
  - `tests/integration/test-full-flow.sh` - Test complete init → feature → code → commit flow

### Design

- **Thin Orchestration Layer** - tinypowers defines WHAT (skills, gates, formats), superpowers handles HOW (brainstorming, coding, review)
- **State Machine** - SPEC-STATE.md tracks feature state: PLAN → CODE → CODE_DONE → DONE
- **Quality Gates** - CHECK-1 and CHECK-2 enforce documentation completeness before proceeding
- **Knowledge Flywheel** - docs/knowledge.md accumulates conventions and gotchas across iterations

[1.0.0]: https://github.com/wcf/tinypowers/releases/tag/v1.0.0

## [1.0.1] - 2026-04-09

### Changed

- Rebuilt tinypowers from `main` as a clean, shell-first v1.0 baseline instead of layering new workflow logic onto the old runtime-heavy framework
- Removed the old hook/config/context/JavaScript runtime stack and kept the core four-skill workflow surface
- Restored the minimal v1.0 assets only: shell gate/helper scripts, templates, internal specs, compliance reviewer, and shell integration fixtures/tests
- Aligned `CHECK-2` verification output with `/tech:commit` expectations so `VERIFICATION.md` can be consumed consistently downstream

### Fixed

- Integration tests now generate fixtures and reports at runtime, with `TEST_REPORT_DIR` available for CI artifact collection
- `CHECK-2` now blocks stale or BLOCK-level compliance reports and only generates `VERIFICATION.md` on real success
- CI now validates both test step outcomes and expected reports so silent test crashes cannot pass green

[1.0.1]: https://github.com/wcf/tinypowers/releases/tag/v1.0.1
