# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Bee — Autonomous AI Co-Engineer
**Updated:** 2026-08-29
**Category:** Developer Tool / Desktop Engineering Teammate

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#FFFFFF` | `--color-primary` |
| Secondary | `#E5E5E5` | `--color-secondary` |
| CTA/Accent | `#007AFF` | `--color-cta` |
| Background | `#0A0A0A` | `--color-background` |
| Surface | `#141414` | `--color-surface` |
| Surface Elevated | `#1E1E1E` | `--color-surface-elevated` |
| Text | `#EBEBEB` | `--color-text` |
| Text Muted | `#8A8A8A` | `--color-text-muted` |
| Success | `#34C759` | `--color-success` |
| Warning | `#FF9F0A` | `--color-warning` |
| Error | `#FF453A` | `--color-error` |
| Info | `#64D2FF` | `--color-info` |
| Border | `#2A2A2A` | `--color-border` |

**Color Notes:** OLED dark theme with true-black background. Semantic status colors for Flight telemetry (success/warning/error). System blue (`#007AFF`) as the primary action/accent.

### Typography

- **Heading Font:** Inter
- **Body Font:** Inter
- **Mono Font:** JetBrains Mono (for code diffs, terminal output, log streams)
- **Mood:** Professional, engineering-focused, precise, confident
- **Google Fonts:** [Inter + JetBrains Mono](https://fonts.google.com/share?selection.family=Inter:wght@300;400;500;600;700|JetBrains+Mono:wght@400;500;600;700)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps, inline icon spacing |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, tag padding |
| `--space-md` | `16px` / `1rem` | Standard card/section padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding, panel gaps |
| `--space-xl` | `32px` / `2rem` | Large gaps between sections |
| `--space-2xl` | `48px` / `3rem` | Major section margins |
| `--space-3xl` | `64px` / `4rem` | Top-level layout spacing |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | Subtle lift on dark surfaces |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.4)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.4)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.5)` | Hero elements, featured panels |
| `--shadow-glow-blue` | `0 0 20px rgba(0,122,255,0.15)` | Active/focused interactive elements |
| `--shadow-glow-green` | `0 0 12px rgba(52,199,89,0.2)` | Success state glow |
| `--shadow-glow-red` | `0 0 12px rgba(255,69,58,0.2)` | Error/alert state glow |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #007AFF;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  transition: all 200ms ease;
  cursor: pointer;
  border: none;
}

.btn-primary:hover {
  background: #0A84FF;
  box-shadow: var(--shadow-glow-blue);
  transform: translateY(-1px);
}

/* Approval Gate Button — high-visibility action */
.btn-approve {
  background: #34C759;
  color: white;
  padding: 12px 28px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 14px;
  transition: all 200ms ease;
  cursor: pointer;
  border: none;
}

.btn-approve:hover {
  background: #30D158;
  box-shadow: var(--shadow-glow-green);
  transform: translateY(-1px);
}

/* Danger / Reject Button */
.btn-danger {
  background: transparent;
  color: #FF453A;
  border: 1.5px solid #FF453A;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-danger:hover {
  background: rgba(255, 69, 58, 0.1);
  box-shadow: var(--shadow-glow-red);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #EBEBEB;
  border: 1.5px solid #2A2A2A;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-secondary:hover {
  border-color: #3A3A3A;
  background: rgba(255, 255, 255, 0.04);
}
```

### Cards

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
  transition: all 200ms ease;
}

.card:hover {
  border-color: #3A3A3A;
  box-shadow: var(--shadow-md);
}

/* Task card — used on Teammate Board */
.card-task {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-cta);
  border-radius: 8px;
  padding: 16px 20px;
  transition: all 200ms ease;
}

.card-task.status-success {
  border-left-color: var(--color-success);
}

.card-task.status-error {
  border-left-color: var(--color-error);
}

.card-task.status-running {
  border-left-color: var(--color-warning);
  animation: pulse-border 2s ease-in-out infinite;
}
```

### Code & Terminal Output

```css
/* Code diff viewer */
.code-block {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  background: #0D0D0D;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
}

/* Terminal log stream */
.terminal-output {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  background: #000000;
  color: #D4D4D4;
  border-radius: 8px;
  padding: 12px 16px;
  max-height: 400px;
  overflow-y: auto;
}

.terminal-output .line-error {
  color: var(--color-error);
}

.terminal-output .line-success {
  color: var(--color-success);
}
```

### Inputs

```css
.input {
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  background: var(--color-surface);
  color: var(--color-text);
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: var(--color-cta);
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.15);
}
```

### Modals (Approval Gates)

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
}

.modal {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 520px;
  width: 90%;
}

/* Approval Gate modal has elevated visual weight */
.modal-gate {
  border-top: 3px solid var(--color-warning);
}
```

### Status Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.badge-running {
  background: rgba(255, 159, 10, 0.12);
  color: var(--color-warning);
}

.badge-success {
  background: rgba(52, 199, 89, 0.12);
  color: var(--color-success);
}

.badge-error {
  background: rgba(255, 69, 58, 0.12);
  color: var(--color-error);
}

.badge-pending {
  background: rgba(100, 210, 255, 0.12);
  color: var(--color-info);
}
```

---

## Style Guidelines

**Style:** Dark Mode (OLED) — Engineering Desktop

**Keywords:** True-black background, deep contrast, developer-focused, code-ready, engineering precision, mission control aesthetic, OLED-optimized

**Best For:** Desktop engineering tools, developer dashboards, code review platforms, CI/CD monitoring, incident response

**Key Effects:** Subtle glow on active elements (`box-shadow` with color opacity), pulsing indicators for running tasks, smooth data stream transitions, monospace code rendering with syntax highlighting

### Page Pattern

**Pattern Name:** Mission Control Dashboard

- **Primary Layout:** Sidebar navigation + main content area with split panels
- **Information Density:** High — designed for power users
- **Section Order:** Teammate Board > Active Flight DAG > Terminal/Diff Panel > Audit Log

---

## Animations

```css
/* Pulse for running/active states */
@keyframes pulse-border {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* Smooth entry for Flight DAG nodes */
@keyframes node-enter {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

/* Terminal line append animation */
@keyframes line-appear {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## Anti-Patterns (Do NOT Use)

- ❌ Light/pastel backgrounds — this is an OLED dark-mode tool
- ❌ Slow or missing loading states — engineering tools demand instant feedback
- ❌ Chat-bubble UI metaphors — Bee is a teammate, not a chatbot
- ❌ Generic placeholder text — use realistic engineering examples

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Lucide, Heroicons, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y
- ❌ **Serif fonts in UI** — Use Inter for UI, JetBrains Mono for code

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Text contrast 4.5:1 minimum against dark background
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
- [ ] Code blocks use JetBrains Mono
- [ ] Status colors match semantic palette (success/warning/error)
- [ ] Approval Gate modals are visually distinct and high-priority
- [ ] Terminal output is scrollable with proper overflow handling
