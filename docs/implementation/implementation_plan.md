# VERDE OS — Complete Design System

Build a world-class, interactive design system reference page for VERDE OS — a premium SaaS platform by VERDE LABS. This will serve as the single source of truth for every future screen.

## Brand Colors (Extracted from VERDE LABS Logo)

| Token | Value | Usage |
|---|---|---|
| **Primary** | `#00008a` | Deep blue from logo — buttons, links, active states |
| **Primary Hover** | `#000070` | Darker primary for hover |
| **Secondary** | `#3B82F6` | Lighter blue — secondary actions, highlights |
| **Success** | `#10B981` | Elegant emerald green |
| **Warning** | `#F59E0B` | Modern amber |
| **Danger** | `#EF4444` | Professional red |
| **Text Primary** | `#111827` | Dark charcoal for headings |
| **Text Secondary** | `#6B7280` | Muted gray for body |
| **Text Tertiary** | `#9CA3AF` | Captions and hints |
| **Border** | `#F3F4F6` | Very light gray borders |
| **Background** | `#FFFFFF` | Pure white background |
| **Surface** | `#F9FAFB` | Subtle off-white for sections |
| **Card Shadow** | `0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)` | Extremely soft |

## Proposed Changes

### Location

The design system will be built as a **standalone HTML file** in the `verde labs erp` workspace at:

```
c:\verde studios\verde labs erp\design-system\index.html
```

This is a self-contained, zero-dependency HTML page (no build step required) that showcases every component, token, and pattern.

> [!IMPORTANT]
> This is a pure HTML/CSS/JS implementation — no React, no Tailwind, no build tools. Open the file directly in a browser to view the complete design system.

---

### Architecture: Single-file Design System Reference

#### [NEW] [index.html](file:///c:/verde%20studios/verde%20labs%20erp/design-system/index.html)

A comprehensive, interactive design system page structured in sections:

**1. Header & Navigation**
- Fixed sidebar navigation with section links
- Sticky top bar with "VERDE OS" branding
- Smooth scroll between sections

**2. Foundation — Colors**
- Full color palette with hex values, usage labels
- Primary, Secondary, Success, Warning, Danger, Neutrals
- Interactive swatches (click to copy hex)

**3. Foundation — Typography**
- Inter font (geometric, modern, professional)
- Complete hierarchy: Display → Caption
- Line heights, letter spacing, font weights

**4. Foundation — Spacing & Grid**
- 8-point spacing system visualization
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64
- Layout grid demonstration

**5. Foundation — Border Radius**
- Visual comparison: 12px (buttons/inputs), 16px (cards), 20px (dialogs)

**6. Buttons**
- Primary, Secondary, Outline, Ghost, Danger
- Icon buttons (with Lucide-style SVG icons)
- States: Default, Hover, Focus, Loading (spinner), Disabled
- Size variants: Small, Medium, Large

**7. Inputs & Form Controls**
- Text, Email, Password (with toggle), Search (with icon)
- Dropdown / Select
- Textarea
- Date Picker
- File Upload (drag & drop zone)
- Multi-select (tag-style)
- Checkbox, Radio, Switch (toggle)
- OTP input (6-digit code boxes)
- Validation states: Default, Focus, Error, Success

**8. Data Display Components**
- **Cards** — Basic, elevated, interactive
- **Stat Cards** — KPI metrics with trend indicators
- **Tables** — Sortable header, striped rows, hover states
- **Data Grid** — Compact tabular with pagination
- **Charts** — Bar chart, Line chart, Donut chart (CSS/SVG)
- **Timeline** — Vertical event timeline
- **Calendar** — Month grid view
- **Kanban Cards** — Draggable task cards with status
- **Task Cards** — Checkbox, assignee, priority, due date
- **Activity Feed** — Timestamped events list
- **Notification Card** — Icon, message, timestamp, actions
- **Comment Box** — Avatar, text, reply action
- **Chat Bubble** — Sent/received message styles

**9. UI Elements**
- **Avatar** — Sizes (S/M/L), with status indicator, group stack
- **Badge** — Dot, count, status variants
- **Tag** — Removable, colored variants
- **Progress Bar** — Linear, percentage label
- **Stepper** — Multi-step form indicator
- **Breadcrumb** — Navigation trail
- **Tooltip** — Directional, on hover

**10. Navigation Components**
- **Sidebar** — Collapsible, with sections, icons, active state
- **Top Bar** — Search, notifications, user avatar
- **Tabs** — Underline style, pill style
- **Breadcrumb** — Nested path display

**11. Overlay Components**
- **Modal** — Header, body, footer with actions
- **Drawer** — Slide-in panel from right
- **Dropdown Menu** — Multi-level, with icons and dividers
- **Toast** — Success, error, warning, info notifications

**12. Feedback & State Components**
- **Empty States** — Illustration + message + CTA
- **Loading Skeletons** — Pulsing placeholder blocks
- **Pagination** — Page numbers, prev/next

**13. Layout Demo**
- Full-page mock of VERDE OS dashboard layout
- Sticky sidebar (260px)
- Sticky top navigation
- Scrollable content area
- 1440px canvas, responsive behavior

**14. Animation Showcase**
- Hover transitions (180ms ease)
- Focus ring animations
- Loading spinner
- Skeleton pulse
- Toast slide-in
- Modal fade/scale
- Micro-interaction demos

---

### Design Principles Encoded

| Principle | Implementation |
|---|---|
| **Font** | Inter (Google Fonts) — geometric, modern, professional |
| **Spacing** | 8px base grid, generous whitespace |
| **Radius** | 12px buttons/inputs, 16px cards, 20px modals |
| **Shadows** | Ultra-soft: `0 1px 3px rgba(0,0,0,0.04)` |
| **Transitions** | `all 0.18s ease` — fast, smooth, professional |
| **Colors** | Extracted from VERDE LABS logo (`#00008a` primary) |
| **Icons** | Inline SVG, 1.5px stroke, consistent 20×20 viewbox |
| **No** | Glassmorphism, heavy gradients, heavy shadows, skeuomorphism |

---

## Verification Plan

### Manual Verification
1. Open `index.html` directly in browser
2. Verify all sections render correctly
3. Test interactive elements (buttons, inputs, toggles, modals)
4. Verify responsive behavior at 1440px, 1024px, 768px
5. Check color consistency across all components
6. Verify animations are smooth and professional
