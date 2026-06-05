---

description: Use this when distilling long conversations, notes, transcripts, Teams chats, screenshots, PRD discussions, strategy notes, dev feedback, design reviews, or messy project context into concise confirmed facts, decisions, assumptions, open questions, and recommended project document updates. Prioritizes token conservation, no scope creep, and relevance-only context usage.
argument-hint: "[context source, module, workflow, or document]"
----------------------------------------------------------------

# Context Distillation Skill

## Purpose

Use this skill to convert messy or lengthy context into concise, usable project knowledge.

This skill is especially useful for:

* long Claude conversations
* pasted Teams or Slack discussions
* internal notes
* stakeholder comments
* dev-team feedback
* design review notes
* PRD discussions
* screenshots with contextual commentary
* rough strategy notes
* module planning discussions
* implementation-review conversations
* decision logs
* open-question cleanup

The goal is to extract only what matters, preserve what has been decided, avoid unsupported scope expansion, and produce clear next actions for the project.

## Core Principle

Distill; do not reinvent.

Use the user’s existing context history, project docs, and prior decisions as the guide.

Do not introduce new explicit product concepts, workflows, fields, permissions, screens, data models, compliance rules, or design requirements unless:

1. the user explicitly provided them,
2. they are clearly present in source material,
3. they are a direct continuation of already-agreed project logic, or
4. they are clearly labeled as a proposed option for review.

When introducing a proposed option, explain why it follows from existing themes, conditions, constraints, or reasoning already discussed.

Do not silently convert a proposed idea into a requirement.

## Token Conservation Rules

Be extremely conservative with context reads.

Before reading files, create a context budget.

The context budget must include:

| Category                   | Required Output                                                             |
| -------------------------- | --------------------------------------------------------------------------- |
| Objective                  | What needs to be distilled                                                  |
| Relevant module/workstream | Token Ops, RBAC, mockup, PRD, design canon, etc.                            |
| Source material            | What context is being used                                                  |
| Likely files               | Smallest set of files likely needed                                         |
| Max initial reads          | Usually 0–3 files if user pasted enough context; 3–5 if files are necessary |
| Search terms               | Exact terms to locate relevant context                                      |
| Files to avoid             | Unrelated docs, assets, generated files, broad folders                      |
| Stop condition             | When enough context exists to produce the distillation                      |

Do not read the entire repo.

Do not read all docs.

Do not read unrelated files.

Do not read broad folders.

Do not re-read files already summarized unless the current task requires exact language.

If user-provided context is sufficient, do not read files at all.

If more context is needed, state exactly what is missing before reading more.

## Relevance Filter

Only extract context that is relevant to the current task.

When reviewing large context, sort information into:

| Category                   |       Include? | Rule                                                    |
| -------------------------- | -------------: | ------------------------------------------------------- |
| Direct decisions           |            Yes | Include as confirmed decisions                          |
| Repeated themes            |            Yes | Include if relevant to current module                   |
| Open questions             |            Yes | Consolidate and deduplicate                             |
| Implementation constraints |            Yes | Include if they affect build, PRD, mockup, or workflow  |
| User preferences           |            Yes | Include if stable and relevant                          |
| Random discussion          |             No | Omit unless it affects the project                      |
| Stale ideas                |     Usually no | Include only if still relevant or explicitly historical |
| Conflicting details        |            Yes | Flag conflict, do not resolve silently                  |
| Speculation                | Only if useful | Label as proposed or working assumption                 |

## No Scope Creep Rule

Do not add requirements just because they seem useful.

Do not introduce:

* new modules
* new screens
* new roles
* new permissions
* new data fields
* new lifecycle states
* new workflows
* new status labels
* new integrations
* new compliance requirements
* new visual design rules
* new backend assumptions

unless explicitly provided or clearly labeled as proposed.

If something seems like a useful addition, place it under:

```text
Proposed Future Consideration
```

Do not include it under confirmed facts or requirements.

## Required Classification System

Every extracted item must be classified as one of:

| Classification     | Meaning                                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| Confirmed Fact     | Explicitly stated or already agreed                                      |
| Decision           | A direction the user/team has chosen                                     |
| Working Assumption | Reasonable but not yet confirmed                                         |
| Open Question      | Needs user/team decision                                                 |
| Dependency         | Requires another module, person, system, or file                         |
| Risk               | Could create ambiguity, failure, or implementation issue                 |
| Out of Scope       | Explicitly not part of current work                                      |
| Future State       | Later-phase idea, not current build                                      |
| Proposed Option    | New suggestion that follows from prior reasoning but is not yet approved |

Use this classification system consistently.

## User and Platform Context

Do not confuse Vincent with the platform users.

Vincent is the Claude Code user and Homium operator using Claude to design, document, and implement project workflows.

The Homium platform users may include:

1. Mortgage Origination Users

   * Loan Officers
   * branch support staff
   * processors
   * other origination company users

2. Investor Users

   * housing finance professionals
   * HFA employees
   * CFOs
   * lawyers
   * tax/accounting professionals
   * impact investors
   * foundations/nonprofits
   * corporate stakeholders

3. Homium Platform Operator Users

   * internal Homium staff managing origination, investor, program, token, accounting, RBAC, analytics, and support workflows

When distilling product context, specify which platform user group is affected.

Do not use generic “user” language if the distinction matters.

## How to Handle Existing Context History

Use previous project context as a guide for tone, constraints, and logic.

Important standing themes:

* practical over perfect
* MVP first, scalable later
* avoid over-engineering
* maintain auditability
* preserve operational clarity
* conserve token usage
* avoid design drift
* use existing brand canon for mockup implementation
* separate confirmed facts from assumptions
* preserve open questions instead of repeatedly asking them
* do not introduce unsupported scope
* translate complex operating procedures into simple functional workflows
* distinguish internal Homium operator complexity from external originator simplicity
* investor users may be sophisticated but still need clear actions and transparent reporting

When a new idea is introduced, check whether it fits these standing themes.

If it does not fit, flag it as a concern.

## Required Workflow When Invoked

### 1. Identify the Distillation Target

State:

* what context is being distilled
* which module/workstream it affects
* expected output
* whether the goal is memory, PRD update, mockup update, decision log, or open-question cleanup

### 2. Create Context Budget

Before reading files or long context, state:

* exact source material needed
* max files to inspect
* search terms
* files/folders to avoid
* stop condition

If the pasted context is sufficient, say:

```text
No file reads needed; using provided context only.
```

### 3. Extract Confirmed Items

Pull out:

* confirmed facts
* decisions made
* explicit constraints
* confirmed scope
* confirmed out-of-scope items

Do not include interpretation here unless labeled.

### 4. Extract Working Assumptions

Identify assumptions that are reasonable but not yet confirmed.

Each assumption should include:

* assumption
* why it is reasonable
* impact if wrong
* who should confirm, if known

### 5. Extract Open Questions

Create a consolidated open-question table.

Do not duplicate questions.

Use this format:

| Question | Why it matters | Owner / decision-maker | Current working assumption |
| -------- | -------------- | ---------------------- | -------------------------- |

If owner is unknown, write `TBD`.

### 6. Extract Dependencies

Identify dependencies across:

* product
* design
* engineering
* data model
* backend/API
* compliance/legal
* finance/accounting
* operations
* external vendors
* existing docs
* design canon
* RBAC
* notifications
* audit logging

Only include dependencies relevant to the current task.

### 7. Identify Risks

Flag risks such as:

* ambiguous state machine
* unclear permissions
* design drift
* scope creep
* missing data fields
* unclear source-of-truth
* untested operational edge cases
* unsupported workflow assumptions
* conflicting docs
* stale context

### 8. Recommend Document Updates

State which project artifacts should be updated.

Examples:

* root `CLAUDE.md`
* skill file
* PRD
* PRD addendum
* wireframe spec
* strategy doc
* context doc
* design canon
* RBAC spec
* mockup implementation notes
* open questions log

For each update, specify:

* file/doc to update
* section to update
* what to add/change
* whether it is confirmed, assumption, or proposed

### 9. Produce a Compact Summary

End with a short summary that can be pasted into a project doc.

Keep it concise.

## Distillation Output Format

When invoked, respond using this structure:

1. Distillation target
2. Context used
3. Context budget
4. Confirmed facts
5. Decisions made
6. Working assumptions
7. Open questions
8. Dependencies
9. Risks / guardrails
10. Out of scope
11. Recommended document updates
12. Compact project summary
13. Next smallest useful step

## Compact Project Summary Format

When asked for a compact summary, use:

```markdown
## Context Summary

### Confirmed
- ...

### Decisions
- ...

### Working Assumptions
- ...

### Open Questions
- ...

### Dependencies
- ...

### Out of Scope
- ...

### Recommended Updates
- ...
```

## Handling Long Conversations

For long conversations:

1. Do not summarize every message.
2. Extract decisions and durable context only.
3. Preserve the sequence only when it matters.
4. Collapse repeated discussion into one clean point.
5. Separate corrections from original assumptions.
6. Prefer the latest explicit user correction over earlier assistant interpretation.
7. Identify where the assistant previously introduced unsupported scope.
8. Include final resolved understanding.

Example:

```text
Earlier assumption: investor activation view includes loan-level table.
Correction: investor activation view is activation-level only unless explicitly scoped otherwise.
Final understanding: remove loan-level investor table from current Token Ops mockup scope.
```

## Handling Conflicting Context

If sources conflict:

1. Prefer latest explicit user correction.
2. Prefer canonical project docs over exploratory notes.
3. Prefer final requirements docs over earlier drafts where explicitly instructed.
4. If conflict remains, preserve as open question.
5. Do not resolve silently.

## Handling Proposed New Ideas

If a new idea follows naturally from prior context but was not explicitly approved, label it as:

```text
Proposed Option
```

For each proposed option, include:

* why it follows from existing context
* what problem it solves
* why it is not yet confirmed
* what decision is needed

Do not include proposed options in P0 unless the user explicitly approves.

## Context Memory Hygiene

Do not bloat project memory.

When deciding what to preserve, ask:

* Will this matter in future work?
* Does this affect product behavior?
* Does this affect implementation?
* Does this affect permissions?
* Does this affect UX or mockup behavior?
* Does this resolve a prior ambiguity?
* Does this prevent Claude from making a known mistake again?

If the answer is no, omit it.

## Interaction With Other Skills

Use other skills only when needed:

* `/feature-planning` for broad feature planning
* `/prd-builder` for PRDs, addenda, screen specs, and requirements docs
* `/mockup-implementation` for front-end mockup changes
* `/token-ops-module` for Token Operations
* `/rbac-permissions` for Platform Operator and LOC RBAC

Do not load other skills unless they are relevant.

## Completion Checklist

Before finishing, confirm:

* only relevant context was used
* unnecessary files were not read
* confirmed facts and assumptions are separated
* open questions are deduplicated
* scope creep is avoided
* latest user corrections override earlier assumptions
* proposed ideas are labeled
* document updates are clear
* compact summary is usable
* next step is small and actionable

