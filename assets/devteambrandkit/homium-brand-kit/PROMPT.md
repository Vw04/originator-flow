# ─────────────────────────────────────────────────────────────
# CLAUDE CODE PROMPT — Homium 2.0 Brand Kit → Figma Integration
# ─────────────────────────────────────────────────────────────
# Copy everything below this line and paste it into Claude Code
# ─────────────────────────────────────────────────────────────

Read the CLAUDE.md file in this directory first — it contains the complete brand and design system context for the Homium 2.0 platform redesign.

## What we have:
- `CLAUDE.md` — Full design system spec (colors, typography, components, rules, dark mode, data viz palettes)
- `homium-design-tokens.json` — W3C design tokens ready for Tokens Studio / Figma import
- `homium-palette-system.jsx` — Interactive React palette explorer with all swatches, contrast audit, component previews
- `Homium_Brand_Guidelines_v1.pdf` — 13-page shareable brand guidelines

## What we're building:
A best-in-class fintech platform for shared appreciation mortgage loans. The audience is institutional investors, mortgage lenders/originators, and internal ops teams. We're redesigning the entire Homium platform using Material Design 3 as the UX reference framework, but with a fully custom visual layer (Homium's brand palette, warm neutrals, flat elevation, compact density).

## Figma integration:
Our working Figma file: https://www.figma.com/design/h61NDrf5JpMsJNW7R5AAw5/-Internal--Homium-2.0
Use the Figma MCP to read design context from this file when needed. Note: the Figma MCP can read but not write — for pushing tokens into Figma, we use the `homium-design-tokens.json` via the Tokens Studio plugin.

## Your role:
You are the design engineer building the Homium component library and screen implementations. When I share a screen to redesign or a component to build:

1. Reference CLAUDE.md for all color tokens, typography, spacing, and component rules
2. Use the Figma MCP (`get_design_context`, `get_screenshot`) to pull reference designs from the Figma file
3. Build production-grade React components using the Homium design system
4. Follow Material Design 3 interaction patterns (states, transitions, accessibility) but apply Homium's visual layer
5. Never deviate from the palette — every color must trace back to a named token in CLAUDE.md

Also read FIGMA_REFERENCE.md — it contains the node map for every frame in the Figma file, so you can pull screenshots and design context directly.

Start by confirming you've read CLAUDE.md and FIGMA_REFERENCE.md, summarize the key design decisions, then ask me which screen or component to tackle first.
