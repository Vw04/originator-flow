# AUDIT — Onboarding Dashboard Redesign (node 9:1394)

## Overall Assessment: 80% aligned — strong foundation, needs token corrections

---

## ✅ What's Working

### Layout & Structure
- Sand background (#F2F1EC) ✅ — correctly applied
- White cards on sand with stone borders ✅ — matches spec exactly
- Compact density in the table ✅ — rows are tight, appropriate for ops users
- Information hierarchy is clear — KPI strip → charts → table → entities

### Typography
- "Onboarding Dashboard" heading appears serif (Georgia) ✅
- Body text appears sans-serif ✅
- Uppercase small-caps for section labels (TOTAL USERS, FUNNEL) ✅ — good pattern, keep it

### Card Pattern
- White cards, stone borders, no shadows ✅
- Consistent radius ✅

---

## ⚠️ What Needs Correction

### 1. Navigation Bar
**Current:** Dark olive/charcoal background with "Administration" in a teal-green pill, "Dashboard" with dark fill
**Should be:** 
- Nav background: `#00334A` (teal-900) — consistent with brand anchor
- "Administration" dropdown: `#14935F` (green-500) pill with white text — marks the active section
- "Dashboard" active state: white text, subtle `teal-700` (#0A4D6B) background or underline indicator
- Inactive nav items: `#A3C5D4` (teal-200) text on teal-900 background
- Avatar ring: `#14935F` (green-500)

### 2. Funnel Chart Colors
**Current:** Uses ad-hoc colors — light blue (Invited), dark blue-ish (Email), yellow/amber (2FA), dark teal (KYC), forest green (Active)
**Should be:** Use the **categorical palette** in order:
1. Invited → `#00334A` (teal-900) — 13%
2. Email → `#1A6E8E` (teal-500) — 6%
3. 2FA → `#14935F` (green-500) — 13%
4. KYC → `#7B5EA7` (categorical purple) — 13%
5. Active → `#2D8B9E` (categorical teal-alt) — 50% (largest, should be most prominent)

**Critical:** Kill the yellow/amber bar. Gold is dead in this system.

### 3. Avg. Stage Duration Chart
**Current:** Uses teal-ish bars that look close but are inconsistent
**Should be:** Single color bars using `#00334A` (teal-900) for all bars. This is a single-variable chart — no need for multiple colors. Use teal-900 at varying heights. The "3.4d" KYC → Active bar being tallest is the data story.

### 4. Company Progress Indicators
**Current:** Dark green/forest progress bars
**Should be:** `#00334A` (teal-900) for the filled portion, `#E0DDD6` (stone) for the unfilled track. Progress fraction text in `#6B7A85` (gray-500).

### 5. "Requiring Attention" KPI
**Current:** The "1" is shown in orange/amber — reads as a warning
**Should be:** `#C4382A` (error red) — "failed KYC or suspended" is an error state, not a warning. Use error-bg (#FDE8E6) as the card background tint for emphasis.

### 6. Status Pills in Table
**Current:** Multiple colors, partially aligned
**Corrections needed:**
| Status | Current | Should Be |
|--------|---------|-----------|
| KYC Pending | Orange dot | `bg: #E0EDF3` (info-bg), `text: #00334A` (teal-900) |
| 2FA Complete | Green dot | `bg: #E4F3EB` (success-bg), `text: #0D6B40` (green-900) |
| Invited | Gray dot | `bg: #F2F1EC` (sand), `text: #6B7A85` (gray-500) |
| Email Verified | Green dot | `bg: #E4F3EB` (success-bg), `text: #0D6B40` (green-900) |

### 7. Role Pills in Table
**Current:** "Loan Officer" has a left-border accent in teal, "Loan Processor" similar, "Program Admin" in a different shade
**Should be:**
- Loan Officer → `bg: #E0EDF3`, left-border: `#1A6E8E` (teal-500)
- Loan Processor → `bg: #E4F3EB`, left-border: `#14935F` (green-500)
- Program Admin → `bg: #00334A`, text: white (full pill, elevated importance)

### 8. Entity Type Pills
**Current:** "Origination" in green, "Investor" in gray, "Platform" in red-ish
**Should be:**
- Origination → `bg: #00334A` (teal-900), white text
- Investor → `bg: #1A6E8E` (teal-500), white text
- Platform → `bg: #14935F` (green-500), white text

### 9. Active/Pending Status Dots in Entities Table
**Current:** Green "Active" text, orange "Pending" text
**Should be:**
- Active → `#1A8754` (success green) with dot indicator
- Pending → `#B8860B` (warning) with dot indicator

### 10. User Avatar Initials
**Current:** Various colors (pink, teal, green, olive) — appears random
**Should be:** Derive from the categorical palette consistently:
- Cycle through: `#00334A`, `#14935F`, `#1A6E8E`, `#7B5EA7`, `#C4850C`, `#2D8B9E`
- Or use a hash of the user's name to deterministically pick a color

---

## Summary of Color Corrections

| Element | Kill | Replace With |
|---------|------|-------------|
| Any gold/amber (#E5A744) | ✅ | Use warning (#B8860B) only for warning states |
| Any pure gray (#F2F3F6) | ✅ | Use warm neutrals (sand, stone, pearl) |
| Random chart colors | ✅ | Categorical palette or single-color teal-900 |
| Orange "requiring attention" | ✅ | Error red (#C4382A) |
| Inconsistent nav background | ✅ | Teal-900 (#00334A) |
