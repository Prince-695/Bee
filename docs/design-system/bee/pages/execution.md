# Execution / Flight Page Overrides

> **PROJECT:** Bee — Autonomous AI Co-Engineer
> **Updated:** 2026-08-29
> **Page Type:** Dashboard / Real-Time Data View

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page Purpose

The **Execution (Flight)** page shows the real-time progress of an active Flight. It streams SSE events as Bee executes Route steps — displaying live terminal output, code diffs, Hive tool invocations, and self-healing retry attempts. This is the primary observability surface for watching Bee work.

---

## Page-Specific Rules

### Layout Overrides

- **Max Width:** 1400px or full-width
- **Grid:** 12-column grid for data flexibility
- **Layout:** Vertical stack — Flight header (status + metadata) → Step timeline → Active step detail (terminal + diffs)
- **Sticky Header:** Flight status bar remains pinned at top during scroll

### Spacing Overrides

- **Content Density:** Very high — optimize for real-time information streaming
- **Step Timeline Gaps:** `--space-sm` between timeline entries for compact display
- **Terminal Panel Height:** Min `300px`, max `50vh`, scrollable

### Typography Overrides

- **Step Labels:** `Inter 14px / 600`
- **Terminal/Log Output:** `JetBrains Mono 12px / 400` — monospace for all streaming output
- **Duration/Timestamps:** `JetBrains Mono 11px / 400` with `--color-text-muted`

### Color Overrides

- **Strategy:** Status-driven color semantics throughout:
  - Running step → `--color-warning` (#FF9F0A) indicator pulse
  - Completed step → `--color-success` (#34C759) checkmark
  - Failed step → `--color-error` (#FF453A) with error detail expansion
  - Self-heal retry → `--color-info` (#64D2FF) with retry counter badge
  - Approval Gate → `--color-warning` with high-visibility approve/reject buttons
- **Flight Status Bar:**
  - In-flight → dark surface with `--color-warning` left accent
  - Completed → dark surface with `--color-success` left accent
  - Failed → dark surface with `--color-error` left accent

### Component Overrides

- Use `.terminal-output` from Master for all streaming log output
- Use `.code-block` from Master for code diff sections
- Use `.badge-running` / `.badge-success` / `.badge-error` for step status indicators
- Avoid: No loading feedback during step transitions — show skeleton/spinner immediately

---

## Page-Specific Components

### Flight Status Bar

```css
.flight-status-bar {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-warning);
  border-radius: 8px;
  padding: 14px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
}

.flight-status-bar.completed {
  border-left-color: var(--color-success);
}

.flight-status-bar.failed {
  border-left-color: var(--color-error);
}
```

### Step Timeline Entry

```css
.step-entry {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background 150ms ease;
}

.step-entry:hover {
  background: rgba(255, 255, 255, 0.02);
}

.step-entry .step-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.step-entry.self-heal {
  padding-left: var(--space-lg);
  border-left: 2px dashed var(--color-info);
}
```

### Self-Heal Retry Indicator

```css
.retry-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(100, 210, 255, 0.12);
  color: var(--color-info);
}
```

---

## Recommendations

- Effects: Real-time terminal line append animation (`line-appear` from Master), step status transition animations, pulse on active step, smooth auto-scroll to latest output
- Interaction: Clicking a step entry expands its terminal output and code diff inline
- Self-Heal Visibility: When Bee retries a step, indent the retry under the failed step with a dashed connector and retry counter
- Approval Gates: Render as full-width action cards with prominent Approve / Reject buttons
- CTA Placement: "Cancel Flight" button in the status bar; "Approve" / "Reject" inline with gate steps
