# StreamBy — Product Roadmap
## From Data Orchestration to Audiovisual & Game Development Pipeline Platform

**Version:** 1.1  
**Date:** 2026-07-02

---

## Foundation

StreamBy's existing primitives are the load-bearing layer for every phase below. Nothing is replaced — everything is extended.

| Existing Primitive | Evolved Role |
|---|---|
| `Export` | Configures endpoints consumable by external applications (type `json` / `externalApi`). Keeps a simplified `nodeSchema` for data mapping only. Moves to a top-level nav section (alongside Storage and Database). |
| `Workflow` | **NEW** — Visual internal pipeline (full NodeViewer DAG). Contains all advanced nodes across phases 1–5. Not consumable externally. Supports project-category templates. |
| `NodeViewer` (ReactFlow DAG) | Powers both Export (simplified palette) and Workflow (full palette). Node palette grows each phase — all new nodes belong to Workflow only. |
| `StorageDrive` (`images\|audios\|videos\|3d-models`) | Production asset library with versioning and metadata |
| `ModelViewer` (react-three-fiber) | Already renders GLB/GLTF — extended with LOD switching and annotation markers |
| WebSocket (notification bus) | Extended to carry job progress events (`jobEvent`, `reviewEvent`) |
| `Credentials` (project-scoped secrets) | Gains categories: render farm keys, CDN tokens, platform publishing keys, AI provider keys |
| `Members` + RBAC | Production roles added: Director, Lead Artist, Producer, Reviewer, Publisher |
| `Plan` (freemium/subscriber/admin) | Gains a `studio` tier gating Phase 3+ features |

---

## Export vs. Workflow

These are two distinct, independent concepts that can optionally connect.

### Export
- Configures a **publicly consumable API endpoint** (method, allowed origins, auth).
- Has a `nodeSchema` that computes the response, but only admits a **simplified node subset**: `streambyNode`, `filterNode`, and data-source nodes (database, JSON input, API connection).
- Managed at `/project/:id/exports` — **top-level nav section**.
- No job execution, no render pipelines, no distribution logic.

### Workflow
- Defines the **internal project pipeline** — not directly consumable by external apps.
- Uses the **full NodeViewer DAG** with all nodes from all phases.
- Can optionally connect its output to an Export endpoint, but this is not required.
- Supports **project-category templates** (see below).
- Managed at `/project/:id/workflows` — **top-level nav section**.

### Lateral menu structure (target)

```
Overview
Workflows          ← top-level (NodeViewer with templates)
Exports            ← top-level (API endpoint configuration)
Storage
Database
Connections
Settings
```

Production, Deliverables, Reviews, Jobs, and Render Farm live as sub-sections under Workflows — they are outputs and monitoring views of the pipeline, not standalone dashboard items.

---

## Project Categories & Workflow Templates

The project category is optional — it filters the suggested Workflow templates when creating a new Workflow. It does not restrict available nodes.

The category is set in project settings and can be changed at any time.

| Category | Suggested Workflow Templates |
|---|---|
| Game Development | Asset Ingest → LOD Generation → Format Convert → Distribution (Steam / itch.io) |
| Audiovisual / Film | Ingest → Transcode → Caption → Review Gate → HLS/DASH Distribution |
| API / Data Service | Data Source → StreamBy Node → Filter → Export endpoint |
| Creative / Design | Asset Ingest → Metadata Tag → Version → CDN Push |

---

## Cross-Phase Infrastructure

Applied once and extended across phases — not per-phase work.

### New handle colors (`nodeTypes.tsx`)
```
H_JOB    = '#f97316'  // orange  — async job execution (render, transcode, build)
H_REVIEW = '#e879f9'  // fuchsia — review / approval lane
```

### WebSocket new message branches (`websocket.ts`)
```typescript
} else if (msg.type === 'jobEvent') {
  store.dispatch(upsertJob(msg.data));         // currentJobSlice (Phase 1+)
} else if (msg.type === 'reviewEvent') {
  store.dispatch(handleReviewEvent(msg.data)); // currentReviewSlice (Phase 3+)
}
```
`JobEvent` shape: `{ jobId, jobType, assetId?, stage, progress: 0–100, message?, error? }`

### Credential category expansion (no structural change — adds `category` field)
| Phase | New category | Examples |
|---|---|---|
| 1 | `transcoding` | AWS MediaConvert, Cloudflare Stream token |
| 2 | `renderFarm` | Flamenco API key, AWS Deadline endpoint |
| 4 | `distribution` | Steam login, App Store Connect P8 key, Google Play service account JSON, CDN API key |
| 5 | `aiProvider` | OpenAI, Deepgram, Stability AI, Meshy, ElevenLabs |

### Node palette — two palettes, one viewer

The NodeViewer component is reused for both Export and Workflow, but with different palette configurations:

- **Export palette** (simplified): `streambyNode`, `filterNode`, `dataSourceNode`, `jsonInputNode`, `apiConnectionNode`
- **Workflow palette** (full): all of the above + all nodes added in Phases 1–5

Palette is passed as a prop to NodeViewer — no structural change to the component itself.

### Node palette scaling (`nodePalette.ts`)
Growing from ~5 (Export) / ~8 (Workflow) to ~25 Workflow nodes by Phase 5, two enhancements added once:
1. **Group collapsibility** — `expanded: boolean` per group entry in `PALETTE_GROUPS`
2. **Search filter** — text input at palette top, filters by node `label`

### `isValidConnection` extension rule (`NodeViewer.tsx`)
Each phase adds new node type names to the existing string comparators:
- New **data** nodes → same rule as `dataSourceNode` (streambyNode bottom handles)
- New **process** nodes → same rule as `processNode` (streambyNode top handles)
- New **output** nodes → same rule as `filterNode` (streambyNode right handles)

### Plan tier gates
`'studio'` added as a valid value for `plan` in `sessionSlice`. All gates enforced server-side; the UI shows a lock badge overlay on unavailable palette nodes and routes.

---

## Phase 1 — Media Asset Pipeline (M1–4)

**Goal:** Transform StorageDrive into a production asset library with versioning, metadata, proxy generation, and ingest/transcode nodes in Workflows.

> All new nodes in this phase belong to the **Workflow** palette only.

### New interfaces (`interfaces/index.ts`)

```typescript
interface AssetVersion {
  id: string;
  assetId: string;
  version: number;
  label?: string;
  storageKey: string;
  size: number;
  createdBy: string;
  createdAt: string;
  changeNote?: string;
}

interface AssetMetadata {
  assetId: string;
  duration?: number;       // seconds
  width?: number;
  height?: number;
  frameRate?: number;
  colorSpace?: string;     // sRGB, P3, Rec.709
  codec?: string;
  bitrate?: number;
  channels?: number;       // audio channels
  sampleRate?: number;
  customTags: Record<string, string>;
}

interface JobEvent {
  jobId: string;
  jobType: 'ingest' | 'transcode' | 'caption' | 'thumbnail';
  assetId?: string;
  stage: string;
  progress: number;        // 0–100
  message?: string;
  error?: string;
}
```

### New Redux slice: `currentJobSlice`
```
JobsState { jobs: Record<jobId, JobRecord>, loading: boolean }
Actions: upsertJob, completeJob, failJob
```

### New Workflow node types

| Node | Group | Icon | Graph position | Key config |
|---|---|---|---|---|
| `ingestNode` | data | `faCloudArrowDown` (orange) | below streambyNode, left | storageConnectionId, targetCategory, generateProxy, extractMetadata |
| `transcodeNode` | process | `faFilm` (purple) | above streambyNode | codec, resolution, bitrate, audioCodec, outputFormat |
| `captionNode` | process | `faClosedCaptioning` (purple) | above streambyNode | sourceLanguage, outputFormat (SRT/VTT), provider |
| `thumbnailNode` | process | `faImage` (green) | above streambyNode | strategy (timecode/first-frame), timecode, resolution |

### Backend endpoints
- `POST /streamby/jobs/ingest|transcode|thumbnail` — async job queue
- `POST|GET /streamby/assets/:id/versions` — asset versioning
- `GET|PATCH /streamby/assets/:id/metadata` — metadata read/write
- WebSocket sends `{ type: 'jobEvent', data: JobEvent }` on progress updates

### New UI
- **`JobProgressBar`** (`src/app/components/Jobs/`) — inline progress bar inside node detail panel while a job is active
- **`AssetDetailPanel`** — three new tabs: `Versions` (history with restore/download), `Metadata` (key-value + editable custom tags), `Jobs` (job history for this asset)
- **`StorageDrive`** — collapsible filter sidebar: duration range, resolution, color space, custom tags

### New routes
- `/project/:id/workflows` — Workflow list and editor
- `/project/:id/jobs` — project-wide job monitor (sub-section of Workflows nav)

---

## Phase 2 — 3D & VFX Pipeline (M5–9)

**Goal:** Render job dispatch to DCC tools via render farm APIs, 3D asset dependency tracking, LOD management, and format conversion — all as Workflow nodes.

> All new nodes in this phase belong to the **Workflow** palette only.

### New interfaces

```typescript
interface RenderFarmConnection {
  id: string;
  name: string;
  provider: 'flamenco' | 'deadline' | 'rebusfarm' | 'sheepit' | 'custom';
  apiUrl: string;
  credentialId: string;
  projectId: string;
}
// Added to Project as: renderFarmConnections?: RenderFarmConnection[]

interface LodManifest {
  assetId: string;
  levels: Array<{ level: number; ratio: number; storageFileId: string; polyCount: number; fileSize: number }>;
  generatedAt: string;
}

interface AssetDependencyGraph {
  rootAssetId: string;
  nodes: Array<{ assetId: string; type: string; resolved: boolean }>;
  edges: Array<{ from: string; to: string; relationship: 'texture' | 'library' | 'reference' }>;
}
```

### New Redux slice: `renderFarmSlice`
```
{ connections: RenderFarmConnection[], loading: boolean, error: string | null }
```

### New Workflow node types

| Node | Group | Icon | Graph position | Key config |
|---|---|---|---|---|
| `renderJobNode` | process | `faMicrochip` (orange H_JOB) | above streambyNode | renderer (Blender/Unreal/Houdini/Arnold/Redshift), renderFarmConnectionId, frameRange, resolution, samples, outputFormat |
| `formatConvertNode` | process | `faArrowsRotate` (blue) | above streambyNode | inputFormat, outputFormat (FBX/OBJ/GLB/USD/USDZ/STL), applyTransforms, embedTextures |
| `lodNode` | process | `faLayerGroup` (teal) | above streambyNode | levels, reductionRatios, algorithm (Quadric/Progressive), outputFormat |
| `assetDependencyNode` | data | `faProjectDiagram` (green) | below streambyNode | rootAssetId, resolveDependencies, maxDepth |

### Backend endpoints
- `/streamby/render-farm-connections` — CRUD (same pattern as `/api-connections`)
- `POST /streamby/jobs/render|format-convert|lod` — async job dispatch
- `POST /streamby/assets/:id/dependency-graph` — dependency resolution

### New UI
- **`RenderJobMonitor`** (`src/app/components/Jobs/`) — real-time render job sidebar panel with frame counter (N/M), WebSocket-driven progress, cancel button
- **`ModelViewer`** — LOD level selector dropdown when asset has a `LodManifest`
- **`AssetDependencyGraph` visualizer** — read-only ReactFlow canvas in AssetDetailPanel `Dependencies` tab
- **Routes:** `/project/:id/render-farm` — connection list + create; sub-section of Workflows nav

### Distribution targets unlocked
- Render farm dispatch: Blender (Cycles/EEVEE), Unreal (Movie Render Queue), Houdini (Mantra/Karma)
- Multi-LOD GLB packages for game engine import
- FBX → GLB pipelines for web delivery

---

## Phase 3 — Collaboration & Review (M10–13)

**Goal:** Frame-accurate review, annotations, approval workflows, and version diffing — as Workflow nodes that gate pipeline execution.

> All new nodes in this phase belong to the **Workflow** palette only.

### New interfaces

```typescript
interface ReviewSession {
  id: string;
  projectId: string;
  assetId: string;
  assetVersionId: string;
  status: 'open' | 'approved' | 'rejected' | 'expired';
  requiredApprovers: number;
  approvals: Array<{ userId: string; username: string; decision: 'approve' | 'reject'; comment?: string; at: string }>;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

interface Annotation {
  id: string;
  assetId: string;
  assetVersionId: string;
  authorId: string;
  authorUsername: string;
  type: 'timecoded' | 'spatial' | 'region';
  timecode?: number;
  position3d?: [number, number, number];
  regionRect?: { x: number; y: number; w: number; h: number };
  text: string;
  resolved: boolean;
  resolvedBy?: string;
  createdAt: string;
}
```

### New Redux slice: `currentReviewSlice`
```
{ session: ReviewSession | null, annotations: Annotation[], loading: boolean, error: string | null }
```

### New member roles
`'director' | 'lead-artist' | 'producer' | 'reviewer' | 'publisher'` — extend the existing `role: string` field in `Project.members`.

### New Workflow node types

| Node | Group | Icon | Graph position | Key config |
|---|---|---|---|---|
| `reviewGateNode` | process | `faCircleCheck` (fuchsia H_REVIEW) | above streambyNode, before deliverable | requiredApprovers, approverRoles, deadlineHours, notifyOnSubmit |
| `annotationNode` | output | `faCommentDots` (fuchsia) | right of streambyNode | annotationType (timecoded/spatial/region), displayMode |

### Backend endpoints
- `/streamby/reviews` — CRUD + `POST /streamby/reviews/:id/approve|reject`
- `/streamby/assets/:id/annotations` — CRUD
- Workflow engine pauses execution at `reviewGateNode` until minimum approvals are met
- Requires `plan: 'studio'`

### New UI
- **`ReviewPlayer`** (`/project/:id/review/:reviewSessionId`) — video player with timecode annotation pins on scrubber; Three.js canvas for 3D with spatial billboard markers; image viewer with region overlays; annotation sidebar with Resolve/Reply; Approve / Request Changes top bar
- **`ReviewList`** (`/project/:id/reviews`) — session list with status badges; sub-section of Workflows nav
- **`VersionDiffPanel`** — side-by-side comparison in `Versions` tab: pixel diff for images, dual ModelViewer for 3D, sync playback for video

---

## Phase 4 — Distribution & Delivery (M14–18)

**Goal:** Package and publish approved deliverables to streaming platforms (HLS/DASH), app stores, game distribution (Steam, itch.io), and CDN — as Workflow output nodes.

> **Deliverables are a Workflow output, not an extension of Export.** The `Export` entity is not modified in this phase. Deliverables have their own entity and routes.

> All new nodes in this phase belong to the **Workflow** palette only.

### New interfaces

```typescript
interface Deliverable {
  id: string;
  projectId: string;
  workflowId: string;
  name: string;
  type: 'video-stream' | 'game-build' | 'asset-bundle' | 'app-binary';
  version: string;
  changeNotes?: string;
  status: 'pending' | 'publishing' | 'published' | 'failed';
  targets: DeliveryTarget[];
  createdBy: string;
  createdAt: string;
  publishedAt?: string;
  cdnUrl?: string;
}

interface DeliveryTarget {
  connectionId: string;
  target: DistributionConnection['target'];
  channel?: string;
  publishedAt?: string;
  publishedBy?: string;
  receipt?: Record<string, string>;
  status: 'pending' | 'publishing' | 'published' | 'failed';
}

interface DistributionConnection {
  id: string;
  name: string;
  target: 'cdnPush' | 'hlsStream' | 'steam' | 'appStoreConnect' | 'googlePlay' | 'itchIo' | 'customWebhook';
  credentialId: string;
  projectId: string;
  config: Record<string, string>;
}

interface QcReport {
  assetId: string;
  checks: Array<{ name: string; passed: boolean; value: string; threshold: string; message?: string }>;
  overallPassed: boolean;
  generatedAt: string;
}
```

### New Workflow node types

| Node | Group | Icon | Graph position | Key config |
|---|---|---|---|---|
| `deliverableNode` | output | `faBoxArchive` (amber) | rightmost node | deliverableType, version, changeNotes, requiresApproval |
| `distributionNode` | output | `faRocket` (orange) | after deliverableNode | distributionTarget, distributionConnectionId, channel, autoPublish, releaseNotes |
| `qcCheckNode` | process | `faShieldHalved` (green) | above streambyNode, before reviewGate | checks (multi-select), failureAction, thresholds |

### Backend
- `POST /streamby/deliverables/:id/publish` — creates versioned snapshot + triggers distribution job
- HLS packaging: FFmpeg worker → `.m3u8` + `.ts` segments → CDN push
- Steam: Steamworks Web API / SteamCMD (containerized)
- App Store Connect: App Store Connect REST API
- QC engine: FFprobe-based analysis with configurable rule evaluation
- Build log streaming via WebSocket `{ type: 'jobEvent', stage: 'log', message: string }`

### New UI
- **`DeliverableList`** (`/project/:id/deliverables`) — sub-section of Workflows nav; shows all deliverables with version history
- **`DeliverableDetailView`** — tabs: `Pipeline`, `Versions`, `Distribution` (per-platform status cards, live WebSocket), `QC Report`
- **`DistributionConnectionList/Create`** (`/project/:id/distribution`) — same card pattern as `ApiConnectionsList`
- **`PipelineRunLog`** — drawer with real-time log stream (monospace, auto-scroll, download button)

### Distribution targets unlocked
- HLS/DASH adaptive streaming to any CDN (Cloudflare, AWS CloudFront, GCS)
- Steam builds (Windows/Mac/Linux via SteamPipe)
- iOS and Android binary submission
- itch.io game publishing
- Versioned, approved deliverable archives with full audit trail

---

## Phase 5 — AI-Augmented Production (M19–24)

**Goal:** Automated transcription, AI upscaling, procedural 3D asset generation, and intelligent pipeline suggestions as first-class composable Workflow nodes.

> All new nodes in this phase belong to the **Workflow** palette only.

### New Workflow node types (palette group `ai`, fuchsia label)

| Node | Group | Icon | Graph position | Key config |
|---|---|---|---|---|
| `transcriptionNode` | process | `faMicrophone` (purple) | above streambyNode | model (Whisper/Deepgram/AssemblyAI), sourceLanguage, outputFormats (SRT/VTT/JSON), speakerDiarization, credentialId |
| `upscaleNode` | process | `faExpand` (green) | above streambyNode | scale (2×/4×/8×), model (Real-ESRGAN/Topaz/custom), mode (images/video), credentialId |
| `proceduralAssetNode` | data | `faWandMagicSparkles` (fuchsia) | below streambyNode | assetType (3D model/texture/audio), provider (Meshy/Stability AI/ElevenLabs), prompt, seed, credentialId |
| `pipelineSuggestNode` | process | `faBrainCircuit` (fuchsia) | ephemeral — any position | no config — analyzes graph topology, auto-removes after applying suggestion |

### `pipelineSuggestNode` behavior
When dropped into the graph:
1. Calls `POST /streamby/pipeline-suggest` with `{ workflowSchema, projectId, assetCategories, memberRoles }`
2. Backend sends the current graph topology to an LLM with a structured system prompt listing available node types
3. Response is a validated JSON nodes/edges patch — a `PipelineSuggestion`
4. UI shows `AISuggestPreviewModal` with a read-only ReactFlow preview (suggested additions highlighted in fuchsia) + LLM rationale text
5. User accepts (nodes/edges injected via `setNodes`/`setEdges`) or dismisses
6. Node removes itself from the graph either way

### New interfaces
```typescript
interface PipelineSuggestion {
  id: string;
  nodesPatch: Node[];
  edgesPatch: Edge[];
  rationale: string;
  confidence: number;  // 0–1
}
```

### Backend endpoints
- `POST /streamby/jobs/transcription` — Whisper container or provider API
- `POST /streamby/jobs/upscale` — Real-ESRGAN GPU worker or provider API
- `POST /streamby/jobs/generate-asset` — provider-agnostic generative wrapper with polling/callback
- `POST /streamby/pipeline-suggest` — LLM call, response validated against known node types before returning

### New UI
- **`AISuggestPreviewModal`** — read-only ReactFlow canvas previewing the suggestion + rationale text block + Accept/Dismiss
- **`GenerativeAssetPanel`** — tab `AI Origin` in AssetDetailPanel (shown only for procedurally generated assets): provider, prompt, seed, generation timestamp, Regenerate button

---

## Phase Summary

| Phase | Duration | New Workflow Nodes | New Redux Slices | New Routes |
|---|---|---|---|---|
| 1 — Media Asset Pipeline | M1–4 | ingest, transcode, caption, thumbnail | `currentJobSlice` | `/workflows`, `/jobs` |
| 2 — 3D & VFX Pipeline | M5–9 | renderJob, formatConvert, lod, assetDependency | `renderFarmSlice` | `/render-farm` |
| 3 — Collaboration & Review | M10–13 | reviewGate, annotation | `currentReviewSlice` | `/reviews`, `/review/:id` |
| 4 — Distribution & Delivery | M14–18 | deliverable, distribution, qcCheck | `currentDeliverableSlice` | `/deliverables`, `/distribution` |
| 5 — AI-Augmented Production | M19–24 | transcription, upscale, proceduralAsset, pipelineSuggest | (extends currentJobSlice) | — (modal-based) |

## Key Files for Implementation

- `src/app/components/NodeViewer/nodes/nodeTypes.tsx` — new node type components (Workflow palette)
- `src/app/components/NodeViewer/nodePalette.ts` — separate palette configs for Export and Workflow
- `src/interfaces/index.ts` — new interfaces per phase; `Export` interface remains lean (no deliverable fields)
- `src/store/index.tsx` — new slices
- `src/services/websocket.ts` — new message type branches
- `src/app/components/LateralMenu/LateralMenu.tsx` — Exports and Workflows as top-level nav sections
