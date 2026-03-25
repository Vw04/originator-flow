# Design & UX Assumptions

Spec: Originator Flow Spec v0.3 (March 24, 2026)

## Decisions Made for Ambiguous Areas

1. **Investor flow is minimal.** The spec marks Investor onboarding as "TBD." Implemented as a portfolio dashboard with static HEI positions + a KYC verified status screen. Extend when spec is finalized.

2. **Platform Operator = System Admin in UI.** Both roles see the same views. Policy differentiation is reflected in the permission matrix (Operator lacks "Manage Policies" and "Delete" at platform scope) but the nav and available actions are identical for demo purposes.

3. **Program Administrator defaults to view-only.** The spec says edit capabilities are "policy-assignable." In the prototype, Program Admins can view all company data and invite users. Edit permissions on branches/orgs are only available once the `prog_edit` policy is assigned (via Permissions → Policy Assignment in the System Admin view).

4. **LP sub-roles not implemented.** The spec lists LP sub-roles as an open question. A single "Loan Processor" role is used.

5. **Domain email guard is informational only.** The invite modal shows a hint ("Must match the company's registered email domain") but does not validate. No backend = no enforcement.

6. **SecuritizeID KYC is mocked.** The onboarding wizard shows a "User redirected to SecuritizeID" UI note at the KYC step. There is no actual redirect or API call. Advancing past that step simulates the callback.

7. **2FA is shown as a wizard step, not functional.** The onboarding timeline includes a 2FA step. Advancing it simulates completion.

8. **Onboarding for LP skips KYC.** Per spec: LPs do not require SecuritizeID verification. The LP onboarding sequence goes Invited → Email Verified → 2FA → Active (no KYC step).

9. **Programs configured at branch level.** Per spec, program enablement is a separate workstream. In the prototype, programs are shown as checkboxes on the branch form and surfaced on the branch table. No LO-level program enablement UI is built yet.

10. **Sample data uses three companies.** Nashville Lending Group, Apex Mortgage Solutions, Summit Financial Group. Nashville is the most populated (active users, active loans) for demo richness.

## Out of Scope for This Prototype

- Real authentication / magic links / email sending
- Actual SecuritizeID integration
- Persistent storage (database, localStorage)
- Application intake forms (the existing origination screens are the "finish line" per spec)
- Program enablement per LO
- Investor onboarding detail
- Notification system
- Audit log (beyond the activity feed)
