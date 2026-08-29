# Connectors / Hive Registry Page Overrides

> **PROJECT:** Bee — Autonomous AI Co-Engineer
> **Updated:** 2026-08-29
> **Page Type:** Settings / Configuration — Tool Management

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page Purpose

The **Connectors (Hive Registry)** page lets users manage Bee's connected MCP tool servers. Each connector represents a Hive Worker — a capability Bee can use during Flights (e.g., Git operations, Sandbox test runner, Slack notifications, Sentry monitoring). Users can enable/disable tools, configure credentials, and inspect available capabilities.

---

## Page-Specific Rules

### Layout Overrides

- **Max Width:** 1200px (centered)
- **Layout:** Grid of connector cards — 2 columns on desktop, 1 on mobile
- **Sections:** 1. Active connectors (enabled), 2. Available connectors (not yet configured), 3. Custom MCP server setup

### Spacing Overrides

- **Card Grid Gap:** `--space-lg` between connector cards
- **Section Gap:** `--space-2xl` between Active / Available sections

### Typography Overrides

- **Connector Name:** `Inter 16px / 600`
- **Capability List:** `Inter 13px / 400` with `--color-text-muted`
- **Status Label:** `Inter 12px / 600` uppercase tracking

### Color Overrides

- **Strategy:** Status-driven card borders:
  - Connected/Active → `--color-success` left border
  - Disconnected/Error → `--color-error` left border
  - Not Configured → `--color-border` (default)
- **Category Badges:** Use muted backgrounds with semantic color text for categories (Engineering, Ops, Comms)

### Component Overrides

- Connector cards use `.card` styling with status-colored left border
- Enable/Disable toggle uses the CTA color for the active state
- Capability lists are collapsible sections within each card

---

## Page-Specific Components

### Connector Card

```css
.connector-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-border);
  border-radius: 10px;
  padding: 20px;
  transition: all 200ms ease;
}

.connector-card.active {
  border-left-color: var(--color-success);
}

.connector-card.error {
  border-left-color: var(--color-error);
}

.connector-card:hover {
  border-color: #3A3A3A;
  box-shadow: var(--shadow-md);
}

.connector-card .tool-list {
  margin-top: var(--space-sm);
  padding-left: var(--space-md);
  font-size: 13px;
  color: var(--color-text-muted);
}
```

### Category Badge

```css
.category-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.category-badge.engineering {
  background: rgba(0, 122, 255, 0.12);
  color: var(--color-cta);
}

.category-badge.ops {
  background: rgba(255, 159, 10, 0.12);
  color: var(--color-warning);
}

.category-badge.comms {
  background: rgba(52, 199, 89, 0.12);
  color: var(--color-success);
}
```

---

## Recommendations

- Effects: Card entry stagger animation on page load, smooth toggle transitions, capability list expand/collapse animation
- Interaction: Clicking a connector card opens a configuration panel (inline expand or slide-over panel) with credential fields and test-connection button
- Empty State: When no connectors are configured, show a welcoming illustration with guided setup steps
- CTA Placement: "Add Custom MCP Server" button at the top of the Available section; "Test Connection" inside each card's config panel
