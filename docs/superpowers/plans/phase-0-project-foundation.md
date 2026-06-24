# Phase 0 Project Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the full documentation-first repository foundation for VisualERP without implementing backend logic, database schema, or frontend redesign.

**Architecture:** The phase creates the source-of-truth documentation for a universal mini-ERP platform built around a modular monolith, industry profiles, and optional modules. The plan locks product language, architecture direction, engineering rules, and AI-agent constraints before implementation phases begin.

**Tech Stack:** Markdown documentation, future TypeScript-first application stack, planned modular monolith backend, planned React frontend.

---

## Checklist

- [x] Create the required root documentation files.
- [x] Create the `docs/` structure for product, architecture, engineering, migration, roadmap, decisions, and superpowers plans.
- [x] Fill every required markdown file with useful content.
- [x] Keep the product direction universal for small manufacturing, not only dry construction mixes.
- [x] Document MVP modules and future optional modules.
- [x] Document AI-agent rules for general agents, Claude-style agents, and Codex/GPT-style agents.
- [x] Leave backend, database schema, and frontend redesign out of scope.

## Expected Files

Root:

- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `CODEX.md`
- `TASKS.md`
- `.env.example`

Documentation:

- `docs/PROJECT-CONTEXT.md`
- `docs/STATUS.md`
- `docs/product/PRODUCT-SPEC.md`
- `docs/product/ROLES-AND-PERMISSIONS.md`
- `docs/product/BUSINESS-PROCESSES.md`
- `docs/product/MODULES.md`
- `docs/architecture/ARCHITECTURE.md`
- `docs/architecture/DATA-MODEL.md`
- `docs/architecture/API.md`
- `docs/architecture/OFFLINE-SYNC.md`
- `docs/architecture/FINANCE-AND-CURRENCY.md`
- `docs/architecture/SECURITY.md`
- `docs/engineering/DEVELOPMENT-RULES.md`
- `docs/engineering/TESTING-STRATEGY.md`
- `docs/engineering/PERFORMANCE.md`
- `docs/engineering/UI-RULES.md`
- `docs/migration/EXCEL-MAPPING.md`
- `docs/roadmap/ROADMAP.md`
- `docs/decisions/adr-001-modular-monolith.md`
- `docs/superpowers/plans/phase-0-project-foundation.md`

## Acceptance Criteria

Phase 0 is accepted only if:

- all required files exist;
- each file contains useful content rather than placeholders;
- the architecture is documented as a modular monolith;
- the product is explicitly described as a universal mini-ERP for small manufacturing;
- universal entities are documented;
- MVP and future modules are documented;
- AI-agent rules are documented;
- `TASKS.md` shows clear next phases;
- `docs/STATUS.md` reflects the repository state after this phase;
- no backend implementation is introduced;
- no frontend redesign is introduced.

## What Not To Do In This Phase

- Do not start backend implementation.
- Do not create the final database schema.
- Do not install unnecessary dependencies.
- Do not redesign the frontend prototype.
- Do not hardcode construction-specific logic into the core model.
- Do not remove the existing frontend prototype archive.
