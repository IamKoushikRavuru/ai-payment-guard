---
name: Obsidian Sentinel
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#bcc9cd'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#869397'
  outline-variant: '#3d494c'
  surface-tint: '#4cd7f6'
  primary: '#4cd7f6'
  on-primary: '#003640'
  primary-container: '#06b6d4'
  on-primary-container: '#00424f'
  inverse-primary: '#00687a'
  secondary: '#adc6ff'
  on-secondary: '#002e6a'
  secondary-container: '#0566d9'
  on-secondary-container: '#e6ecff'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#1bbd85'
  on-tertiary-container: '#00452e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#acedff'
  primary-fixed-dim: '#4cd7f6'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  code-lg:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.01em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.005em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system establishes an ultra-high-clarity, mission-critical operations environment. It fuses the information density and raw utility of a financial trading terminal with the refined micro-interactions and restraint of modern high-end operating systems, tuned specifically for cybersecurity analysts defending high-throughput financial infrastructure.

### Design Movement & Aesthetic
- **Tactical Dark-First Minimalism**: Purpose-built for low-light Security Operations Center (SOC) floors and 24/7 command displays.
- **Controlled Information Density**: High data throughput per visual degree without clutter. Prioritizes instant pattern recognition over decorative flair.
- **Analytical Intelligence**: Subtle glowing accents and sharp micro-borders delineate automated AI agent actions, real-time threat detection, and payment stream health.
- **Emotional Resonance**: Absolute composure under pressure, razor-sharp technical precision, zero ambiguity, and earned trust.

## Colors

The palette operates on a strict optical hierarchy calibrated to minimize eye fatigue during prolonged analytical shifts while making status discrepancies instantaneously perceptible.

### Canvas & Structural Surfaces
- **Canvas Base**: `#07090E` — Deep terminal void reserved for outer margins and primary backdrop.
- **Panel & Surface Primary**: `#0B0E14` — Primary application plane for modules and dashboard canvas.
- **Card & Component Raised**: `#11151F` — Surface elevation for cards, inspectors, drawers, and modal containers.
- **Surface Hover**: `#182030` — Interactive lift for table rows, clickable chips, and menu items.
- **Structural Borders**: `#1E2638` — 1px crisp separation grid ensuring strict containment without visual noise.

### Typography & Content Neutrals
- **Primary Text**: `#F1F5F9` — High-contrast readouts, crucial metric figures, active labels.
- **Secondary Text / Labels**: `#94A3B8` — Column titles, structural keys, breadcrumbs, and inactive tabs.
- **Tertiary / Muted**: `#64748B` — Monospace timestamps, table footers, deactivated controls, guide lines.

### Intelligence & Observability Accents
- **Cyan Intelligence (Primary)**: `#06B6D4` — AI engine reasoning, synthetic agent hooks, dynamic heuristics.
- **Blue Systems (Secondary)**: `#3B82F6` — Network telemetry, system infrastructure, query triggers, primary actions.

### Semantic State System
- **Safe / Allowed / Normal**: `#10B981` (Accent: `#059669`, Background Fill: `rgba(6, 78, 59, 0.20)`).
- **Warning / Review / Suspicious**: `#F59E0B` (Accent: `#D97706`, Background Fill: `rgba(120, 53, 15, 0.20)`).
- **Critical / Threat / Blocked**: `#EF4444` (Accent: `#DC2626`, Background Fill: `rgba(127, 29, 29, 0.20)`).

## Typography

The typographic engine uses **Inter** for operational UI context and **JetBrains Mono** for all technical entities, deterministic machine outputs, identifiers, and temporal values.

### Monospace Rule Requirements
JetBrains Mono is non-negotiable for:
- Transaction references (`TXN-984210-FX`)
- Autonomous agent markers (`AGENT-SENTINEL-04`)
- Security policy rules (`RULE_VELOCITY_BURST_EXCEEDED`)
- Latencies, risk scores, IP addresses, hashes, and ISO-8601 UTC timestamps

All numeric metrics displayed in cards and tables must enable tabular lining figures (`font-variant-numeric: tabular-nums`) to prevent optical jitter during live real-time state mutations.

## Layout & Spacing

The layout is built upon an adaptive 12-column operational grid configured for ultra-dense monitor workspaces and responsive terminal views.

### Structure
- **Screen Margins**: Fixed `1rem` (16px) on SOC wall screens and desktop workstations, contracting to `0.75rem` (12px) on sub-displays.
- **Grid Gutters**: Uniform `0.75rem` (12px) gutter widths across metrics dashboards and multi-stream panes, maintaining tight proximity between dependent analytical blocks.
- **Rhythm Principle**: Internal element spacing relies on compact steps (4px, 8px, 12px, 16px). Large voids are avoided to ensure critical telemetric alerts and contextual logs remain simultaneously visible above the fold.
- **Breakpoints**: 
  - `Desktop Wide` (≥1600px): Permanent 3-pane layout (Telemetry Sidebar, Transaction Stream, Detail Inspector).
  - `Desktop Standard` (1200px - 1599px): 2-pane view with collapsible secondary inspector drawer.
  - `Tablet / Diagnostic Portable` (<1200px): Stacked single-pane with off-canvas slide-out investigation drawers.

## Elevation & Depth

This system intentionally avoids deep skeuomorphic drop shadows, opting instead for crisp **low-contrast outlines, tonal layering, and targeted photonic diffusion**.

### Layering Hierarchy
1. **Root Surface Layer (z-0)**: `#07090E` base canvas.
2. **Operational Tier (z-10)**: `#0B0E14` dashboard modules framed with `1px solid #1E2638`.
3. **Card & Widget Tier (z-20)**: `#11151F` analytical units, risk cards, and log wrappers. Hover transitions swap the border to `#2E3A52` with zero layout shift.
4. **Overlay / Inspector Tier (z-30)**: Slide-out analyst drawers and popovers sit at `#151B27` with a fine perimeter rule (`1px solid #2A364F`) and a directional ambient falloff: `0 8px 32px rgba(0, 0, 0, 0.6)`.

### Photonic Accents & Glowing Signals
Glows are restricted entirely to security and intelligence states:
- **AI Synthesis Active**: Radial micro-blur `box-shadow: 0 0 12px rgba(6, 182, 212, 0.25)`.
- **Critical Threat Pulse**: Radial alert aura `box-shadow: 0 0 16px rgba(239, 68, 68, 0.3)`.

## Shapes

The design system employs controlled, engineering-grade corner geometry. The roundedness token is set to **1 (Soft)**:
- **Panels, Metrics Containers, and Table Shells**: `rounded-lg` (0.5rem / 8px) to soften panel boundaries without sacrificing screen real estate.
- **Interactive Buttons, Search Inputs, and Micro Badges**: `rounded` (0.25rem / 4px) for crisp, deterministic, software-like tactile feedback.
- **Pill Exceptions**: Real-time status indicators (live pulses) and standalone risk badge indicators utilize complete rounding (`rounded-full`) to immediately contrast against rigid data tables.

## Components

### Buttons & Action Controls
- **Primary AI / Action**: `#06B6D4` background with `#07090E` bold text. Subtle hover glow: `0 0 14px rgba(6, 182, 212, 0.4)`. Height: 32px (compact), 36px (standard).
- **Secondary / Tactical**: `#11151F` background, 1px border `#1E2638`, `#F1F5F9` text. Hover: `#182030` and border `#2E3A52`.
- **Destructive / Block Threat**: `#7F1D1D/20` background, border `rgba(239, 68, 68, 0.4)`, `#EF4444` text. Hover: `#EF4444` background, `#FFFFFF` text.

### Risk Score Badges
- Displayed with `JetBrains Mono` at `label-sm` or `code-md`.
- Encased in a `rounded-full` or `rounded` pill container with a 1px border matching the accent color at 30% opacity.
- **0–29 (Nominal)**: Text `#10B981`, background `rgba(6, 78, 59, 0.25)`.
- **30–69 (Elevated / Suspicious)**: Text `#F59E0B`, background `rgba(120, 53, 15, 0.25)`.
- **70–100 (Critical Threat)**: Text `#EF4444`, background `rgba(127, 29, 29, 0.25)`. Includes an animated 6px radar beacon ring.

### Compact Data Tables
- Header height: 28px, background `#0B0E14`, text `#64748B`, uppercase `label-sm`.
- Row height: 36px, border-bottom `1px solid #1E2638`.
- Hover state: `#182030` background across all cells.
- Monospace alignment: Right-aligned numeric values and amounts; left-aligned status icons, IDs, and entity flags.

### KPI Metrics & Sparklines
- Encapsulated within `#11151F` cards with an interior padding of `space-md` (12px).
- Upper rail: Metric label in `#94A3B8` `label-md` alongside a 7-day sparkline generated using Recharts (`strokeWidth={1.5}`, gradient fill to transparent).
- Lower rail: Tabular numeric readout in `display-lg` (`#F1F5F9`) paired with delta percentage badges (`+2.4%` in green, `-14.1%` in red).

### Expandable Analyst Drawer
- Fixed-position slide-over panel anchored to the right viewport edge (width: 480px–640px).
- Background: `#11151F`, left border `1px solid #1E2638`.
- Features segmented tabs (`Summary`, `Raw Payload`, `AI Chain of Thought`, `Audit Trail`) with zero margin transitions and active border-bottom in `#06B6D4`.

### Search & Global Filter Bar
- Command-line style prompt with keyboard shortcut badge (`⌘K`).
- Background: `#0B0E14`, border `1px solid #1E2638`, icon prefix `LucideSearch` in `#64748B`.
- Integrated tokenized filter chips (`status:blocked`, `amount:>50k`) styled with background `#182030` and removable cross icons.