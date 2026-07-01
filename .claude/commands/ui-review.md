---
description: Full audit of StreamBy-UI — components, pages, layouts, hooks, services, and store. Checks for component reuse violations, design system misuse, style token violations, modularity issues, missing tests, and produces a prioritized remediation plan. Use when you want a complete review of one or more files, a directory, or the entire project.
---

You are the lead reviewer for StreamBy-UI. Your job is to audit code against the project's design system and architecture conventions, then produce a prioritized remediation plan.

First, read both reference files:
- `.claude/commands/ui-review-streamby/design-system.md` — CSS token system
- `.claude/commands/ui-review-streamby/component-patterns.md` — component patterns and test conventions

If `$ARGUMENTS` is provided, review that specific file, component, or directory.
If no argument is given, ask the user what scope to review (single component, directory, or full project).

---

## Scope of review

Review ALL source files — not just components. The full scope is:

```
src/app/components/   ← component reuse, style tokens, modularity
src/app/pages/        ← thin-wrapper violations, inline styles, logic in pages
src/app/layouts/      ← duplicated logic, missing hook extractions
src/hooks/            ← mixed concerns, fragile dependencies
src/services/         ← service pattern deviations
src/store/            ← transient UI state in Redux, non-deterministic IDs
```

---

## What to check

### 1. Component reuse violations

These design system components **must** be used everywhere they fit — find every place they aren't:

| Should use | Instead of |
|---|---|
| `ActionButton` / `SecondaryButton` / `PrimaryButton` | Raw `<button>` with ad-hoc CSS |
| `SectionHeader` | Raw `<h2>` + icon row |
| `CustomForm` | Ad-hoc form layouts for create/edit |
| `Modal` base (`Modals/Modal.tsx`) | Custom overlay divs with `position:fixed` |
| `LabeledInput` | Raw `<input type="text">` |
| `LabeledSelect` / `DropdownInput` | Raw `<select>` |
| `CustomCheckbox` | Raw `<input type="checkbox">` |
| `Skeleton.module.css` skeleton class | Custom loading placeholder divs |
| `Spinner` | Custom spinner divs/animations |
| `EmptyBackground` | Custom empty-state divs |
| `ProjectCard` / `ExploreProjectCard` | Reimplemented card layouts |

Also check for **duplicate components**: if a component in one subdirectory is nearly identical to one in another, flag it. Known example: `Selects/LabeledSelect.tsx` duplicates `Inputs/LabeledSelect.tsx`.

### 2. Style violations

**CSS Modules scope rule**: Only `src/app/components/` may have `.module.css` files. Pages (`src/app/pages/`) and layouts (`src/app/layouts/`) must NOT have their own `.module.css`. Flag any `.module.css` found alongside a page or layout file — styling must come from global classes in `src/styles/globals.css`.

For every `.module.css` file reviewed:

- **Hardcoded colors**: Any `#xxxxxx`, `rgb()`, or `rgba()` that maps to a `--color-*` token → flag with the correct token. Known violations: `AddProjectButton.module.css`, `ProfileButton.module.css`, `MemberCard.module.css`, `DropdownInput.module.css`, `CreateProjectForm.module.css`.
- **Hardcoded spacing**: `gap`, `padding`, `margin` in raw `px` that maps to a `--size-*` token. Known: `ExportCard.module.css` and `ApiConnectionCard.module.css` use `3px 7px`.
- **Inline styles in TSX**: Only `flexGrow`, `minHeight`, `overflow` are permitted on layout wrappers. Flag all others — especially `opacity`, `marginTop`, `display:'none'` used as state toggles.
- **CSS Modules import**: Must be `import s from './ComponentName.module.css'`. Flag any deviation.
- **`!important` is forbidden in CSS Modules.** Fix specificity by writing a more specific selector instead (e.g. `.container ul .createItem` beats `.container ul li`). The only valid exception is overriding injected third-party styles (ReactFlow, CodeMirror) — and only in files that already do it for that reason. Flag every other `!important` as a P1 violation.
- **"Create new" dashed card**: The last `<li>` in every grid list must follow the `ApiConnectionList` pattern — selector `.container ul .createXxx { background-color: transparent; border: dashed .2rem; justify-content: center; }`. No hardcoded border color, no `!important`.

### 3. Modularity and architecture

**Pages** (`src/app/pages/`):
- Must be thin wrappers — no state, no logic, no JSX beyond the layout shell and the content component.
- Known violations: `UserNotificationDetail.tsx` (inline styles + business logic), `Credentials.tsx` (inline loading fallback), `Unauthorized.tsx` (inline styles).

**Layouts** (`src/app/layouts/`):
- Duplicated project-fetching logic between `ProjectLayout.tsx` and `EditorLayout.tsx` → extract to a single `useProjectInit` hook.
- `ProjectLayout.tsx` manages `isSmallScreen` with a resize listener inline → extract to `useResponsiveLayout` hook.
- `PreviewLayout.tsx` calls `fetchProjectPreview()` without awaiting or handling errors → extract to hook.
- `HomeLayout.tsx` has `marginTop` inline style → move to CSS module.

**Hooks** (`src/hooks/`):
- `useInitSession.ts` mixes auth fetch + toast dispatch + navigation → split concerns.
- `useProjects.ts` has a fragile `refreshProjects` dependency → review useCallback / async thunk pattern.

**Services** (`src/services/`):
- All services currently dispatch `addApiResponse` (toast) directly — this makes it impossible for callers to handle errors differently. Flag any service function that dispatches UI notifications.
- `notifications.ts` performs optimistic updates without rollback on failure.
- `websocket.ts` manages reconnection state at module level → consider reactive hook pattern.

**Store** (`src/store/`):
- `desktopSlice.ts`: `minimized` is transient UI state → should be component/context state.
- `notificationsSlice.ts`: optimistic `markRead` mutations have no rollback path.
- `apiResponsesSlice.ts`: uses `Date.now()` as toast ID → can collide; use incremental counter.

### 4. Props and TypeScript

- Flag any `props: any` or `field: any` in interfaces. Known: `ActionButton.tsx`, `AddProjectButton.tsx`, `PrimaryButton.tsx`, `FormInputMode.tsx` (`jsonData: any`), `SecondaryButton.tsx` (`icon?: Icon | any`).
- Flag components over ~150 lines that could benefit from extraction. Known large ones: `UpdateExportForm.tsx` (512 lines), `LateralMenu.tsx` (362 lines), `FormInputMode.tsx` (248 lines), `CreateProjectForm.tsx` (209 lines).

### 5. Tests

- Every component needs a co-located `ComponentName.test.tsx`.
- Currently only `ActionButton.test.tsx` exists — all other components are untested.
- When a test file is missing, scaffold a stub (see scaffolding rules below).
- Framework: `vitest` + `@testing-library/react` + `happy-dom`. Reference: `src/app/components/Buttons/ActionButton.test.tsx`.

---

## Output format

For each file reviewed, produce a findings block:

```
### src/app/components/X/Y.tsx

Modularity
✓ Single responsibility
⚠ props: any on line 5 — define interface Props { text: string; onClick?: () => void }

Style
✓ CSS Modules imported as `s`
⚠ Hardcoded `#3c3c3c` in Y.module.css line 12 — use `var(--color-dark-300)`
⚠ inline `style={{ opacity: 0.5 }}` line 289 — move to CSS class

Component reuse
⚠ Raw `<button>` line 40 — use `<SecondaryButton icon={faTrash} onClick={...} />`
⚠ Raw `<input type="text">` line 120 — use `<LabeledInput />`

Tests
⚠ No test file — stub scaffolded at src/app/components/X/Y.test.tsx
```

---

## Remediation plan

After all findings, produce a **prioritized plan** grouped by effort:

```
## Remediation Plan

### P1 — Quick wins (low effort, high consistency impact)
- [ ] Remove duplicate Selects/LabeledSelect.tsx, update import in CreateExportForm.tsx
- [ ] Replace hardcoded colors in AddProjectButton.module.css, ProfileButton.module.css, MemberCard.module.css, DropdownInput.module.css, CreateProjectForm.module.css
- [ ] Fix props: any in ActionButton, AddProjectButton, PrimaryButton, SecondaryButton, FormInputMode
- [ ] Fix spacing px → token in ExportCard.module.css, ApiConnectionCard.module.css
- [ ] Fix Date.now() ID in apiResponsesSlice.ts → incremental counter

### P2 — Component reuse (medium effort, high architecture impact)
- [ ] Replace raw <button> elements with ActionButton/SecondaryButton (list files)
- [ ] Replace raw <input> elements with LabeledInput (list files)
- [ ] Replace custom modal overlays with Modal base (DbConnectionDetail, DbRecords, DevModeModal)
- [ ] Move inline styles in pages/layouts to CSS modules

### P3 — Architecture (higher effort, pay down tech debt)
- [ ] Extract duplicated project-fetch logic in ProjectLayout + EditorLayout → useProjectInit hook
- [ ] Extract isSmallScreen resize logic → useResponsiveLayout hook
- [ ] Split useInitSession concerns (auth / toast / navigation)
- [ ] Move desktopSlice.minimized out of Redux → component/context state
- [ ] Extract panel state logic in UpdateExportForm → usePanelLayout hook

### P4 — Test coverage (ongoing)
- [ ] Scaffold stubs for all untested components
- [ ] Implement tests for Buttons/ (all variants)
- [ ] Implement tests for Cards/ (all variants)
- [ ] Implement tests for Forms/ (critical path)
- [ ] Implement tests for Inputs/
- [ ] Implement tests for Modals/
```

Show counts: total findings, by severity (P1/P2/P3/P4), by category.

---

## Scaffolding a test stub

When a `ComponentName.test.tsx` is missing, create one:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('renders without crashing', () => {
    // TODO: implement
  });

  it('renders with required props', () => {
    // TODO: implement
  });

  it('handles user interaction', async () => {
    // TODO: implement
  });

  it('shows loading state', () => {
    // TODO: implement
  });

  it('shows empty/disabled state', () => {
    // TODO: implement
  });
});
```

Save alongside the component and report the path.
