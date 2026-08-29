# Status / Teammate Board Page Overrides

> **PROJECT:** Bee — Autonomous AI Co-Engineer
> **Updated:** 2026-08-29
> **Page Type:** Dashboard / Real-Time Status Overview

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page Purpose

The **Status (Teammate Board)** page is the primary landing dashboard showing what Bee is currently working on. It displays active Flights, recent completions, pending Approval Gates, system health, and Hive worker connectivity. This is the "home screen" of the AI Co-Engineer experience.

---

## Page-Specific Rules

### Layout Overrides

- **Max Width:** 1400px or full-width
- **Grid:** 12-column grid for data flexibility
- **Layout:**
  - Top row: Status summary cards (Active Flights, Completed Today, Pending Gates, Connected Tools)
  - Middle: Active task feed — currently running Flights with live status
  - Bottom: Recent activity log + quick-action buttons

### Spacing Overrides

- **Content Density:** High — optimize for at-a-glance information
- **Summary Card Gap:** `--space-md` between top-row stat cards
- **Task Feed Item Gap:** `--space-xs` between task entries for a tight, dense feed

### Typography Overrides

- **Stat Numbers:** `Inter 32px / 700` for large summary metrics
- **Stat Labels:** `Inter 12px / 500` uppercase with `--color-text-muted`
- **Task Titles:** `Inter 14px / 600`
- **Task Metadata:** `Inter 12px / 400` with `--color-text-muted`

### Color Overrides

- **Summary Cards:**
  - Active Flights → `--color-warning` accent
  - Completed Today → `--color-success` accent
  - Pending Gates → `--color-info` accent + attention pulse
  - Connected Tools → `--color-cta` accent
- **Task Feed:** Uses `.card-task` status colors from Master

### Component Overrides

- Summary stat cards are elevated (use `--color-surface-elevated`)
- Pending Approval Gates badge pulses to draw attention
- Avoid: No feedback during loading — show skeleton cards immediately
- Avoid: No feedback after task submission — show instant optimistic update
- Touch: Avoid horizontal swipe on main content

---

## Page-Specific Components

### Summary Stat Card

```css
.stat-card {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.stat-card .stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text);
}

.stat-card .stat-label {
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-muted);
}

.stat-card .stat-accent {
  width: 4px;
  height: 100%;
  border-radius: 2px;
  position: absolute;
  left: 0;
  top: 0;
}
```

### Active Task Feed Entry

```css
.task-feed-entry {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: 12px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 150ms ease;
}

.task-feed-entry:hover {
  background: rgba(255, 255, 255, 0.02);
  border-color: #3A3A3A;
}

.task-feed-entry .task-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.task-feed-entry .task-status-dot.running {
  background: var(--color-warning);
  animation: pulse-border 2s ease-in-out infinite;
}

.task-feed-entry .task-status-dot.success {
  background: var(--color-success);
}

.task-feed-entry .task-status-dot.error {
  background: var(--color-error);
}
```

### Quick Action Bar

```css
.quick-actions {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.quick-action-btn {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  transition: all 150ms ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.quick-action-btn:hover {
  border-color: var(--color-cta);
  color: var(--color-cta);
}
```

---

## Recommendations

- Effects: Real-time stat counter animations (count-up on page load), task feed live-append animation (`line-appear` from Master), pulse on pending gate count, smooth skeleton loading
- Feedback: Show spinner/skeleton for any operation > 300ms
- Interaction: Clicking a task entry navigates to its Flight execution detail page
- Quick Actions: Pre-built task templates — "Review Latest PR", "Run Test Suite", "Investigate CI Failure", "Security Audit"
- Empty State: When no tasks are active, show an inviting prompt: "Assign Bee a task to get started" with template suggestions
