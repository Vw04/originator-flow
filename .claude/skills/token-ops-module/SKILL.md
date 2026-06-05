---

description: Use this when planning, designing, documenting, reviewing, or implementing Homium Token Operations workflows, including activations, investor wallets, fund signatures, batching, issuance, residual balances, source-of-funds tracking, program tokens, investor approvals, and token operations mockups/PRDs.
argument-hint: "[token operations workflow, screen, PRD, or module]"
--------------------------------------------------------------------

# Token Operations Module Skill

## Purpose

Use this skill for all work related to the Homium Token Operations module.

This module includes:

* Activations
* Investor wallet setup and wallet authorization
* Investor activation approval
* Fund signature and system/programmatic signature logic
* Batch queue and batch assembly
* Manual issuance triggering
* Destroy and issuance files
* Source-of-funds tracking
* Residual balance handling
* Program-specific asset tokens
* Investor-facing activation views
* Platform operator workflows
* Token operations PRDs, wireframes, and mockups

The goal is to translate complex capital deployment and token operations procedures into clear, functional, auditable, scalable product workflows.

## Core Product Context

Homium offers zero-interest, 1:1, fixed-percentage shared appreciation second mortgages. Homium loans are funded through program-specific capital pools and may be represented through program-specific token structures.

Current active-style token naming should assume program-specific tokens, such as:

* `HCAthhi` and `HOMthhi` for Tobias Harris Homeownership Initiative
* `HCAudf` and `HOMudf` for Utah Dream Fund

Do not assume legacy tokens like HIL or HCAI are active unless explicitly asked.

Token Operations exists to manage the operational connection between:

1. Investor capital and wallets
2. Program-specific activations
3. Loans/originations assigned to activations
4. Batch assembly
5. A share destruction / H share issuance
6. Transfer agent workflows
7. Investor and Homium approvals
8. Accounting, audit, and reconciliation needs

## Primary Platform Users

Do not confuse Vincent, the Claude Code user, with the platform users of this module.

Token Operations is primarily used by:

1. Homium platform operator users
2. Investor users

Mortgage origination users should not have access or visibility into Token Operations.

### Platform Operator Users

Platform operators are Homium-side users. They are the primary operational users of this module.

They may need to:

* create and edit activations
* select investors
* select investor wallets
* set activation amount, expiration, notes, custom name, asset token, and restrictions
* assign eligible loans/originations to activations
* send loans to the batch ready queue
* assemble batches
* trigger issuance
* monitor wallet, signature, batch, source-of-funds, and residual issues
* review audit logs
* manage exceptions

Super admin has full access by default.

Other platform operator users have custom permissions based on their real-world business role, responsibilities, and granted permissions. Do not assume simple static roles.

### Investor Users

Investor users are external or investor-side users.

They may be sophisticated finance, housing, accounting, legal, tax, philanthropy, or capital markets stakeholders.

For this module, they primarily need to:

* connect or manage their wallet
* review activations assigned to them
* approve/sign activations through the platform with connected wallet
* see activation-level status, funding, wallet, and token information
* respond to action-required notifications

Investor users generally do not initiate activations in MVP unless explicitly scoped.

### Excluded Platform Users

Mortgage origination users do not have access or visibility into Token Operations.

This includes:

* Loan Officers
* branch support staff
* processors
* other originator-side users

Do not expose activations, investor wallets, batch issuance, transfer-agent workflows, or token operations mechanics to originator users unless explicitly requested.


## Module Boundaries

Token Operations should cover:

* activation lifecycle
* wallet lifecycle
* batching and issuance lifecycle
* investor approval/signature workflows
* platform operator approval/signature workflows
* source-of-funds and residual-balance modeling
* audit and operational visibility

Token Operations should not become the full investor portal.

Investor portfolio summaries, broad capital reporting, full impact reporting, and fund accounting dashboards may be referenced as dependencies but should not be overbuilt inside this module unless explicitly requested.

## Key Entities

When working on this module, reason in terms of these entities:

| Entity                    | Meaning                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| Program                   | A program-specific capital pool or initiative, such as THHI or UDF                               |
| Asset Token               | Program-specific A/share-style token, such as HCAthhi or HCAudf                                  |
| HOM Token                 | Program-specific H/share-style token, such as HOMthhi or HOMudf                                  |
| Investor                  | Person or entity funding an activation                                                           |
| Investor Wallet           | Wallet used by the investor for token authorization/signature                                    |
| Activation                | Operational container linking investor wallet, program, amount, restrictions, and eligible loans |
| Origination / Loan / Deal | Borrower loan that can be assigned to an activation and later batched                            |
| Batch                     | Program-specific group of loans prepared for issuance                                            |
| Ready Queue               | Intermediate state for loans ready to be batched                                                 |
| Issuance Trigger          | Manual permissioned action that initiates transfer-agent issuance workflow                       |
| Residual Balance          | Remaining activation capacity too small or otherwise inefficient to deploy cleanly               |

## Activation Lifecycle

Treat activations as state-machine driven.

Core activation states:

* Draft
* Unconfirmed
* Awaiting Fund Signature
* Awaiting Investor Signature
* Awaiting Signatures
* Open
* Closed
* Canceled
* Revoked

Rules:

* An activation cannot become Open until required signatures are complete.
* Investor signature requires the investor wallet to be connected.
* If investor wallet is not connected, the approval process pauses until wallet connection is complete.
* Fund signature is performed by a permissioned Homium platform operator with fund-signing authority.
* The fund wallet is currently a single Homium-level wallet for all programs.
* Account Manager / Programmatic signature is a system action, not a human action.
* Programmatic signature fires automatically on Fund signature approval.
* Investor and Fund signatures may happen in either order.
* Cancel and Revoke are different actions.
* Cancel generally applies before an activation is Open.
* Revoke applies after an activation is Open and is higher stakes.
* Revoke should require an explicit permission flag.
* When activation is canceled or revoked, assigned originations are released back to the eligible pool.
* Released originations should return to the pool ordered by oldest submitted-for-approval date, unless manually adjusted by ops.

When activation state changes, specify:

* who triggered it
* required permissions
* preconditions
* downstream effects
* audit event
* user-facing status label

## Signature and Permission Model

Do not treat legacy signature names as static job titles. Translate them into permissioned actions.

There are three signing/action concepts:

### Investor Signature

* Performed by investor user
* Requires connected wallet
* Occurs through the Homium platform plus wallet signer
* Not a simple app-only button
* Should only be executable from investor session or future approved impersonation flow

### Fund Signature

* Performed by Homium platform operator with fund-signing permission
* Uses designated Homium fund/trust wallet
* Currently handled by specific permissioned operators
* Triggers programmatic Account Manager signature automatically

### Programmatic / Account Manager Signature

* System wallet action
* No human has direct wallet access
* Fires automatically when required system conditions are met
* Used for system actions such as deal contract creation, value adjustment, mint commands, or related programmatic actions

Platform operator permissions should include:

* view
* edit/create
* approve/cancel
* revoke
* batch trigger

Permissions may need to be scoped separately for:

* Fund signature authority
* Admin/platform operations authority
* Batch/issuance authority

Super admin has full access.

## Wallet Lifecycle

Wallets are tightly coupled to activation approval and token authorization.

Wallet states may include:

* Not Connected
* Connection Pending
* Connected
* Authorization Pending
* Authorized
* Authorization Failed
* Authorization Revoked
* Wallet Changed
* Disconnected

Rules:

* Investor must have wallet connected to approve/sign activation.
* Activation creation should require a selected investor wallet when wallet is required for that activation.
* Wallet authorization must match the relevant program token.
* A wallet may support multiple program token authorizations.
* If investor removes or disconnects a wallet attached to an Open activation, flag the activation and treat it as requiring revocation/reconfirmation.
* If wallet authorization expires or is revoked on-chain, affected activations must be flagged.
* Wallet changes on Unconfirmed activations may be editable.
* Wallet changes on Open activations should require a revoke or formal amendment path.
* Keep unresolved wallet lifecycle questions in a tabled-items list.

## Batch and Issuance Lifecycle

Use the newer two-layer batch model.

Do not assume automatic joining into an open batch.

### Layer 1 — Ready Queue

Loans enter the Ready Queue from the loan-level flow.

Current intended flow:

1. Loan reaches batchable state.
2. A platform operator sees the loan-level option to send it to the batch queue.
3. Clicking this action moves the loan into the Token Operations Ready Queue.
4. Ready Queue organizes loans by program and other filters.
5. Ops reviews eligible loans before assembling a batch.

Ready Queue should support:

* program filter or tabs
* loan/deal ID
* program
* activation
* investor
* loan amount
* activation capacity impact
* relevant underwriting tags
* days in queue
* restriction warnings
* action to create or add to an assembled batch

### Layer 2 — Assembled Batches

Batches are manually assembled from Ready Queue loans.

Rules:

* Batches must be program-specific.
* Do not mix programs in a batch.
* Program organization must scale beyond two programs.
* Program tabs or filters are preferred over fixed two-column layouts.
* Batch naming should be program-prefixed and year-sequential when useful, e.g. `THHI-BATCH-2026-001`.
* H rate must be surfaced prominently at batch creation and issuance.
* H rate is program-specific.
* H rate should include last-updated date and staleness warning if applicable.
* Restriction mismatches should flag warnings that ops can override with appropriate permissions/reasoning.
* Loan tags may need to be added by underwriting and surfaced in the Ready Queue.

Batch statuses may include:

* Assembled
* Pending Issuance
* Issued
* Rejected

### Manual Issuance Trigger

Manual triggering is separate from batch creation.

Triggering issuance should require a separate `batch trigger` permission flag.

When a permissioned platform operator triggers issuance, the platform should:

* create the transfer-agent workflow/ticket, if in scope
* generate one destroy file
* generate one issuance file
* move batch to Pending Issuance
* preserve generated files as batch artifacts
* audit the action

The detailed Asana ticket structure and transfer agent template are out of scope unless explicitly requested.

The destroy/issuance files should conceptually include fields such as:

* investor registered holder name
* investor wallet ID
* investor ID
* share class
* issuance date
* number of A shares / HCA tokens burned
* number of H shares / HOM tokens issued
* H value price per unit
* asset token
* program
* batch ID

## Balance and Reconciliation Logic

Model the operational movement of balances explicitly.

Important activation-level values:

* activation amount
* reserved
* claimed
* minted
* asset shares
* available

When designing or reviewing flows, define when each balance changes.

Suggested conceptual flow:

1. Activation created with total activation amount.
2. Loan assigned to activation increases reserved amount.
3. Loan sent to Ready Queue remains tied to activation but not yet minted.
4. Loan added to assembled batch may move to claimed or equivalent intermediate state.
5. Issuance trigger starts external processing.
6. Batch marked issued moves relevant amount to minted.
7. Available capacity updates based on amount, reserved, claimed, and minted.

If batch is rejected or loan is removed from batch:

* reverse the relevant claimed/in-batch state
* return loan to Ready Queue or eligible pool as appropriate
* preserve audit trail

Do not leave balance mechanics implicit.

## Source of Funds and Residual Balances

One core improvement is direct tracking of sources of funds.

The system should ultimately track:

* cash from fund deposit accounts
* A shares / HCA token balances
* investor wallet balances
* program-specific funding source
* activation-level funding capacity
* residual balances

Residual balance scenario:

* An activation may have a small remaining amount that cannot fully cover another loan.
* Residuals may require combining funding across activations or wallets.
* Potential solution paths include:

  * allowing multiple wallets/activations to contribute to a single origination
  * dynamic allocation of loans across activations
  * flex cash/credit accounts associated with loans
  * explicit source-of-funds modeling before allocation

Assume proportional HOM token issuance based on contribution amount and H value only as a working assumption.

Keep this flagged for Mike/Finance confirmation before designing final multi-activation draw UI or accounting treatment.

## Program and Restriction Logic

Program should be treated as a first-class organizing dimension.

Program may govern:

* asset token
* HOM token
* H value / NAV
* last valuation update date
* eligible geographies
* eligible borrower/loan criteria
* minimum loan amount
* lock-up or restriction period
* investor roster
* batch naming convention
* reporting requirements

Restrictions may include:

* market/geography
* program
* loan characteristics
* underwriting tags
* green qualification
* HERS rating
* down payment program attachment
* investor-specific requirements

Restriction validation should:

* run during activation creation/editing where applicable
* run during batch assembly
* flag mismatches clearly
* allow ops override where scoped
* require reason/audit trail for override

Do not invent final restriction fields if not known. Flag missing fields as dependencies.

## Investor View Scope

Investor-facing views for this module are activation/wallet-specific, not full investor portal views.

Do not add broad investor portfolio reporting unless explicitly requested.

Investor activation view should focus on activation-level data such as:

* activation number
* activation name
* asset token
* activation status
* activation amount
* reserved
* claimed
* minted
* asset shares
* available
* selected investor wallet
* expiry date
* notes
* restrictions
* approval/signature action when needed

Do not add a detailed investor loan-level table unless explicitly requested.

## Platform Operator View Scope

Platform operator views may include:

* Token Operations overview
* Activations
* Batches & Issuance
* Wallets
* Audit Log
* Work Queue / Attention Needed
* Ready Queue
* Assembled Batches
* Authorized / Pending Issuance
* Issued Batches

The module can combine Activations, Batches & Issuance, Wallets, and Audit Log under a single Token Operations area.

Avoid crowding the UI with too many side panels. Prefer main-page tabs, phase strips, summary cards, filters, and contextual work queues.

## Work Queue and Notifications

Work queue should be state-driven and persistent.

Notification bell should be event-driven.

Potential operator signals:

* investor signature pending
* fund signature pending
* wallet disconnected
* wallet authorization failed
* activation approaching expiry
* activation expired with available capacity
* residual balance detected
* ready queue aging
* batch pending issuance
* rejected batch
* H rate stale
* source-of-funds mismatch

Investor action signal:

* activation requires investor signature
* wallet connection required
* wallet authorization issue

Permission-filtered display of signals can be tabled if not yet finalized.

## Audit and Compliance

Token Operations is audit-sensitive.

Important actions should create audit events:

* activation created
* activation edited
* investor wallet selected
* fund signature completed
* programmatic signature fired
* investor signature completed
* activation opened
* activation canceled
* activation revoked
* wallet disconnected
* wallet authorization failed/revoked
* loan assigned to activation
* loan sent to Ready Queue
* batch assembled
* restriction warning overridden
* issuance triggered
* destroy/issuance files generated
* batch marked issued
* batch rejected
* H rate overridden

Audit log should capture:

* actor
* role/permission
* timestamp
* entity
* previous value
* new value
* reason/notes where relevant
* source system
* linked activation/batch/wallet/loan

Activations and Batches may have separate audit log views or buttons.

## Required Workflow When Invoked

When this skill is invoked, follow this sequence.

### 1. Restate the Workstream

Identify which Token Operations workstream is being handled:

* activations
* wallets
* signatures
* batching
* issuance
* residual balances
* source of funds
* investor view
* platform operator view
* PRD
* wireframe
* mockup implementation
* audit/compliance
* permissions/RBAC

### 2. State Current Assumptions

List assumptions briefly.

Separate:

* confirmed assumptions
* working assumptions
* flagged questions
* out-of-scope items

### 3. Create Context Budget

Before reading files, provide:

| Category          | Required Output                                           |
| ----------------- | --------------------------------------------------------- |
| Objective         | What needs to be produced?                                |
| Likely files      | Which docs/mockups/code files are probably needed?        |
| Max initial reads | Usually 3–7 files                                         |
| Search terms      | Terms to search before reading                            |
| Avoid reading     | Assets, unrelated mockups, generated files, broad folders |
| Stop condition    | When there is enough context to produce the next batch    |

Use search before broad file reads.

Do not read the entire project unless explicitly asked.

### 4. Define the Operational Flow

For any workflow, specify:

* entry point
* user
* permissions
* state transition
* required fields
* validation
* downstream effects
* audit event
* error state
* empty state
* unresolved questions

### 5. Define UI / Screen Impact

For mockup or UI work, identify:

* screen or tab
* primary user
* primary action
* table columns
* filters
* CTAs
* button states
* status badges
* validation messages
* empty states
* error states
* audit links
* permission gates

### 6. Define PRD Impact

For PRD work, include:

1. Problem
2. Users
3. Goals
4. Non-goals
5. Current workflow
6. Proposed workflow
7. Entity model
8. State machine
9. Permission model
10. Screen specs
11. Validation rules
12. Notifications/work queue
13. Audit requirements
14. Dependencies
15. P0/P1/P2 priority
16. Open questions

### 7. Work in Batches

Use small implementation/planning batches.

Suggested batches:

#### Batch 1 — Activation Mechanics

State machine, signatures, permissions, activation detail.

#### Batch 2 — Wallet Mechanics

Wallet connection, authorization, failure states, investor approval.

#### Batch 3 — Batch and Issuance Mechanics

Ready Queue, assembled batches, trigger issuance, issuance artifacts.

#### Batch 4 — Residuals and Source of Funds

Funding source model, residual flagging, multi-wallet/multi-activation assumptions.

#### Batch 5 — UI and Mockup Integration

Main Token Operations layout, tabs, tables, forms, work queue, audit links.

#### Batch 6 — Validation and Handoff

PRD cleanup, engineering notes, open questions, QA checklist.

Do not try to solve every layer in one response.

## Output Format

When invoked, respond using this structure:

1. Workstream
2. Objective
3. Confirmed assumptions
4. Working assumptions / flagged questions
5. Context budget
6. Operational flow
7. UI / PRD impact
8. Permission and audit implications
9. Recommended batch plan
10. Next smallest useful step

## Standing Open Questions to Preserve

Keep a table of unresolved or tabled questions. Common tabled items include:

* exact wallet re-authentication requirements after wallet removal/reconnection
* detailed permission-filtering logic for work queue signals
* final impersonation behavior for investor views
* exact audit log screen placement
* final source-of-funds accounting model
* proportional HOM issuance treatment for multi-wallet/multi-activation funding
* final transfer agent file/template details
* final restriction/tag data model
* final H valuation override policy

Do not repeatedly ask the same tabled question. Preserve it and move forward with the agreed working assumption.

