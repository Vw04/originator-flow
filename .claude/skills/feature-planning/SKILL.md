---

description: Use this when planning, scoping, prototyping, or implementing a new product feature, PRD, strategy doc, workflow, wireframe, module, dashboard, or operational system. Prioritizes token-efficient discovery, explicit batch sizing, minimal file reads, and staged execution.
argument-hint: "[feature/module/workflow name]"
-----------------------------------------------

# Feature Planning Skill

## Purpose

Use this skill to plan and execute product, design, documentation, and implementation work in a token-efficient way.

This skill is especially useful for:

* New feature planning
* PRD creation
* Strategy documents
* Workflow design
* Wireframe planning
* Dashboard or reporting design
* Prototype implementation
* Refactoring an existing product surface
* Turning rough business context into an executable product plan

## Operating Principles

* Start with the objective before reading files.
* Use search before broad file reads.
* Prefer small, targeted context over large reads.
* Work in batches.
* Separate product reasoning from implementation steps.
* Make assumptions explicit.
* Ask clarifying questions only when necessary.
* Preserve current project structure unless a change is clearly justified.
* Tie technical choices back to business value when relevant.

## Token Discipline

Before reading files, create a context budget:

| Category             | Required Output                                     |
| -------------------- | --------------------------------------------------- |
| Objective            | What are we trying to accomplish?                   |
| Likely files/folders | What needs to be inspected first?                   |
| Max initial reads    | Usually 3–7 files                                   |
| Search method        | Prefer Grep/Glob/search before Read                 |
| Avoid reading        | Generated files, assets, lockfiles, irrelevant docs |
| Stop condition       | When enough context exists to plan the first batch  |

Do not read a large number of files without first explaining why.

Do not recursively inspect broad directories unless required.

If context is becoming large, pause and summarize before proceeding.

## Required Workflow

### Phase 1 — Restate Objective

Restate the user’s request in one concise paragraph.

Identify:

- product/module name
- business objective
- platform user group: mortgage originator, investor, Homium operator, or mixed
- specific persona: loan officer, branch support, processor, investor, sponsor admin, platform operator, sys admin, etc.
- expected output
- affected surface area
- known constraints
- likely deliverables

### Phase 2 — Initial Assumptions

List reasonable assumptions.

Separate assumptions into:

* product assumptions
* technical assumptions
* design assumptions
* data/workflow assumptions
* compliance/security assumptions, if relevant

### Phase 3 — Context Budget

Before inspecting files, produce:

* files/folders likely needed
* max initial read count
* search terms to use first
* files/folders to avoid
* intended stopping point

### Phase 4 — Discovery

Use this order:

1. Inspect project structure only if needed.
2. Search for exact module or feature names.
3. Search likely folders.
4. Read the smallest relevant files.
5. Summarize findings before reading more.

Preferred search targets:

* existing PRDs
* design canon files
* mockup files
* relevant CSS/token files
* existing components
* existing workflow or routing files
* README or project-specific docs

### Phase 5 — Product Plan

Produce a concise product plan with:

* problem statement
* platform user personas, clearly distinguishing mortgage originator users, investor users, and Homium platform operator users
* user stories
* happy path
* edge cases
* required states
* data requirements
* screen/component requirements
* business rules
* acceptance criteria
* risks and dependencies

### Phase 6 — Implementation Plan

Break implementation into batches.

#### Batch 1 — Structure

* file organization
* routes
* page/component skeletons
* placeholder states
* type/interface definitions

#### Batch 2 — Core Logic

* data models
* workflow state
* core business rules
* API or service integration assumptions

#### Batch 3 — UI/UX

* screens
* components
* copy
* layout
* loading states
* error states
* empty states

#### Batch 4 — Validation

* tests
* lint/typecheck
* manual QA
* documentation updates
* unresolved questions

Do not move to later batches until the current batch is summarized.

### Phase 7 — Output Format

When invoked, respond using this structure:

1. Objective
2. Assumptions
3. Context budget
4. Discovery plan
5. Product plan
6. Implementation batches
7. Validation plan
8. Recommended next step

## Completion Checklist

Before finishing, confirm:

* files read
* files edited
* decisions made
* open questions
* validation performed
* recommended next smallest step

