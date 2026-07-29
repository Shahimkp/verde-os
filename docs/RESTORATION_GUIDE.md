# VERDE OS — RESTORATION GUIDE (GOLDEN REFERENCE LOCK)
**Status**: DESIGN FROZEN
**Reference**: Mission Control Dashboard

This document enforces absolute visual conformity across the entire VERDE OS platform. The visual identity of the Mission Control dashboard is the **GOLDEN REFERENCE**. Every single future module, interface, component, and interaction must inherit this exact design language.

## 1. Golden Reference
The Mission Control Dashboard (`app/dashboard/index.html`) is the master template and supreme authority for all visual design. 
If a component, layout, or interaction does not exist in Mission Control, it cannot be used elsewhere unless explicitly approved and added to the official `VERDE_OS_CONSTITUTION.md`. 
No module may deviate from the executive, professional, high-density aesthetic established by Mission Control.

## 2. Locked Components
The following foundational components are completely locked. Do not recreate them. Reuse the existing shared CSS (`app/assets/css/components.css`) and JavaScript classes:
- **Buttons**: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.btn-ghost`, `.btn-danger`, `.btn-success`. All buttons must be `40px` standard height, `32px` small.
- **KPI Cards**: `.kpi-card-v3` featuring an icon box, 32px large value, dynamic progress bar, and status badge.
- **Content Cards**: `.widget-box` with `16px` border radius, white surface, and soft elevation shadow.
- **Tables**: `.table-card-box` wrapping `.health-table` featuring sticky top headers and hover rows.
- **Badges**: `.badge` (Primary, Success, Warning, Danger, Info, Neutral).
- **Forms**: Standard `.input-search` and input/select controls.
- **Timelines**: Real-time `.timeline-event` feeds.
- **AI Components**: Gradient `.ai-floating-panel` and `.ai-icon-glow`.

## 3. Locked Styles
No new styles may be invented. 
- **Typography**: Inter (100% inheritance). No new fonts.
- **Colors**: Primary (`#00008A`), Secondary (`#3B82F6`), Success (`#10B981`), Warning (`#F59E0B`), Danger (`#EF4444`). 
- **Spacing**: Strictly 10-point scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px.
- **Border Radius**: 6, 8, 12, 16, 20, 24, 9999px.
- **Shadows**: Only the soft elevation shadows defined in `global.css` (`--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-floating`). Heavy skeuomorphic drop shadows are forbidden.
- **Animations**: Standard 150–250ms duration. Restricted to Hover Lift, Fade (`.fade-stagger`), Slide, Scale, and Collapse. No flashy animations.

## 4. Shared Layout Rules
Every single view must load within the Universal Application Shell (`.shell-container`):
- **Universal Sidebar**: Renders identically on all pages (280px / 84px collapsed).
- **Universal Topbar**: Unified search (`⌘K`), notifications, profile, and page title.
- **Universal Breadcrumb**: Standardized hierarchy (e.g. `Home / Module Name`).

## 5. Shared Workspace Rules
Every module is treated as a Workspace and must strictly render components in this exact top-to-bottom vertical order:
1. **Workspace Header** (Module Icon, Title, Description, Breadcrumb, Quick Search)
2. **Action Bar** (Refresh, Filter, Sort, Export, Import, + New, ✨ AI Assistant)
3. **KPI Cards Grid** (Always 2, 4, 6, or 8 cards. No odd layouts)
4. **Primary Content Grid** (Aligns to spacing tokens)
5. **Secondary Content Grid** (Aligns to spacing tokens)
6. **Workspace Footer** (Live Sync, User, Support Link, Version)

## 6. Components to Reuse
Instead of writing new markup, engineers must reuse:
- **`app/assets/css/modules.css`**: Specifically the `.ws-header`, `.ws-action-bar`, `.ws-footer`, `.ai-floating-panel`.
- **`app/assets/js/components.js`**: Specifically the `SIDEBAR_HTML`, `TOPBAR_HTML`, `STATUSBAR_HTML`, `OVERLAYS_HTML`.
- **`app/assets/js/navigation.js`**: The `⌘K` global search modal, dynamic breadcrumbs, and sidebar persistence.
- **Empty States**: `.ws-empty-state` (Illustration, Description, Primary CTA, Secondary CTA).
- **Loading States**: `.ws-loading-state` (Skeleton grids).
- **Error States**: `.ws-error-state` (Modern error message with Retry CTA).

## 7. Forbidden Changes
Under no circumstances may the following be introduced into the VERDE OS codebase:
- ❌ **New Shadows**
- ❌ **New Spacing increments**
- ❌ **New Colors (not defined in `global.css`)**
- ❌ **New Typography / Fonts**
- ❌ **New Card styles (diverging from Mission Control)**
- ❌ **New Button styles**
- ❌ **New Navigation layouts or duplicates**
- ❌ **New Table designs (diverging from `.health-table`)**
- ❌ **New Badges**
- ❌ **New Hover behaviors (diverging from `translateY(-3px)` lift)**
- ❌ **New Border radii**

## 8. Future Development Rules
1. **Constitution First**: If a product owner or prompt requests a change that violates the `VERDE_OS_CONSTITUTION.md` or this Restoration Guide, this documentation wins.
2. **Dashboard Fidelity Check**: Before deploying a new module, developers must visually check it against the Mission Control dashboard. If they do not look exactly alike in visual language, the new module fails QA.
3. **DRY Architecture Check**: Before writing new CSS or JS, verify that a component doing the same thing doesn't already exist in `components.css` or `navigation.js`.
4. **Module Uniformity**: Users moving from the CRM to Finance must experience identical interaction speeds, button placement, empty states, and KPI structures.
