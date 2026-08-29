# DAG / Mission Control Page Overrides

> **PROJECT:** Bee — Autonomous AI Co-Engineer
> **Updated:** 2026-08-29
> **Page Type:** Mission Control — Live Flight DAG Visualizer

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page Purpose

The **Mission Control** page is the visual command center for active Flights. It renders the Route execution DAG in real time, showing each step's status, Hive tool being invoked, and output telemetry. This is where engineers observe Bee's autonomous work and intervene via Approval Gates.

---

## Page-Specific Rules

### Layout Overrides

- **Max Width:** Full viewport width — this is a dense engineering dashboard
- **Layout:** Horizontal split — DAG graph on left (60%), step detail panel on right (40%)
- **Collapsible Panels:** The detail panel collapses to a narrow rail on smaller screens
- **DAG Orientation:** Top-to-bottom vertical flow; horizontal layout available via toggle

### Spacing Overrides

- **Content Density:** Very high — optimize for maximum information visibility
- **DAG Node Spacing:** `--space-lg` vertical gap between nodes, `--space-md` horizontal for parallel branches
- **Panel Padding:** `--space-md` internal padding on detail panel

### Typography Overrides

- **DAG Node Labels:** `Inter 13px / 600` — compact but readable
- **Step Detail Output:** `JetBrains Mono 12px / 400` — monospace for terminal/log output
- **Timestamps:** `JetBrains Mono 11px / 400` with `--color-text-muted`

### Color Overrides

- **DAG Node Colors by Status:**
  - `pending` → `--color-border` (#2A2A2A) with muted text
  - `running` → `--color-warning` (#FF9F0A) border + pulse animation
  - `success` → `--color-success` (#34C759) border + subtle glow
  - `error` → `--color-error` (#FF453A) border + glow
  - `gate_pending` → `--color-info` (#64D2FF) border + blinking indicator
- **Edge/Connection Lines:** `#3A3A3A` default, `--color-success` for completed paths, animated dash for active edges

### Component Overrides

- DAG nodes use `card` styling with status-colored left border (similar to `.card-task`)
- Active/running node has `pulse-border` animation
- Approval Gate nodes render as distinct modal-trigger buttons within the DAG

---

## Page-Specific Components

### DAG Node

```css
.dag-node {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px 14px;
  min-width: 180px;
  cursor: pointer;
  transition: all 200ms ease;
}

.dag-node:hover {
  border-color: #3A3A3A;
  box-shadow: var(--shadow-md);
}

.dag-node.running {
  border-color: var(--color-warning);
  animation: pulse-border 2s ease-in-out infinite;
}

.dag-node.success {
  border-color: var(--color-success);
}

.dag-node.error {
  border-color: var(--color-error);
}

.dag-node.gate-pending {
  border-color: var(--color-info);
  border-width: 2px;
}
```

### DAG Edge

```css
.dag-edge {
  stroke: #3A3A3A;
  stroke-width: 2;
  fill: none;
  transition: stroke 300ms ease;
}

.dag-edge.completed {
  stroke: var(--color-success);
}

.dag-edge.active {
  stroke: var(--color-warning);
  stroke-dasharray: 6 4;
  animation: dash-flow 1s linear infinite;
}

@keyframes dash-flow {
  to { stroke-dashoffset: -10; }
}
```

### Step Detail Panel

```css
.step-detail {
  background: var(--color-surface);
  border-left: 1px solid var(--color-border);
  padding: var(--space-md);
  overflow-y: auto;
  height: 100%;
}

.step-detail .step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.step-detail .step-output {
  /* Uses .terminal-output from Master */
}
```

---

## Recommendations

- Effects: Node entry animation (`node-enter` from Master), edge draw-on animation, pulsing active nodes, smooth scroll-to-active-node behavior
- Interaction: Clicking a DAG node opens its detail in the side panel with terminal output and code diffs
- Approval Gates: Gate-pending nodes display an inline "Approve" / "Reject" action bar directly in the detail panel
- Zoom: Support pinch-to-zoom and scroll-to-zoom on the DAG canvas for large Routes
