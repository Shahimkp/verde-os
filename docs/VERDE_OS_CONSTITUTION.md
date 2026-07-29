# VERDE OS — OFFICIAL DESIGN & ENGINEERING CONSTITUTION
**Version**: 2.0.0  
**Effective Date**: July 28, 2026  
**Author**: Lead Product Designer & Senior Software Architect, VERDE LABS  
**Status**: PERMANENT SOURCE OF TRUTH (LOCKED)

---

## PREAMBLE & SUPREMACY CLAUSE
This Constitution is the supreme authority governing the architecture, design system, visual identity, user experience, coding standards, and module structures of **VERDE OS**.

Every future specification, prompt, feature, and code addition MUST strictly adhere to this document. If a prompt or request conflicts with this Constitution, **this Constitution takes absolute precedence**. No AI agent or developer may alter the core design language or architecture of VERDE OS without explicitly updating this Constitution first.

---

## SECTION 1: VERDE OS PHILOSOPHY
VERDE OS is a premium, AI-powered Enterprise Operating System crafted for C-suite executives, product managers, and enterprise teams.

- **Minimal & Executive**: High-density information presentation without visual noise.
- **Professional & Focused**: Built to maximize productivity and workflow velocity.
- **Fast & Scalable**: Instant interaction feedback with smooth $<250\text{ms}$ transitions.
- **Strict Non-Goals**:
  - Never playful or cartoonish.
  - Never cluttered or crowded.
  - Never look like a generic admin template or old ERP.

---

## SECTION 2: BRAND IDENTITY & COLOR PALETTE
All components and modules must strictly use the curated VERDE LABS color tokens:

| Token | HEX / Value | Purpose / Usage |
| :--- | :--- | :--- |
| **Primary** | `#00008A` | Deep VERDE LABS Blue — Primary CTAs, active states, key branding |
| **Primary Hover** | `#00006E` | Hover state for primary buttons |
| **Primary Light** | `#EEF2FF` | Subtle blue tint for active backgrounds, AI pills & recommendations |
| **Secondary** | `#3B82F6` | Accent blue for interactive elements & timeline indicators |
| **Background Canvas** | `#F7F8FC` | Cool light gray canvas background |
| **Surface Cards** | `#FFFFFF` | Pure white container surfaces |
| **Borders** | `#E6EAF2` | Very light subtle gray borders |
| **Text Primary** | `#111827` | High contrast dark charcoal for headings and body |
| **Text Secondary** | `#6B7280` | Muted slate for captions, sub-labels, and metadata |
| **Success** | `#10B981` | Elegant green for completed statuses & positive growth |
| **Warning** | `#F59E0B` | Modern amber for pending reviews & warnings |
| **Danger** | `#EF4444` | Professional red for critical alerts & overdue items |

---

## SECTION 3: TYPOGRAPHY SYSTEM
VERDE OS exclusively uses the **Inter** font family (`font-family: 'Inter', -apple-system, sans-serif`).

| Typography Style | Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Heading XL** | 30px (`1.875rem`) | 900 (Black) | 1.2 | Hero greetings, main dashboard headers |
| **Heading L** | 24px (`1.5rem`) | 800 (ExtraBold) | 1.25 | Module page titles |
| **Heading M** | 18px (`1.125rem`) | 800 (ExtraBold) | 1.3 | Section titles |
| **Heading S** | 16px (`1.0rem`) | 700 (Bold) | 1.35 | Card titles, widget headers |
| **Body** | 14px (`0.875rem`) | 400 / 500 | 1.5 | General text content |
| **Caption** | 12px (`0.75rem`) | 500 (Medium) | 1.4 | Timestamps, metadata, sub-labels |
| **Label** | 11px (`0.6875rem`) | 700 (Bold) | 1.3 | Uppercase table headers & badge tags |
| **Muted** | 12px (`0.75rem`) | 400 / 500 | 1.4 | Auxiliary helper text |

---

## SECTION 4: SPACING SYSTEM
All padding, margin, gap, and layout spacing MUST adhere strictly to the 10-point spacing scale:

`4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `40px`, `48px`, `64px`

- `--space-1`: `4px`
- `--space-2`: `8px`
- `--space-3`: `12px`
- `--space-4`: `16px`
- `--space-5`: `20px`
- `--space-6`: `24px`
- `--space-8`: `32px` (Standard module content padding)
- `--space-10`: `40px`
- `--space-12`: `48px`
- `--space-16`: `64px`

---

## SECTION 5: BORDER RADIUS SCALE
Cards, buttons, inputs, and modals must use the official radius tokens:

- **6px** (`--radius-xs`): Buttons, inputs, search triggers, small badges
- **8px** (`--radius-sm`): Sub-containers, timeline items
- **12px** (`--radius-md`): Standard widget cards, modals, table wrappers
- **16px** (`--radius-lg`): Hero cards, primary section boxes
- **20px** (`--radius-xl`): Executive summary containers
- **24px**: Large modal dialogs
- **9999px** (`--radius-full`): Circular avatars and pill tags

---

## SECTION 6: SHADOW & ELEVATION SYSTEM
Skeuomorphism and heavy drop shadows are explicitly forbidden. Use soft elevation shadows:

- **Small** (`--shadow-sm`): `0 1px 2px 0 rgba(15, 23, 42, 0.03)`
- **Medium** (`--shadow-md`): `0 4px 6px -1px rgba(15, 23, 42, 0.04), 0 2px 4px -2px rgba(15, 23, 42, 0.02)`
- **Large** (`--shadow-lg`): `0 10px 15px -3px rgba(15, 23, 42, 0.05)`
- **Floating** (`--shadow-floating`): `0 20px 25px -5px rgba(15, 23, 42, 0.08)`
- **Hover Elevation**: `translateY(-3px)` to `translateY(-6px)` with soft shadow elevation.

---

## SECTION 7: BUTTON SYSTEM
Buttons must use uniform height (`40px` standard, `32px` small, `46px` large) and distinct hierarchy:

1. **Primary Button** (`.btn-primary`): Filled `#00008A` background, white text. Used for main CTA per view.
2. **Secondary Button** (`.btn-secondary`): White surface, subtle border `#E6EAF2`.
3. **Outline Button** (`.btn-outline`): Transparent background, primary border.
4. **Ghost Button** (`.btn-ghost`): Borderless, subtle hover background.
5. **Danger Button** (`.btn-danger`): Filled `#EF4444` background.
6. **Success Button** (`.btn-success`): Filled `#10B981` background.
7. **States**: Loading spinner (`.btn-loading`), Disabled (`:disabled`), Hover elevation (`translateY(-1px)`).

---

## SECTION 8: CARD SYSTEM
Cards are the foundational block of VERDE OS:

- **Statistics Cards** (`.kpi-card-v3`): 6-grid KPI cards featuring icon, value, trend badge, and mini progress bar.
- **Content Cards** (`.widget-box`): White surface, rounded corners (`16px`), soft padding (`28px`).
- **Table Cards** (`.table-card-box`): Rounded container wrapping sticky-header tables.
- **AI Recommendation Cards**: Blue gradient background (`linear-gradient(135deg, #EEF2FF 0%, #F5F7FF 100%)`) with icon glow.

---

## SECTION 9: FORM & INPUT CONTROLS
- **Inputs & Selects**: Height `42px`, radius `6px`, focus ring `0 0 0 3px rgba(0, 0, 138, 0.15)`.
- **Toggle Switches** (`.form-switch`): Smooth 200ms slide toggle.
- **Validation**: Green border for `.is-valid`, Red border for `.is-invalid`.

---

## SECTION 10: ENTERPRISE TABLES
- **Sticky Headers**: Headers stick to top (`position: sticky; top: 0; z-index: 10`).
- **Hover Rows**: Table rows highlight on hover (`background-color: var(--bg)`).
- **Badges**: Statuses displayed via rounded `.badge` tags (`badge-success`, `badge-warning`, `badge-danger`, `badge-primary`).

---

## SECTION 11: UNIVERSAL NAVIGATION SYSTEM
Every module MUST inherit the exact shell structure rendered by `components.js`:

1. **Sidebar**:
   - Width: `280px` Expanded, `84px` Collapsed.
   - Collapse state persisted in `localStorage` under `verde_sidebar_collapsed`.
   - Groups: `WORKSPACE`, `TEAM`, `SETTINGS`.
2. **Topbar**:
   - Contains mobile menu toggle, page title, `⌘K` global search trigger, current date, quick create button (`+`), AI Assistant button with `.pulse-glow`, Notifications dropdown, and Profile dropdown.
3. **Keyboard Shortcuts**:
   - `CTRL + K` or `⌘K`: Global Search.
   - `CTRL + B` or `⌘B`: Toggle Sidebar Collapse.
   - `ESC`: Close open dropdowns and mobile drawers.

---

## SECTION 12: UNIVERSAL PAGE STRUCTURE
Every VERDE OS page MUST follow this exact vertical hierarchy:

1. **Topbar Header**
2. **Page Title & Breadcrumb Header**
3. **Action Toolbar** (Search, Filter, Export, Primary CTA)
4. **Executive KPI Cards** (6-card or 4-card grid)
5. **Primary Content Grid** (2-column main vs side layout: Charts, Tables, Kanban)
6. **Secondary Content Grid** (Timelines, Workload, Activity)
7. **System Status Footer**

---

## SECTION 13: ANIMATION STANDARDS
- All transitions MUST run between **150ms and 250ms**.
- **Allowed Animations**: Staggered fade-in (`.fade-stagger`), card lift (`translateY(-4px)`), button hover, dropdown fade.
- **Forbidden**: Flashy, slow ($>300\text{ms}$), or distracting animations.

---

## SECTION 14: ICONOGRAPHY
- Icons MUST be clean vector SVGs (Lucide-style).
- Stroke width: `2px` standard.
- Size: `16px` for inline/buttons, `20px` for cards, `24px` for headers.

---

## SECTION 15: RESPONSIVE BREAKPOINTS
VERDE OS is fully responsive across five major screen tiers:

- **Desktop Extra Large**: `> 1440px` (Full 6-column KPI grid, 2-column main grids)
- **Desktop Standard**: `1280px - 1440px` (3-column KPI grid)
- **Laptop / Tablet Landscape**: `1024px - 1280px` (Sidebar collapses automatically on mobile drawer toggle, 2-column KPI grid)
- **Tablet Portrait**: `768px - 1024px` (Cards stack vertically)
- **Mobile**: `< 640px` (Full single-column layout, action buttons stretch to 100% width)

---

## SECTION 16: ACCESSIBILITY (a11y)
- All interactive controls MUST feature visible focus rings (`:focus-visible`).
- Color contrast ratio MUST meet WCAG AA standards (Minimum 4.5:1 for body text).
- Interactive elements MUST have descriptive `aria-label` or `title` attributes.

---

## SECTION 17: PERFORMANCE STANDARDS
- Zero duplicated CSS or JavaScript across modules.
- Every module MUST inherit shared assets from `app/assets/css/` and `app/assets/js/`.
- Dynamic rendering via DOM manipulation without heavy external framework bloat.

---

## SECTION 18: CODING & FILE STANDARDS
- **HTML**: Standard semantic HTML5 with `<meta charset="UTF-8">`.
- **CSS**: Pure Vanilla CSS using custom properties (`var(--token)`). No inline style overrides.
- **JS**: Vanilla ES6+ wrapped in IIFE (`(function() { 'use strict'; ... })();`).

---

## SECTION 19: MODULE INHERITANCE MANDATE
Every module (`dashboard`, `crm`, `projects`, `tasks`, `team`, `finance`, `reports`, `communication`, `my-work`, `create-project`) MUST share:
- The single unified `<AppShell>` structure.
- `global.css`, `layout.css`, `components.css`, `modules.css`.
- `session.js`, `components.js`, `navigation.js`, `app.js`.

---

## SECTION 20: AMENDMENT & REVISION PROCESS
This Constitution can only be modified by recording explicit architectural version changes in `docs/CHANGELOG.md`. Any proposed redesign or breaking change that violates this Constitution is strictly rejected.
