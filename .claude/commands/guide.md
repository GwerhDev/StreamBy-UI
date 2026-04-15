# StreamBy UI — Project Guide

Use this document as authoritative context when working on this codebase.
Answer questions, implement features, and write tests according to the conventions described here.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 6 |
| Router | React Router 7 (nested routes, `<Outlet>`) |
| State | Redux Toolkit — `useSelector` / `useDispatch` |
| Styles | CSS Modules (`.module.css`) per component |
| Icons | FontAwesome (free-solid, free-regular, free-brands) |
| HTTP | Native `fetch` with `credentials: 'include'` (session cookies) |
| DnD | @dnd-kit/core + @dnd-kit/sortable + @dnd-kit/modifiers |
| Charts | Chart.js + react-chartjs-2, @nivo/pie |
| Flow | ReactFlow 11 (used in NodeViewer) |

---

## Directory Layout

```
src/
├── app/
│   ├── components/          # Reusable UI pieces
│   │   ├── ApiConnections/  # ApiConnectionList
│   │   ├── Backgrounds/
│   │   ├── Browser/         # Content pane inside ProjectLayout
│   │   ├── Buttons/         # ActionButton, SecondaryButton, ProjectButton…
│   │   ├── Canvas/          # CustomCanvas (dropdown overlay)
│   │   ├── Cards/           # CredentialCard, ApiConnectionCard, ExportCard…
│   │   ├── Credentials/     # CredentialList
│   │   ├── Dashboard/       # DirectoryList
│   │   ├── Exports/         # ExportList, ExportDetailsView
│   │   ├── Forms/           # Create* forms
│   │   ├── Inputs/          # LabeledInput, LabeledSelect, CustomCheckbox
│   │   ├── LateralMenu/     # Second sidebar (project nav, resizable)
│   │   ├── LateralTab/      # First sidebar (project list, sortable DnD)
│   │   ├── Loader/          # Loader, Skeleton.module.css
│   │   ├── Modals/          # Delete*, Logout modals
│   │   ├── Spinner/
│   │   └── Toast/
│   ├── layouts/
│   │   ├── DefaultLayout.tsx   # Root: LateralTab + <Outlet>
│   │   └── ProjectLayout.tsx   # Project: LateralMenu + Browser + <Outlet>
│   └── pages/               # One thin wrapper per route
├── assets/
├── config/
│   ├── api.ts               # API_BASE and other env vars
│   └── consts.ts            # Directory lists for LateralMenu nav
├── hooks/
│   ├── useInitSession.ts
│   ├── useLocalStorage.ts   # Generic localStorage<T> hook
│   └── useProjects.ts
├── interfaces/
│   └── index.ts             # All TypeScript interfaces
├── services/                # One file per resource, raw fetch calls
│   ├── apiConnections.ts
│   ├── auth.ts
│   ├── exports.ts
│   ├── projects.ts
│   └── storage.ts
└── store/
    ├── index.tsx
    ├── apiResponsesSlice.ts  # Toast notifications
    ├── currentProjectSlice.ts
    ├── managementSlice.ts    # Databases + cloud storages (async thunk)
    ├── projectsSlice.ts
    └── sessionSlice.ts
```

---

## Route Tree

```
/                                        → Home
/project/create                          → ProjectCreate
/user                                    → UserAccount
/user/archive                            → UserArchive

/project/:id                             ← ProjectLayout (LateralMenu + Browser)
  /project/:id/dashboard                 → Dashboard
  /project/:id/dashboard/overview        → Overview
  /project/:id/dashboard/overview/edit   → OverviewEdit
  /project/:id/dashboard/members         → Members
  /project/:id/dashboard/exports         → Exports
  /project/:id/dashboard/exports/create  → ExportsCreate
  /project/:id/dashboard/exports/:eid    → ExportsDetails
  /project/:id/dashboard/exports/:eid/edit → ExportsEdit

  /project/:id/storage                   → Storage
  /project/:id/storage/:storageName      → StorageDrive
  /project/:id/storage/:name/:contentType → StorageCategory

  /project/:id/database                  → Database

  /project/:id/api                       → Api (directory list)
  /project/:id/api/connections           → ApiConnectionsList
  /project/:id/api/connections/create    → ApiConnectionsCreate

  /project/:id/settings                  → Settings
  /project/:id/settings/permissions      → Permissions
  /project/:id/settings/credentials      → CredentialsList
  /project/:id/settings/credentials/create → CredentialsCreate
```

All routes are lazy-loaded via `React.lazy()` + `<Suspense fallback={<Loader />}>`.

---

## Redux Store

| Slice | Holds | Key actions |
|---|---|---|
| `session` | `{ logged, userId, role, username, profilePic, loader }` | set/clear session |
| `projects` | `{ list: ProjectList[], loading }` | setProjects |
| `currentProject` | `{ data: Project \| null, loading, error }` | setCurrentProject, clearCurrentProject, setProjectLoading |
| `management` | `{ databases, cloudStorages }` | fetchDatabases (async thunk) |
| `apiResponses` | Toast queue `{ message, type }[]` | addApiResponse |

`currentProject.data` (type `Project`) contains all embedded resources:
`credentials`, `exports`, `apiConnections`, `members`, `allowedOrigin`, `settings`, `rootFolders`.

---

## Service Pattern

Every service file follows this shape — **do not deviate**:

```ts
import { API_BASE } from "../config/api";
import { store } from '../store';
import { addApiResponse } from '../store/apiResponsesSlice';

export async function createThing(projectId: string, payload: ThingPayload) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/things`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const { error, details } = await res.json();
      throw new Error(`${error} - ${details}`);
    }
    const { data } = await res.json();
    store.dispatch(addApiResponse({ message: 'Created successfully.', type: 'success' }));
    return data;
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed.', type: 'error' }));
  }
}
```

After a mutation, the component dispatches `setCurrentProject({ ...currentProjectData, things: [...] })` to update the store locally — **no need to re-fetch the whole project**.

---

## Component & CSS Conventions

### List pages (CredentialList, ApiConnectionList pattern)
- Container: `.container` — `max-width: 1024px`, `flex column`, `padding-top: 3rem`
- Grid: `.container ul` — CSS Grid `repeat(auto-fit, minmax(280px, 1fr))`
- Items: `.container ul li` — styled via selector hierarchy, NOT individual class names
- Create button: `.container ul .createXxx` — `border: dashed .2rem`, transparent bg
- Empty state: render `<ActionButton>` directly (no wrapper div)
- Skeleton: `<li className={\`${s.cardSkeleton} ${skeleton.skeleton}\`} />`

### Form pages (CreateCredentialForm, CreateApiConnectionForm pattern)
- Outer: `.container` — `background-color: var(--color-dark-300)`, relative, flex column
- Inner: `.formContainer` — `max-width: 500px`, centered
- Buttons: `.buttonContainer` — CSS Grid `repeat(auto-fit, minmax(240px, 1fr))`
- Use `<Spinner bg isLoading={loading} />` as first child
- Validate with `useEffect` → `setDisabled(!field1 || !field2 || loading)`
- On success: `dispatch(setCurrentProject({ ...currentProject, things: updated }))` then `navigate(...)`
- On cancel: `navigate(-1)`

### Sidebar nav
Adding a new section to LateralMenu: add an entry to the appropriate list in `src/config/consts.ts`. The menu renders it automatically.

### Persistence
Use `useLocalStorage<T>(key, default)` from `src/hooks/useLocalStorage.ts` in place of `useState` + manual localStorage calls.

---

## Testing Strategy

> Tests are not yet implemented. When the time comes, follow this plan.

### Framework choice

| Tool | Role |
|---|---|
| **Vitest** | Unit + component tests (native Vite integration, same config) |
| **React Testing Library** | Component rendering and interaction |
| **MSW (Mock Service Worker)** | Intercept `fetch` in tests — do NOT mock `fetch` directly |
| **Playwright** | End-to-end tests for critical user flows |

Install when ready:
```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event msw playwright
```

### What to test and how

#### 1. Redux slices — pure unit tests, highest ROI
```
src/store/__tests__/
  currentProjectSlice.test.ts
  projectsSlice.test.ts
  apiResponsesSlice.test.ts
```
Test reducers as pure functions: `expect(reducer(state, action)).toEqual(expected)`.
No mocking needed.

#### 2. Custom hooks
```
src/hooks/__tests__/
  useLocalStorage.test.ts   # read/write/fallback/quota-error
  useProjects.test.ts       # with a mocked Redux store
```
Use `renderHook` from React Testing Library. For `useLocalStorage`, test with `localStorage` stubbed.

#### 3. Service functions — MSW intercepts
```
src/services/__tests__/
  exports.test.ts
  apiConnections.test.ts
  projects.test.ts
```
Start an MSW server, define handlers, verify:
- Correct URL and method are called
- Payload shape matches the interface
- `addApiResponse` is dispatched with the right type on success/error
- Return value shape matches the interface

#### 4. Form components — critical path
```
src/app/components/Forms/__tests__/
  CreateApiConnectionForm.test.tsx
  CreateExportForm.test.tsx
  CreateCredentialForm.test.tsx
```
Per form:
- Required fields empty → submit button disabled
- Fill required fields → submit button enabled
- Submit calls the service with correct payload
- On success → `navigate` was called with the right path
- On error → toast was dispatched

#### 5. List components
```
src/app/components/ApiConnections/__tests__/
  ApiConnectionList.test.tsx
src/app/components/Credentials/__tests__/
  CredentialList.test.tsx
```
- Loading state → skeletons rendered
- Empty state → ActionButton with create text rendered
- With data → cards and delete buttons rendered
- Delete button click → service called, store updated

#### 6. Hooks with DnD (LateralTab)
- Drag end → `projectOrder` state updated
- Order persists to localStorage
- On reload with stored order → projects render in that order

#### 7. E2E with Playwright (future, only critical flows)
```
e2e/
  create-project.spec.ts
  create-export.spec.ts
  api-connections.spec.ts
```
Run against a local dev server + test backend. Focus on happy paths only.

### Test file location rule

Unit/component tests live alongside their source in `__tests__/` subdirectories.
E2E tests live in `e2e/` at the project root.

### Vitest config (add to vite.config.ts when ready)
```ts
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./src/test/setup.ts'],
}
```

`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom';
import { server } from './mswServer';
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```
