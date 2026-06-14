# StreamBy-UI — Architecture Reference

## Tech Stack

- React 19, TypeScript, Vite
- Redux Toolkit (state management)
- React Router v6 (lazy-loaded routes)
- FontAwesome (icons via `@fortawesome/react-fontawesome`)
- @dnd-kit (drag-and-drop in LateralTab)
- CSS Modules (all component styling)

---

## Design System

CSS variables defined in `src/globals.css` and `src/root.css`.

### Colors
| Variable | Value | Use |
|---|---|---|
| `--color-primary` | #38B6FF | Primary accent, active states |
| `--color-button-primary` | #38B6FF | Action buttons |
| `--color-button-primary-hover` | #54c0ff | Button hover, image borders |
| `--color-dark-100` | #515151 | Hover on sidebar buttons |
| `--color-dark-200` | #464646 | Card hover background |
| `--color-dark-300` | #3c3c3c | Card background |
| `--color-dark-400` | #2f2f2f | Sidebar button background, borders |
| `--color-dark-500` | #212121 | Icon wrap backgrounds |
| `--color-light-200` | #BEBEBE | Primary text / icon color |
| `--color-light-400` | #7b7b7b | Secondary/subtitle text |
| `--background-color-dark` | #1a1a1c | Page background |
| `--background-color-light` | #2f2f2f | Light surface |

### Spacing
`--size-{1-12}` → 4px to 48px (multiples of 4px).

### Typography
- Body: Inter, system-ui
- Display: Poppins, Big Shoulders Inline Display

### Rules
- **All styles use CSS Modules** — no inline styles except `style={{ flexGrow: 1, minHeight: 0, overflow: 'auto' }}` in layout wrappers.
- Import modules as `s` (or `skeleton` for skeleton styles).

---

## Component Patterns

### Buttons

| Component | Style | Use |
|---|---|---|
| `ActionButton` | Blue (`--color-button-primary`), 28px height | Primary CTA |
| `SecondaryButton` | Border only (`--color-light-200`), 28px height | Cancel / secondary |
| `PrimaryButton` | Gray (`--color-light-300`), 28px height | Neutral action |

All action buttons: `height 28px`, `border-radius var(--size-4)`, `gap 0.5rem`, `max-width 500px`.

**Sidebar buttons** (`LateralTab`): `3rem × 3rem`, `border-radius 100%`, background `var(--color-dark-400)`, hover `var(--color-dark-100)`. See `AddProjectButton.module.css` or `ExploreButton.module.css` as reference.

### Section Headers

Use `SectionHeader` (`src/app/components/SectionHeader/SectionHeader.tsx`) for all page/section headings:
```tsx
<SectionHeader icon={faIcon} title="Title" subtitle="Optional" badge="Optional" action={<Button />} />
```

### Forms

Use `CustomForm` (`src/app/components/Forms/CustomForm.tsx`) for create/edit forms:
```tsx
<CustomForm
  readOnly={false}
  header={{ icon, title, subtitle }}
  fields={[{ icon, label, value, editComponent }]}
  actions={<><ActionButton /> <SecondaryButton /></>}
/>
```

---

## Page Patterns

### List pages (Home, Archive, Explore)

Pages in `src/app/pages/` are thin wrappers. Logic and rendering live in a component under `src/app/components/`.

```tsx
// Page file
export const Explore = () => (
  <div className="dashboard-sections">
    <HomeMenu />
    <div style={{ flexGrow: 1, minHeight: 0, overflow: 'auto' }}>
      <ExploreContent />  {/* component does the work */}
    </div>
  </div>
);
```

The content component follows the `Start.tsx` structure:
- Container: `flex column`, `align-items center`, `text-align center`, `overflow-y auto`
- Inner wrapper: `max-width 1024px`, `gap 3rem`, `padding-top 2rem`
- Title: `<h2>` + `<p>` with `color: var(--color-light-400)`
- Grid list: `<ul>` with `display grid`, `repeat(auto-fit, minmax(280px, 1fr))`, `gap 1rem`
- Items: `<li>` with `background var(--color-dark-300)`, hover `var(--color-dark-200)`, `border-radius 1rem`, `padding 1rem 2rem`
- Empty state: `<EmptyBackground />` (`src/app/components/Backgrounds/EmptyBackground.tsx`)
- Loading state: skeleton `<li>` elements using `skeleton.skeleton` class from `Loader/Skeleton.module.css`

### Cards

Cards inside list items follow the horizontal layout of `ProjectCard`:
- Left: circular image (32px, border `--color-button-primary-hover`) + name truncated
- Right: icon or action

For explore-specific data (member count, badges), use `ExploreProjectCard`.

---

## Modal Pattern

### Creating a new modal

Use the `Modal` base component (`src/app/components/Modals/Modal.tsx`):

```tsx
import { Modal } from '../Modals/Modal';

// In JSX (mounted in a layout or page, always visible in DOM):
<Modal id="my-modal">
  <MyModalContent onClose={handleClose} />
</Modal>
```

### Opening / closing

```ts
// Open
const el = document.getElementById('my-modal') as HTMLDivElement | null;
if (el) el.style.display = 'flex';

// Close
if (el) el.style.display = 'none';
```

### Overlay spec
`position fixed`, `z-index 999`, `backdrop-filter blur(10px)`, `background rgba(0,0,0,0.496)`, centered flex. This is provided automatically by `Modal.module.css` — do not duplicate it.

> **Existing modals** (LogoutModal, DeleteProjectModal, etc.) predate this base component and use their own overlay CSS. Do not refactor them unless specifically tasked with it.

---

## Redux Store

| Slice | State shape |
|---|---|
| `session` | `{ logged, loader, username, userId?, role?, profilePic?, plan? }` |
| `projects` | `{ list: ProjectList[], loading, error }` |
| `currentProject` | `{ data: Project\|null, loading, error, membership }` |
| `currentExport` | `{ data: Export\|null, loading, error }` |
| `management` | `{ databases, storages, loading, error }` |
| `apiResponses` | `{ responses: { id, message, type }[] }` — drives toast notifications |
| `notifications` | `{ items: ServerNotification[], loading }` |
| `currentNotification` | `{ data, loading, error }` |

`plan` in `session` is fetched from `GET /streamby/user/subscription` in `useInitSession.ts` after auth. Values: `'freemium' | 'subscriber' | 'admin'`.

---

## Directory Structure

```
src/
  app/
    components/     # Reusable components, organized by domain
      Buttons/      # ActionButton, SecondaryButton, AddProjectButton, ExploreButton...
      Cards/        # ProjectCard, ExploreProjectCard...
      Forms/        # CustomForm, CreateProjectForm, DeleteProjectForm...
      Modals/       # Modal (base), LogoutModal, DeleteProjectModal...
      LateralTab/   # Sidebar with project icons
      LateralMenu/  # Side panel menu (HomeMenu)
      SectionHeader/
      Backgrounds/  # EmptyBackground, RootBackground, NotFoundBackground
      Loader/       # Skeleton, Spinner
      ...
    layouts/        # DefaultLayout, ProjectLayout, PreviewLayout, UserLayout...
    pages/          # One file per route, lazy-loaded in App.tsx
  hooks/            # useInitSession, useProjects, useWebSocket, useLocalStorage
  services/         # API calls by domain: projects.ts, auth.ts, members.ts...
  store/            # Redux slices + store/index.tsx
  interfaces/       # Global TypeScript types (Session, Project, ExploreProject...)
  config/           # api.ts — exports API_BASE, CLIENT_BASE, etc.
  assets/           # SVGs, fonts
  globals.css       # Global styles + CSS custom properties
```

---

## Conventions

- Component and page names: **PascalCase**
- CSS module import: `import s from './ComponentName.module.css'`
- Skeleton import: `import skeleton from '../Loader/Skeleton.module.css'`
- No comments unless the WHY is non-obvious
- No inline styles except layout-wrapper one-liners (`flexGrow`, `minHeight`, `overflow`)
- New modals must use `<Modal>` base
- New list pages must follow the `Start.tsx` structure
- Routes are lazy-loaded in `App.tsx` via `lazy(() => import(...))`
