# Homium Token Operations Module — Product Requirements Document

**Activations · Batches & Issuance · Wallets**

---

## 1. Document Control

| Field | Value |
|---|---|
| **Module** | Token Operations |
| **Version** | v1.0 — First Real Iteration (aggregated) |
| **Date** | 2026-06-05 |
| **Status** | Draft — for team review |
| **Owner** | Product (Vincent) |
| **Primary users** | Homium Platform Operators; Investor users |

### 1.1 Source documents aggregated

This PRD consolidates and reconciles five prior artifacts into a single decision-useful document. The four archived markdown docs remain in `docs/prds/archive/` for provenance.

| Source | Date | Contribution |
|---|---|---|
| `homium_activations_prd_v1.md` | May 28 | Objective, core concepts, base data model, flows, RBAC matrix |
| `homium_activations_prd_addendum_A.md` | May 28 | State machine, two-axis RBAC, balance lifecycle, Program-as-entity, notification events, work queue, audit log, impersonation |
| `homium_activations_prd_addendum_B.md` | May 28 | Implementation-ready screen specs (superseded base PRD §7) |
| `homium_activations_tabled_items_review.md` | May 28 | 17 open items (T-1..T-17) by owner/priority |
| `homium_v5_wireframe.html` | Jun 4 | **Newest realized design** — canonical UI direction |

### 1.2 Supersession & canon

- The **v5 wireframe (Jun 4) is canonical** wherever it conflicts with the earlier May 28 PRDs. PRD mechanics fill gaps the wireframe does not depict.
- The most material override is the **batch lifecycle**, which is now a **4-stage** model (§10.2). The earlier 3-stage model is retired.
- Every wireframe-over-PRD override is logged in **Appendix B — Reconciliation Log**.

### 1.3 Priority legend

| Tag | Meaning |
|---|---|
| **P0** | First real iteration. Must ship to operate the module manually end-to-end. |
| **P1** | Fast-follow operational quality. |
| **P2** | Advanced capital tooling; several items blocked by open decisions (Appendix A). |

---

## 2. Executive Summary

Token Operations is the operational backbone connecting **investor capital** to **deployed Homium loans** and the **on-chain tokens** that represent them. It replaces today's manual, email-and-spreadsheet process with a unified, permissioned, auditable workflow spanning three surfaces:

- **Activations** — signed investor capital tranches against which loans are drawn.
- **Batches & Issuance** — grouping funded loans and minting asset (H) tokens via the transfer agent.
- **Wallets** — investor wallet connection, authentication, and token authorization.

**Why now.** Today the system is manual and disconnected: capital in activations is not linked to verified cash, residual balances sit idle, investors operate entirely over email with no self-service view, and batch issuance / accounting handoff is unscalable. At scale this creates over-commitment risk, idle capital, and no audit trail.

**First-iteration goal (P0).** Operate the full lifecycle manually inside the platform: create activations, collect the three signatures, set up investor wallets, assemble loans into program-scoped batches, trigger issuance to the transfer agent, mint tokens, and record an immutable audit trail — with a basic investor-facing view for signing and monitoring.

---

## 3. Business Objective & Problem Statement

**Core problem.** The current process is manual and disconnected, with no unified operational view, no verified source-of-funds tracking, no investor-facing experience, and no tooling for residual capital or reallocation.

**Business consequences at scale:**

| Risk | Description |
|---|---|
| Operational risk | Capital in activations not linked to verified cash balances; over-commitment possible. |
| Residual capital inefficiency | Small remaining balances cannot be deployed; sit idle or expire unused. |
| No investor experience | Investors operate via email; no self-service view of capital, tokens, wallet status, or pending actions. |
| Manual overhead | Batch issuance, loan assignment, accounting handoff all manual and unscalable. |
| Data integrity | Stale Unconfirmed activations pollute the operational view; wallet errors have no recovery path. |

---

## 4. Core Concepts & Glossary

**Activation.** A signed investor capital tranche — a defined pool of capital from a specific investor, allocated to a specific Homium token program, linked to a verified on-chain wallet, against which individual loan originations are drawn and tokens minted. The operational unit connecting investor capital to deployed loans.

**Entity hierarchy.**

```
Investor Entity
  └── Wallet (on-chain, authenticated)
        └── Token Authorization (per program token)
              └── Activation (capital tranche)
                    └── Originations (funded loans)
                          └── Batch (transfer-agent issuance grouping)
```

**Program (first-class entity).** Programs govern activation and batch behavior; they are not just a field on an activation. Each program owns its tokens, minimum loan amount, lock-up term, eligible geographies, and current H valuation. Active/known programs: **THHI, UDF** (live), plus **DCDF, KY, MI, CO** in the program selector.

**Token set.**

| Token | Class | Type | Program |
|---|---|---|---|
| HCAthhi | Class A | Funding | THHI |
| HOMthhi | Class H | Asset | THHI |
| HCAudf | Class A | Funding | UDF |
| HOMudf | Class H | Asset | UDF |

**Token economics.**
- HCA (Class A / funding) tokens are purchased by investors at **$1.10** and converted at **$1.00** at minting — a built-in cost of program participation recognized at conversion.
- HOM (Class H / asset) token price is the **NAV of the loan pool**, adjusted quarterly via **Case-Shiller** MSA home-price data for the origination geographies.

**Order Number = Activation Number.** The `Order Number` on a batch/issuance record maps directly to the `Activation Number` — the primary linking key between the issuance layer and the capital layer.

**Balance components.** `reserved` (assigned, not batched) · `claimed` (in a triggered batch) · `minted` (issued on-chain) · `available` (uncommitted).

---

## 5. Personas & Roles

> Per project context, do not conflate the platform's end users. Token Operations serves two live user groups plus one future operator sub-role.

### 5.1 Homium Operators (primary)

Internal users who deploy investor capital into funded loans, maintain clean activation records, manage wallets on behalf of investors, create and trigger batches, and resolve exceptions.

- `sys_admin` — full access; cannot be restricted; sole role able to confirm/mint and view full audit/export.
- `operator` — custom-permissioned (account managers, finance ops, auditors). Permissions are **per-user**, not by title (see §6).

**Core needs:** unified operational view across investors/programs/states; clear action signals (pending signatures, expiring capacity, eligible unbatched loans, wallet errors); end-to-end activation tools; batch pipeline; wallet management.

### 5.2 Investor users (secondary)

Housing-finance agency staff, CFOs, foundations, impact/philanthropic investors, capital-markets professionals. Within Token Operations their scope is deliberately narrow:

- Complete one-time wallet setup (connect → authenticate → authorize tokens).
- Counter-sign activations Homium creates (on-chain signature).
- Monitor own committed capital, minted tokens, available capacity, and restriction status.

**Out of scope for the investor here** (belongs to a future Investor module): portfolio-wide summaries, fund-level P&L, impact metrics, other investors' positions.

### 5.3 Future: Account-Manager-scoped operator (P1)

A filtered operator view scoped to assigned investor relationships. Not built in P0, but the data model and permission structure must not foreclose it.

### 5.4 Originator users

**Zero access.** Activations, Batches, and Wallets are not visible in originator navigation. No RBAC configuration can grant originator users access to these modules.

---

## 6. RBAC Model

Supersedes the base PRD's role-table RBAC. Operator permissions are **custom per user**, configured by `sys_admin`, organized along **two axes** and a set of **action tiers**, plus a discrete high-stakes flag.

### 6.1 Two permission axes

| Axis | Controls |
|---|---|
| **Fund Signature Authority** | Ability to sign as the Fund on activation approvals (on-chain action with the Homium fund/trust wallet). |
| **Admin Authority** | Platform-side activation management actions. |

### 6.2 Action tiers (applied per axis)

| Tier | Includes |
|---|---|
| View | Read-only across activations, wallets, batches. |
| Edit | View + create/edit activations (investor, amount, expiry, token, wallet, restrictions, name, notes; add/remove deals). |
| Approve / Cancel | Edit + sign and cancel activations. |
| Revoke | Approve/Cancel + revoke Open activations (separate explicit grant). |

### 6.3 Discrete flags

- **Batch Trigger** — explicit yes/no flag to trigger batch issuance (creates the Asana transfer-agent ticket and the Destroy/Issuance files). `sys_admin` has it by default; others require explicit grant.

### 6.4 Example operator profiles

| Profile | Fund Sig Authority | Admin Authority |
|---|---|---|
| CFO / Mike | Approve + Revoke | Approve + Revoke |
| Account Manager | None | Approve / Cancel |
| Finance Operations | None | Edit |
| Read-only Auditor | View | View |
| Senior Ops | Approve | Approve / Cancel |

### 6.5 Impersonation (P1)

`sys_admin` can view the exact investor UI and take any investor action **except the wallet signature** (requires the investor's private key). The "Approve Activation" button is shown but permanently disabled in impersonation, labeled *"Requires investor's wallet signature — cannot be performed on behalf of investor."* All impersonation actions are logged (actor, impersonated investor, action, timestamp) and flagged distinctly in the audit log. Full impersonation UX is defined in a separate module spec (T-9).

---

## 7. Scope

### 7.1 In scope

- Activations: list, detail, create, edit, three-signature flow, cancel/revoke. **(P0)**
- Batches: Ready Queue → Assembled → Authorized to Mint → Issued, including minting. **(P0)**
- Wallets: connect, authenticate, token authorization, error recovery. **(P0)**
- Investor-facing activation + wallet views (own data only). **(P0)**
- Audit log (core events) + notification events. **(P0)**
- Ops summary metrics + attention signals / Work Queue. **(P0 signals; P1 persistent panel)**
- Residual flagging + resolution (Mark Resolved / Revoke & Re-create). **(P1)**
- Investor Cash Balances (static, derived from activations). **(P1)**
- Residual reallocation: multi-activation draw, flex credit; live WAB feed; ops cash view. **(P2)**

### 7.2 Out of scope

- Investor portfolio module (total capital, fund-level P&L, impact metrics).
- Redemptions.
- The notification module architecture itself (integration only).
- Originator-facing views.
- Direct accounting-system integration (design data events to support a future feed).
- Program setup module and investor onboarding/KYC module (separate specs — T-5, T-6).

---

## 8. Information Architecture & Navigation

**Top-level nav:** Dashboard · Applications · Originations · **Token Ops** · Administration.

**Token Operations page:**
- Header: title "Token Operations", subtitle "Activations · Batches & Issuance · Wallets".
- Header actions: **Work Queue** (count badge) · **Audit Log**.
- Module tabs (pill style): **Activations** (badge "N need action") · **Batches & Issuance** (badge "N ready to mint") · **Wallets** (count badge).

**Program selector (hero tile).** Dark primary column with editable Token ID + Program Name, large **Current H Rate** display, and an optional staleness indicator ("93d stale — verify with Capital Markets"). Three stat columns: **Committed Capital** (open activations) · **Deployed (Minted)** (all time) · **Available Capital** (uncommitted). Program switcher pills: THHI, UDF, DCDF, KY, MI, CO + "Add Program". Stale programs show an orange dot/⚠. **(P0 selector; multi-program scaling P1)**

**Work Queue panel.** Right-side togglable panel; severity-ranked items (high/medium/low) with action deep-links. State-driven (persists while condition holds). See §11.7 and §14.

---

## 9. Workflows

### 9.1 Wallet setup — Investor (P0)

States: `Pending Authentication → Authenticated → Authorization in progress → Authorized` (error: `failed_to_add`).

1. Investor (or ops on their behalf) → Wallets → **Add Wallet**.
2. Provider picker: WalletConnect (QR), MetaMask (Installed badge if present), Binance, All Wallets (110+).
3. Connect → status **Pending Authentication**.
4. **Authenticate** = sign a Homium-generated message with the wallet's private key → **Authenticated**.
5. **Manage Token Authorization** → select relevant program tokens (e.g., THHI investor: HOMthhi + HCAthhi) → confirm on-chain tx → **Authorization in progress** → **Authorized** (N tokens).
6. Error path: `failed_to_add` → inline error + **Retry** (re-submits on-chain authorization).

### 9.2 Activation creation & three-signature approval (P0)

States: `Unconfirmed → Open` (then Partially Completed / Closed / Canceled / Revoked / Expired — §10.1).

**Three signers** — distinct on-chain keys abstracted into platform permissions:

| Signer | Nature | Actor | Trigger |
|---|---|---|---|
| **Fund** | On-chain (Homium fund/trust wallet) | Operator with Fund Sig authority | Manual in-platform |
| **Account Manager** | Programmatic system wallet (no human access) | System | **Auto-fires immediately on Fund signature** |
| **Investor** | On-chain (investor destination wallet) | Investor user, wallet connected | Manual in-platform; wallet must be connected |

**Sequencing:** Fund and Investor are order-independent; Account Manager auto-fires on Fund signature; all three required for **Open**. Most common blocking state: *Fund signed + AM auto-fired → awaiting Investor*. There is **no optimistic UI** — Open is only reached on confirmed signatures.

**Creation steps (ops):** select investor → system confirms ≥1 authenticated + token-authorized wallet → select program token → wallet dropdown filtered to wallets authorized for that token → set amount, expiry (≥ today+30d), optional restrictions/name/notes → Save → **Unconfirmed**.

**Investor signature flow:** notified via bell → opens detail → if wallet not connected, "Connect Wallet" prompt precedes "Approve Activation" → on approve, wallet prompts on-chain signature → platform records signature → if Fund+AM already complete, status → **Open** immediately.

### 9.3 Origination assignment to activation (P0)

1. Loan funded/completed in origination system.
2. Ops navigates to a target Open activation with sufficient `available`.
3. **Assign Loan** → select from eligible pool → validate `loan amount ≤ available`.
4. On assign: `available` ↓, `reserved` ↑; deal shows as Pending / Not Minted.

*Future automation candidate: system suggests best-fit activation by program + capacity (T not blocking).*

### 9.4 Batch lifecycle — 4 stages (P0) — **canonical**

> Replaces the earlier 3-stage model. See §10.2 for the state machine and Appendix B.

**Stage 0 — Loan-level trigger (upstream).** On a batchable funded loan's origination detail, **Send to Batch Queue** moves it into the Ready Queue (`ready_for_batch`). No batch created here.

**Stage 1 — Ready Queue.** Program-scoped pool of queued loans awaiting assembly. Ops selects loans **from a single program** → **Create Batch from Selected** → Assemble Batch modal (program + current H rate w/ staleness warning, selected-loan summary, optional activation-restriction validation, optional custom name) → batch created in **Assembled** with program-prefixed ID (e.g., `THHI-BATCH-2026-007`). Cross-program batches are never permitted.

**Stage 2 — Assembled.** Batch awaits a permissioned **Trigger Issuance** (Batch Trigger permission). Trigger:
- Creates an **Asana ticket** for the transfer agent.
- Generates a **Destroy file** (A-share burn instructions).
- Generates an **Issuance file** (H-share mint authorization).
- H rate is locked at trigger (read-only thereafter); >90d-old rate shows an amber verify-with-Capital-Markets warning.
- Add/Remove loans and Cancel Batch are available only in Assembled.

**Stage 3 — Authorized to Mint.** Transfer agent has approved ("A shares burned · H shares ready"). Ops mints **per loan** (Mint Loan) or **Mint Entire Batch**. **Partial minting is preserved** across sessions. Mint Status per loan: **Ready / Partially Minted (n/total) / Complete**. Minting confirmation captures settlement date and (sys_admin) H rate; any rate deviation from default requires a mandatory audit reason.

**Stage 4 — Issued.** Fully minted; settlement date + confirmed-by recorded. On issuance: activation `claimed → minted`; restriction period begins (`settlement date + program lock-up term`).

**Rejection:** transfer agent rejection → batch **Rejected**; loans revert `claimed → reserved` (return to Ready Queue); ops notified; **Resubmit** available.

### 9.5 Residual resolution (P1; advanced P2)

A residual flag fires when an Open/Partially Completed activation has `0 < available < program minimum loan amount`.

**P1 resolution options (wireframe modals):**
- **Mark Resolved** — exclude the residual from further deployment; issued loans remain intact; requires resolution reason (e.g., "Below minimum loan threshold") + Finance approval for the audit trail.
- **Revoke & Re-create at Adjusted Amount** — revoke and create a new activation at `minted + in-batch` only; issued loans stay intact; all parties re-sign.

**P2 advanced (blocked by T-12):**
- **Multi-activation draw** — one loan draws from multiple activations; H tokens split proportionally by USD contribution at the issuance rate. **Blocked** pending Finance sign-off on proportional split.
- **Flex Credit** — open an INC-sourced credit line against an activation to cover a shortfall; creates a `FlexCreditAccount`, logs an inter-company payable, retired by a future investor activation.

### 9.6 Cancel / Revoke & origination release (P0)

- **Cancel** — only from Unconfirmed (Admin: Approve/Cancel). Assigned originations release to the eligible pool.
- **Revoke** — from Open/Partially Completed (Admin: Revoke flag). Releases `reserved` originations to the eligible pool, ordered by `loanSubmittedForApprovalDate` ascending (manually reorderable). `minted` loans are unaffected.
- **Revoke requires batch cleanup first:** if `claimed > 0`, revoke is blocked — *"This activation has loans in active batches. Remove those loans from their batches before revoking."* Loans in a batch must be removed (revert `claimed → reserved`) before the activation can be revoked.

### 9.7 Activation amendment rules (P0/P1)

| Field | Unconfirmed | Open | Partially Completed |
|---|---|---|---|
| Investor | ✅ (resets signatures) | ❌ | ❌ |
| Amount | ✅ (resets signatures) | ✅ if ≥ minted+claimed+reserved | ✅ if ≥ minted+claimed+reserved |
| Expiry | ✅ | ✅ extension only | ✅ extension only |
| Program / Asset Token | ✅ (resets signatures) | ❌ | ❌ |
| Investor Wallet | ✅ (resets signatures) | ❌ | ❌ |
| Restrictions / Name / Notes | ✅ | ✅ | ✅ |
| Add/Remove Deals | N/A | ✅ (reserved only) | ✅ (reserved only) |

**Signature reset:** editing a material field (investor, amount, asset token, wallet) in Unconfirmed clears all signatures (warned before save). Material changes to an Open activation require revoke + re-sign, or a new activation for additional capital (T-8 confirmation).

### 9.8 Wallet lifecycle edge cases (P0 core; P1 detection)

- **Removal while linked to active activation:** permitted but reverts the activation to Unconfirmed and clears all signatures; both parties notified; blocked if `claimed > 0`.
- **Token authorization revoked/expired on-chain:** activation flagged "Wallet Authorization Issue", reverted to Unconfirmed, investor signature cleared; investor must re-authorize and re-sign. *On-chain check frequency/mechanism — T-2.*
- **Re-link of same wallet address:** whether full re-authentication is required or just re-signature — **T-1 (open)**.

---

## 10. State Machines

### 10.1 Activation states

| State | Description |
|---|---|
| `unconfirmed` | Created, awaiting signatures. |
| `open` | All three signatures complete; accepting assignments. |
| `partially_completed` | ≥1 origination minted, `available > 0`. **(P1)** |
| `closed` | `available = 0` or administratively closed. |
| `expired` | Expiry passed, `available > 0`, not manually closed. **(P1)** |
| `canceled` | Voided from Unconfirmed. |
| `revoked` | Closed from Open/Partially Completed by operator. |

**Transitions (summary):** `unconfirmed → open` (system, on 3rd signature) · `unconfirmed → canceled` (Admin Approve/Cancel; releases assigned loans) · `open → partially_completed` (system, on partial mint, P1) · `open → closed` (system at available=0, or manual Approve/Cancel) · `open → revoked` (Admin Revoke flag; releases reserved loans; blocked if claimed>0) · `open → expired` (nightly job, P1). Closed/Expired/Canceled/Revoked are terminal (sys_admin may reopen an expired one as a new activation, P1).

Every transition logs `fromState`, `toState`, `triggeredBy` (user ID or `system`), `timestamp`, optional `reason`, and `signerWalletAddress` for signature events. Audit is immutable, sys_admin-visible.

### 10.2 Batch states (4-stage, canonical)

| State | Meaning |
|---|---|
| `ready_for_batch` (loan-level) | Loan in the Ready Queue, not yet in a batch. |
| `assembled` | Batch created; awaiting Trigger Issuance. |
| `authorized_to_mint` | Triggered; transfer agent approved; A shares burned, H shares ready to mint (supports partial minting). |
| `issued` | Fully minted; settlement date + confirmer recorded. |
| `rejected` | Transfer agent rejected; loans returned to Ready Queue. |

*Mapping from legacy PRD: the old `pending_issuance` corresponds to the post-Trigger / `authorized_to_mint` window; the old "Mark Issued" is now the explicit per-loan/whole-batch **mint** step.*

### 10.3 Balance lifecycle & invariants

`available = activationAmount − reserved − claimed − minted`

| Event | Effect |
|---|---|
| Origination assigned | `reserved += amount`, `available −= amount` |
| Origination removed (pre-batch) | `reserved −= amount`, `available += amount` |
| Origination added to batch (triggered) | `reserved −= amount`, `claimed += amount` |
| Origination removed from batch | `claimed −= amount`, `reserved += amount` |
| Batch issued | `claimed −= total`, `minted += total` |
| Activation canceled/revoked | reserved loans released; balances reset |
| Batch rejected (incl. partial) | rejected loans `claimed → reserved`; approved loans `→ minted` |

**Invariants (API-enforced):** assign only if `available ≥ loan amount`; a loan can be batched only if its activation is Open/Partially Completed; `activationAmount` immutable once Open; `reserved + claimed + minted ≤ activationAmount` always.

**Residual auto-flag (P1):** `residualFlagged = true` when status Open/Partially Completed AND `0 < available < program.minimumLoanAmount`.

---

## 11. Screen Specifications

> Labels, columns, statuses, and modals reconcile to the v5 wireframe. All screens are **desktop-only** for v1 except the investor wallet-connect flow, which must function on mobile browsers (investors may use mobile wallets).

### 11.1 Activations List — Ops (P0)

- **Summary tiles (always visible):** Total Committed (P0) · Total Available (P0) · Total Minted all-time (P0) · Expiring ≤30 days (P1, amber if >0) · Eligible for Batching (P1, amber if >0, links to Batches).
- **Status pills/tabs (with counts):** Open (default) · Unconfirmed · Partial · Closed · Expired · Canceled · All.
- **Filters:** search (investor / activation ID / name); Program; Investor; Expiry range (Any / ≤30d / ≤90d). Active filters shown as removable chips.
- **Columns:** Activation # (+wallet ref) · Investor (+org) · Program (badge) · Amount · Available (amber if residual) · Minted · **Signatures** (✓/⏳ per signer) · Expiry (amber ≤30d w/ available>0; red if past) · Status · Actions (View).
- **Row badges:** `Open` (green), `Awaiting Investor Sig` / `Awaiting Fund Sig` / `Awaiting Signatures` (amber), `Residual` (amber, P1), `Expiring` (amber row highlight, P1).
- **Actions by status:** Unconfirmed → View/Edit/Sign(Fund)/Cancel · Open/Partial → View/Assign Loan/Revoke · terminal → View. Role-gated per §6.
- **+ New Activation** (Admin Edit) · **Audit Log** button. Server-side pagination (25/50/100).

### 11.2 Activation Detail — Ops (P0)

- **Header:** Activation #, custom name, program badge, status badge, created/modified.
- **Action bar (state + role gated):** Edit (Unconfirmed) · Sign as Fund (Unconfirmed + Fund pending + Fund authority) · Approve as Investor (always disabled in ops view — tooltip points to investor session/impersonation) · Cancel (Unconfirmed) · Close (Open/Partial) · Revoke (Open/Partial; disabled if claimed>0 with tooltip + batch link) · Export CSV · Program Report.
- **Signature status strip (3 blocks):** Fund (signer + timestamp) · Account Manager (System — subtext "Auto-fires on Fund signature") · Investor (signer + timestamp / "Pending" / "wallet not connected").
- **Activation Details card:** investor, asset token, amount, restrictions, expiry, notes, created/modified by.
- **Wallet & Capacity card (P1 bar):** wallet (truncated + copy); stacked capacity bar Minted / In-batch (claimed) / Reserved / Available with legend + totals. Residual variant: warning-styled card + "Residual balance — resolution required" with Mark Resolved / Revoke & Re-create.
- **Assigned Loans table:** Loan ID · Amount · H Tokens · Batch (link) · Batch Status (Issued / In Batch / Not Batched) · Mint State (Restricted / Unrestricted / Not Minted) · Remove (reserved only; validation blocks if claimed). **Assign Loan** button (Open/Partial, Admin Edit).
- **Unconfirmed variant:** amber banner "Awaiting investor signature…"; **Simulate Approval** (demo/UAT only — see §11.12).

### 11.3 Create / Edit Activation — Ops (P0)

Full-page, two-panel (form left ~60%, live preview right ~40%).

- **Investor & Program:** Investor (searchable, required) · Program Token (HOMthhi/HOMudf, required) · Investor Wallet (required, filtered to wallets authorized for the token; inline warning + "Set up wallet →" if none).
- **Details:** Amount (>$0, whole dollars) · Expiry (≥ today+30d) · Custom Name (≤50 chars) · Notes (≤500 chars).
- **Restrictions:** No Restrictions / Loan Program (→ program select) / Market (→ MSA multi-select from `eligibleGeographies`).
- **Preview & Signature Flow:** investor/program/wallet/amount/expiry + checklist (Fund — you · Account Manager — auto · Investor — sign on-chain).
- **Save** → `unconfirmed`; redirect to detail; toast "Fund signature required to proceed."
- **Edit mode:** investor/program/wallet locked once Open; amount validated ≥ deployed total; material edits in Unconfirmed warn about signature reset.

### 11.4 Batches & Issuance — Ops (P0)

**Stage metric tiles (clickable to filter):** Ready Queue (count) · Assembled · Authorized to Mint · Issued.

- **Stage 1 — Ready Queue:** program filter pills; columns ☐ · Loan ID · Program · Investor · Activation · Amount · Tags (pills) · Date Queued · Days in Queue (amber ≥14d, red ≥30d). Single-program selection enforced. **Create Batch from Selected** → Assemble modal. Row **Remove from Queue**.
- **Stage 2 — Assembled:** columns Batch ID · Program · #Loans · Total Value · H Rate (amber if stale) · Est. H Tokens · Assembled · Status · **Trigger** (Batch Trigger permission).
- **Stage 3 — Authorized to Mint:** info banner "Transfer agent authorized minting · A shares burned · H shares ready" + pending pill. Expandable batch rows → per-loan detail (Loan ID · Borrower · Amount · H Tokens · Wallet · Mint Status · Mint Loan). **Mint Entire Batch** per batch. Mint Status: Ready / Partially Minted (n/total) / Complete. Partial minting persisted.
- **Stage 4 — Issued:** columns Batch ID · Program · #Loans · Total Value · H Rate · H Tokens Minted · Settlement · Confirmed by · Report.
- **Audit Log** button (Batches log, separate from Activations log).

### 11.5 Batch Detail — Ops (P0)

- **Header:** program-prefixed Batch ID, program badge, status badge, created by/date.
- **Action bar:** Trigger Issuance (Assembled, Batch Trigger) · Resubmit (Rejected) · Add Loans / Remove Loans / Cancel Batch (Assembled) · Export CSV.
- **Cards:** Summary (program, #loans, total value, est H tokens) · H Rate (with staleness note) · Timeline (assembled / triggered / settlement).
- **Constituent Loans table:** Loan ID · Activation # (= Order Number, link) · Investor · Property Address · Amount · Tags · H Tokens · Investor Wallet · Remove (Assembled only).
- **Generated files (post-trigger):** Destroy Instructions `.xlsx` + Issuance Instructions `.xlsx` download links. File fields: registered holder name, wallet ID, investor ID, share class (A burn / H mint), issuance date, token count, H value per unit.
- **Rejected state:** red banner + "Returned to Queue" badges + Resubmit.

### 11.6 Wallets — Admin View (P0)

- **Filter pills/dropdowns:** All / per-program / Issues; search; investor; auth status.
- **Columns:** Wallet Name · Address (truncated + copy) · Investor · Auth (Authenticated / Pending Auth / failed_to_add) · Token Authorization (e.g., "4 Authorized" / "2 of 4" / "Token Error") · Programs · Activations · Action (Manage / Authenticate / Retry).
- **Failure rows** highlighted (error background). **Remove** blocked if linked to Open/Partial activation. Wallet-unreachable error surfaces provider reason verbatim + Retry; linked activation flagged "Wallet Unreachable".
- **Manage Token Authorization modal:** token table (Token · Name · Legal Entity · Type · Status) with checkboxes; on-chain confirmation step (gas warning) before submit.
- **Add Wallet flow:** (investor select if from All) → provider picker → connect → authenticate → authorize tokens.

### 11.7 Work Queue panel — Ops (P0 signals; P1 persistent panel)

Severity-ranked, state-driven items with deep-links. Signal set (severity / permission to act):

| Signal | Severity | Act requires |
|---|---|---|
| Fund signature required | High | Fund Sig: Approve |
| Investor signature pending | High | Any ops |
| Activation expiring ≤7d (≤30d = Medium) | High | Any ops |
| Residual balance flagged | Medium | Admin: Edit |
| Wallet authorization issue | High | Any ops |
| Wallet failed_to_add | Medium | Admin: Edit |
| Loans in Ready Queue >30d (>14d = Medium) | High | Any ops |
| Batch pending issuance > X days | Medium | Any ops |
| Batch rejected | High | Batch Trigger |
| H rate not updated >90d | Medium | Informational |

**Bell vs Work Queue:** bell = event-driven (fires once, clears when resolved); work queue = state-driven (persists while condition holds). Both reflect the same signal set.

### 11.8 Activations Dashboard — Investor (P0)

- **Summary tiles:** Total Committed · Total Minted · Available to Deploy · In Restriction Period.
- **Tabs:** All (default) · Open · **Awaiting Signature** (amber, count badge — primary action tab) · Closed.
- **Columns:** Activation · Program · Amount · Minted · Available · Status (investor-friendly labels) · Action ("Sign Now" amber / "View").
- **Investor-facing status mapping:** Unconfirmed+investor-pending → "Action Required — Sign Now"; Unconfirmed+fund-pending → "Pending Setup"; Open/Partial → "Active"; Closed → "Completed"; Expired → "Expired"; Canceled/Revoked → "Closed". No Residual badge. No create button.

### 11.9 Activation Detail — Investor (P0)

- **Signature prompt card (conditional, amber):** "Your signature is required…" + amount/program/wallet/expiry. Wallet connected → "Approve Activation"; not connected → "Connect Wallet" first.
- **Approve flow:** confirmation modal ("…authorize Homium to mint [token]… on-chain action") → wallet sign → on success status → Open + toast.
- **Activation Details card** (read-only) + **Wallet & Funding card** (Reserved / Claimed / Minted (+H amount) / Available).
- **Loans (anonymized):** property address, employment type, income range, FICO band, amount, H tokens, status, restriction expiry — **no name, SSN, DOB, or contact info**.

### 11.10 Wallets — Investor (P0)

Card-per-wallet: name, address (copy), auth badge, authorized-token pills, active programs, linked-activation count. Actions: Manage Authorizations (own wallets only) · Rename · Retry (on failed_to_add). Empty state prompts first wallet add. Token Authorization modal shows only tokens for the investor's enrolled programs.

### 11.11 Cash Balances — Investor static (P1) / Ops live (P2)

- **Investor (P1, static from activations):** per-program card — Capital Committed · Deployed (Minted) · Available to Deploy · In Restriction Period. HCA note: "Class A tokens purchased at $1.10, converted at $1.00 at minting." No WAB data in P1.
- **Ops (P2, live feed):** all investors; adds WAB Cash Balance, Cash Reserve Floor (sys_admin-set), Allocatable Cash, HCA Token Balance, "Allocate to New Activation"; mismatch/floor warnings.

### 11.12 Modals catalog

Trigger Issuance · Mint Entire Batch / Complete Remaining · Assemble Batch · Assign Loan from Queue · Revoke · Cancel · Close Residual (Mark Resolved) · Revoke & Re-create at Adjusted Amount · Manage Token Authorization · Add Wallet (3-step: Connect / Authenticate / Authorize) · Program Report (Activation Lifecycle / Capital Deployment Summary; PDF/CSV/Excel) · **Simulate Investor Approval** (*demo/UAT only — not a production signing path; shows the connect → sign → open flow without a real on-chain signature*).

### 11.13 Reallocation Tool — Ops (P2)

Source activation (residual) → review reserved loans → target activation(s). Single move requires target `available ≥ amount`; multi-activation draw shows live draw math and is **blocked pending T-12**. Flex Credit panel: open INC-sourced line, create `FlexCreditAccount`, log inter-company payable, increase linked activation `available`.

### 11.14 Audit Log (P0)

Immutable, sys_admin-visible (read-only for other ops; hidden from investors). Filters: Event Type (All / Status Changes / Signatures / Batch Events / Minting Events) · date · search. Columns: Timestamp (monospace) · Event Type · Actor · Entity · Detail. Export CSV (sys_admin). Full screen spec tabled (T-7); core auditable events per §13.

---

## 12. Data Model

> P0 unless noted. Field names quoted from source docs.

### 12.1 Activation
`activationNumber` · `name?` · `investorId` · `programId` · `programToken` (HOMthhi/HOMudf) · `walletAddress` · `activationAmount` (immutable once Open) · `reserved` · `claimed` · `minted` · `available` · `expiryDate` · `restrictions` · `notes?` · `status` (§10.1; adds `partially_completed`, `expired`, P1) · `residualFlagged` (P1) · `sourceFundsWABAccountId` (P2) · `sourceFundsHCABalance` (P2) · created/modified by+date · signatures (fund/AM/investor: signer, wallet, timestamp).

### 12.2 Origination / Deal
`loanId` · `activationId` · `amount` · `hTokens` · `batchStatus` (adds `ready_for_batch`, `in_batch`) · `loanTags[]` (underwriting-applied; enum TBD — T-16) · `loanSubmittedForApprovalDate` · `propertyAddress` · `restrictionExpiryDate` · `mintState`. P2 multi-draw: `activationDraws[]` { `activationId`, `amount`, `hTokensAllocated` (⚑ T-12), `walletAddress` }.

### 12.3 Batch
`batchId` (program-prefixed, sequential per program/year) · `programId` · `orderNumber` (= Activation Number) · `loanIds[]` · `totalValue` · `status` (§10.2) · `hRateAtAssembly` · `hRateAtIssuance` · `estHTokens` / `finalHTokens` · `settlementDate` · `restrictionExpiryDate` · `asanaTicketRef` · `taRef` · `destroyFileUrl` · `issuanceFileUrl` · assembled/triggered/issued by+date · `rejectionReason?`.

### 12.4 Program (first-class)
`id` · `name` · `fundingToken` · `assetToken` · `minimumLoanAmount` · `lockUpTermMonths` (T-13) · `eligibleGeographies[]` · `hTokenValuation` · `hValuationLastUpdated` · `fundWalletAddress` · `status`.

### 12.5 Wallet
`address` · `name?` · `investorId` · `authStatus` (Pending Authentication / Authenticated / failed_to_add) · `tokenAuthorizations[]` { token, legalEntity, type, status } · `linkedActivationIds[]` · `programs[]`.

### 12.6 FlexCreditAccount (P2)
`id` · `programToken` · `linkedActivationId` · `amount` · `sourceEntity` ('INC') · `status` (open/settled/canceled) · `settlementActivationId?` · `createdAt`.

---

## 13. Business Rules & Invariants

- **Three-signature gate:** Fund + Account Manager (auto) + Investor required for Open; no funding-verification gate assumed (T-5).
- **Balance invariants:** see §10.3 (API-enforced).
- **Residual flag:** §10.3.
- **Restriction/lock-up:** minted tokens locked for `program.lockUpTermMonths` from settlement date (term T-13; enforcement mechanism on-chain vs off-chain T-14).
- **Program filtering:** activation wallet dropdown filtered to wallets authorized for the selected token.
- **Cross-investor isolation:** investors access only their own activation/wallet/loan data — enforced at the **API response layer**, not UI filtering.
- **PII stripping:** loan detail served to investors is stripped of name, SSN, DOB, and contact info at the API layer.
- **Stale activations:** Unconfirmed > 90 days (configurable) auto-flagged for review; sys_admin can archive (hidden from default views, retained in data).
- **Cross-program batches:** never permitted.
- **Auditable events (core):** activation create/edit/material-edit/signatures/status-change/cancel/revoke/assign/remove/wallet-change/wallet-auth-issue/impersonation; batch create/add-loan/remove-loan/trigger/files-generated/issued/rejected/resubmit/cancel.

---

## 14. Notifications (events only — module architecture out of scope, T-10)

| Event | Recipient | Action link |
|---|---|---|
| Activation created (pending Fund sig) | Ops w/ Fund Sig authority | Activation detail |
| Fund signature complete (AM auto-fired) | Ops creator | Activation detail |
| Investor signature pending | Investor | Activation detail |
| Investor signature complete → Open | Ops creator + sys_admin | Activation detail |
| Activation canceled | Investor + ops creator | Activations list |
| Activation revoked | Investor + ops creator | Activations list |
| Activation expiring ≤30d, available > $0 | Ops creator + sys_admin | Activation detail |
| Wallet failed_to_add | Investor + sys_admin | Wallets |
| Batch rejected by transfer agent | sys_admin + creator | Batch detail |
| Loans eligible for batching >14d unbatched (P1) | sys_admin | Batches |

Delivery mechanism (in-app vs email) and deep-link capability — confirm with engineering (T-10).

---

## 15. Non-Functional Requirements

- **Audit trail:** all state changes, signatures, batch actions logged with actor + timestamp; immutable; sys_admin export.
- **Data isolation:** cross-investor access blocked at API level.
- **PII handling:** investor loan detail stripped at API layer.
- **On-chain reliability:** authentication, authorization, and signature flows must handle tx failure/timeout/network error gracefully — no silent failures.
- **Scalability:** server-side pagination + filtering on all list views.
- **Stale data:** Unconfirmed > 90d auto-flagged; archivable by sys_admin.
- **Platform:** desktop-only for v1; wallet-connect flow must work on mobile browsers.

---

## 16. Acceptance Criteria (P0 first build)

**Ops:**
- Activations list with status tabs (Open default), summary tiles, filters, server-side pagination.
- Activation detail with three-signature strip (Fund manual, AM auto, Investor on-chain), create/edit, cancel/revoke with batch-cleanup enforcement.
- Wallet management: guided connect → authenticate → authorize; `failed_to_add` retry; token-filtered wallet dropdown on activation creation.
- Batches across all four stages: Ready Queue → Assemble → Trigger (Asana + Destroy/Issuance files) → Authorized to Mint (per-loan + whole-batch, partial preserved) → Issued; rejection path returns loans to queue.
- Batch ↔ activation linkage via Order Number = Activation Number.
- Audit log (core events) + notification events emitted.
- Attention signals for pending signatures, wallet errors, ready-queue aging.

**Investor:**
- Own activations dashboard (simplified statuses, Awaiting Signature tab) + detail with anonymized loans.
- Guided wallet setup + token authorization.
- In-platform on-chain activation approval; "Awaiting your signature" surfacing via bell + amber badge.

---

## Appendix A — Decisions Needed Before Build

> 17 items consolidated by owner. Resolve CRITICAL items before engineering kickoff.

### CRITICAL — before kickoff (P0)
| # | Item | Owner |
|---|---|---|
| T-5 | Unconfirmed → Open gate: three signatures only, or additional funding-verification gate? (assumed: signatures only) | Engineering |
| T-9 | Impersonation flow spec exists & audit integration confirmed | Engineering |
| T-10 | Notification integration: event passing, deep-link support, in-app vs email | Engineering |
| T-13 | Lock-up term per program (THHI, UDF) in months | Legal / Capital Markets |
| T-14 | Restriction enforcement: on-chain transfer lock vs platform-only tracking | Engineering / Legal |

### Engineering — before P1
| # | Item |
|---|---|
| T-1 | Wallet re-link: does same-address re-link require full re-authentication or just re-signature? |
| T-2 | On-chain authorization check frequency (polling interval vs event-driven) |
| T-4 | Confirm balance reconciliation lifecycle incl. partial-batch rejection |

### Product — before P1
| # | Item |
|---|---|
| T-3 | Work Queue per-permission display logic; dedicated page vs persistent panel |
| T-7 | Audit log full screen spec (filters, search, export, access by permission) |
| T-8 | Confirm "no in-place amendment of Open activations" (revoke + re-sign, or new activation) is operationally acceptable |

### Ops / Capital Markets — before P1 / data integrity
| # | Item |
|---|---|
| T-11 | Any co-invested activations (>1 investor per activation)? (model assumes 1:1) |
| T-17 | Historical $0.99 H rate in Batch 4 — test value or legitimate NAV adjustment? |

### Before P2 design
| # | Item | Owner |
|---|---|---|
| T-12 | **BLOCKING** — proportional H token split in multi-activation draw; K-1 + ledger treatment | Finance / Legal |
| T-15 | Accounting-system integration: current handoff + structured feed format + priority | Finance / Engineering |
| T-16 | Loan tags data model (supported tags, who applies, where in workflow, enum vs free-form) | Product / Engineering |

### Separate module specs (out of scope here)
| # | Item | Owner |
|---|---|---|
| T-5 (module) | Program setup module (programs as first-class entities) | Product |
| T-6 | Investor onboarding / KYC / credentialing module; handoff point to wallet setup | Product |

---

## Appendix B — Reconciliation Log (wireframe overrides earlier PRDs)

| Area | Earlier PRD (May 28) | v5 Wireframe (Jun 4) — adopted | Effect |
|---|---|---|---|
| Batch lifecycle | 3-stage: Assembled → Pending Issuance → Issued | **4-stage:** Ready Queue → Assembled → **Authorized to Mint** → Issued, with explicit Trigger (Asana + Destroy/Issuance files) and per-loan/whole-batch minting (partial preserved) | Canonical model; legacy `pending_issuance` mapped to post-Trigger window |
| Minting | "Mark Issued" single action (sys_admin) | Explicit **Mint Loan / Mint Entire Batch** step with Ready / Partially Minted / Complete states | New Stage 3 UX |
| Programs | THHI, UDF as token fields | First-class **multi-program selector** (THHI, UDF, DCDF, KY, MI, CO) with per-program H rate + staleness warning | IA hero tile; P0 selector, P1 scaling |
| Residual resolution | Reallocation/flex credit only (P2) | **Mark Resolved** + **Revoke & Re-create at Adjusted Amount** modals | Promotes basic resolution to **P1**; advanced multi-draw/flex credit stays P2 (T-12) |
| RBAC | Role-based matrix (sys_admin/operator/investor) | **Two-axis custom permissions** (Fund Sig × Admin) + tiers + Batch Trigger flag | Supersedes role matrix |
| Account Manager signature | Listed as a signing party | **Automated system wallet**, auto-fires on Fund signature | Clarifies it is not a human action |
| Demo affordance | — | **Simulate Investor Approval** modal | Documented as UAT/demo only, not production |

---

*End of document. Source artifacts retained in `docs/prds/archive/`. Canonical UI reference: `docs/wireframes/homium_v5_wireframe.html`.*
