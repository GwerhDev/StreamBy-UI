export interface ApiConnection {
  id: string;
  name: string;
  apiUrl: string;
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  description?: string;
  credentialId?: string;
  prefix?: string;
  projectId: string;
  createdAt?: string;
}

export interface ApiConnectionPayload {
  name: string;
  apiUrl: string;
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  description?: string;
  credentialId?: string;
  prefix?: string;
}

export type StorageConnectionType = 's3' | 'gcs' | 'r2' | 'azure';

export interface StorageConnection {
  id: string;
  name: string;
  type: StorageConnectionType;
  credentialId: string;
  projectId: string;
  createdAt?: string;
  description?: string;
  isBuiltin?: boolean;
  integrationId?: string;
  source?: 'builtin' | 'integration' | 'manual';
  available?: boolean;
}

export type WorkflowStatus = 'draft' | 'active' | 'archived';

export interface Workflow {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  nodeSchema?: { nodes: object[]; edges: object[] } | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowPayload {
  name: string;
  description?: string;
  nodeSchema?: { nodes: object[]; edges: object[] } | null;
}

export interface CurrentWorkflowState {
  data: Workflow | null;
  loading: boolean;
  error: string | null;
}

// A Pipeline is a project sub-workflow. Full entity (with nodeSchema) lives in the
// `pipelines` collection; PipelineRef is the lightweight entry carried on project.pipelines[].
export interface Pipeline {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  order: number;
  nodeSchema?: { nodes: object[]; edges: object[] } | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineRef {
  id: string;
  name: string;
  order: number;
}

export interface PipelinePayload {
  name?: string;
  description?: string;
  nodeSchema?: { nodes: object[]; edges: object[] } | null;
  order?: number;
}

export interface CurrentPipelineState {
  data: Pipeline | null;
  loading: boolean;
  error: string | null;
}

export type ProjectCategory = 'game' | 'film' | 'api' | 'creative';

export interface Project {
  id: string;
  name: string;
  description?: string;
  image?: string;
  public: boolean;
  dbType?: string;
  category?: ProjectCategory | null;
  allowedOrigin?: string[];
  credentials?: { id: string; key: string; value: string }[];
  exports?: Export[];
  workflow?: Workflow;              // single canvas per project
  pipelines?: PipelineRef[];        // lightweight refs; full entities live in the pipelines collection
  apiConnections?: ApiConnection[];
  dbConnections?: DbConnection[];
  storageConnections?: StorageConnection[];
  members?: { userId?: string; role: string; archived?: boolean; status?: 'pending' | 'active' }[];
  rootFolders?: string[];
  settings?: {
    allowUpload?: boolean;
    allowSharing?: boolean;
  };
}

export interface DeleteExportFormProps {
  loader: boolean;
  disabled: boolean;
  confirmText: string;
  currentExport: Export | undefined;
  handleInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCancel: () => void;
  handleDeleteExport: (e: React.FormEvent) => void;
}

export interface DeletePipelineFormProps {
  loader: boolean;
  disabled: boolean;
  confirmText: string;
  currentPipeline: Pipeline | undefined;
  handleInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCancel: () => void;
  handleDeletePipeline: (e: React.FormEvent) => void;
}

export interface DeleteCredentialFormProps {
  loader: boolean;
  disabled: boolean;
  confirmText: string;
  currentCredential: { id: string; key: string; value: string } | undefined;
  handleInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCancel: () => void;
  handleDeleteCredential: (e: React.FormEvent) => void;
}

export interface MembershipInfo {
  isMember: boolean;
  status: 'pending' | 'active' | null;
}

export interface CurrentProjectState {
  data: Project | null;
  loading: boolean;
  error: string | null;
  membership: MembershipInfo | null;
}

export interface CurrentExportState {
  data: Export | null;
  loading: boolean;
  error: string | null;
}

export interface DeleteProjectFormProps {
  currentProject: CurrentProjectState | null;
  handleDeleteProject: (e: React.FormEvent) => void;
  handleCancel: () => void;
  handleInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  loader?: boolean;
  confirmText: string;
}

export interface ProjectList {
  id: string;
  name: string;
  image?: string;
  description?: string;
  archived: boolean;
}

export type WorkspaceMode = 'developer' | 'designer';

export type Session = {
  logged: boolean;
  loader: boolean;
  username: string;
  userId?: string;
  role?: string;
  profilePic?: string;
  plan?: string;
  mode?: WorkspaceMode;
};

export interface ExploreProject {
  id: string;
  name: string;
  description?: string;
  image?: string;
  memberCount: number;
  isMember: boolean;
  hasPendingRequest: boolean;
}

export interface Member {
  role: string;
  userId: string;
  username: string;
  profilePic?: string;
  status: 'pending' | 'active';
}

export interface Directory {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: Directory[];
}

export interface Export {
  id: string;
  name: string;
  type?: 'json' | 'externalApi';
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  description?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  projectId: string;
  collectionName?: string;
  exportType?: 'json' | 'externalApi';
  exportedBy: string;
  allowedOrigin?: string[];
  private?: boolean;
  credentialId?: string;
  apiUrl?: string;
  prefix?: string;
  json?: JSON | null;
  fields?: JSON | null;
  apiResponse?: JSON | null;
  // nodeSchema admits only the simplified Export palette: streambyNode, filterNode, dataSourceNodes
  nodeSchema?: { nodes: object[]; edges: object[] } | null;
  useConnections?: boolean;
  useCredentials?: boolean;
  devMode?: boolean;
  devPorts?: number[];
}

export interface ExportPayload {
  name?: string;
  description?: string;
  collectionName: string;
  exportType?: 'json' | 'csv' | 'xml' | 'externalApi';
  data?: Record<string, object> | Record<string, object>[];
  allowedOrigin?: string[];
  private?: boolean;
  apiUrl?: string;
  credentialId?: string;
  prefix?: string;
}

export interface User {
  id: string;
  username: string;
  profilePic?: string;
  email: string;
  role: string;
}

export interface Database {
  value: string;
  name: string;
}

export type IntegrationKind = 'database' | 'storage';

// Combined pool entry from GET /user/integrations — a user's own (BYOC) integrations plus
// the deploy's built-ins, the latter gated by subscription. Built-ins without access are
// still listed (available: false) so the UI can show them locked, never hidden.
export interface IntegrationPoolEntry {
  id: string;
  kind: IntegrationKind;
  name: string;
  provider: string;
  source: 'builtin' | 'integration';
  available: boolean;
  requiredPlan?: string;
}

export type ExternalDbType = 'postgresql' | 'mongodb';

export interface DbConnection {
  id: string;
  name: string;
  dbType: ExternalDbType;
  credentialId: string;
  projectId: string;
  createdAt?: string;
  description?: string;
  isBuiltin?: boolean;
  integrationId?: string;
  source?: 'builtin' | 'integration' | 'manual';
}

export interface DbColumnDefinition {
  name: string;
  type: string;
  nullable?: boolean;
  primaryKey?: boolean;
}

export interface DbTable {
  name: string;
}

export interface CloudStorage {
  value: string;
  name: string;
  type?: string;
}

export interface LabeledSelectProps {
  label: string;
  name: string;
  value: string;
  id: string;
  htmlFor: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Database[];
}

export interface LabeledInputProps {
  label: string;
  name: string;
  value: string;
  type: string;
  placeholder: string;
  id: string;
  htmlFor: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export interface FieldDefinition {
  name: string;
  type: string;
  label: string;
  required?: boolean;
}

export type StorageCategory = 'images' | 'audios' | 'videos' | '3d-models';

export interface StorageFile {
  id: string;
  key: string;
  name: string;
  displayName: string;
  storageKey: string;
  size: number;
  url: string;
  lastModified: string;
  contentType: string;
  category: StorageCategory;
  uploadedBy: string;
  createdAt: string;
  folderId?: string | null;
}

export interface StorageFolder {
  id: string;
  name: string;
  parentId: string | null;
  projectId: string;
  storageConnectionId?: string;
  createdBy: string;
  createdAt: string;
}

export interface SwitcherApp {
  label: string;
  url: string;
  icon: string;
  color?: string;
  description?: string;
}

export interface SwitcherCategory {
  id: string;
  name: string;
  apps: SwitcherApp[];
}

export interface AssetVersion {
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

export interface AssetMetadata {
  assetId: string;
  duration?: number;
  width?: number;
  height?: number;
  frameRate?: number;
  colorSpace?: string;
  codec?: string;
  bitrate?: number;
  channels?: number;
  sampleRate?: number;
  customTags: Record<string, string>;
}

export interface JobRecord {
  jobId: string;
  jobType: 'ingest' | 'transcode' | 'caption' | 'thumbnail' | 'render' | 'format-convert' | 'lod' | 'transcription' | 'upscale' | 'generate-asset';
  assetId?: string;
  stage: string;
  progress: number;
  message?: string;
  error?: string;
}

export interface LodLevel {
  level: number;
  ratio: number;
  storageFileId: string;
  polyCount?: number;
  fileSize?: number;
}

export interface LodManifest {
  assetId: string;
  levels: LodLevel[];
  generatedAt: string;
}

export interface AssetDependencyNode {
  assetId: string;
  type: string;
  resolved: boolean;
}

export interface AssetDependencyEdge {
  from: string;
  to: string;
  relationship: string;
}

export interface AssetDependencyGraph {
  rootAssetId: string;
  nodes: AssetDependencyNode[];
  edges: AssetDependencyEdge[];
}

export type ReviewStatus = 'open' | 'approved' | 'rejected' | 'expired';
export type ReviewDecision = 'approve' | 'reject';

export interface ReviewApproval {
  userId: string;
  username: string;
  decision: ReviewDecision;
  comment?: string;
  at: string;
}

export interface ReviewSession {
  id: string;
  projectId: string;
  assetId: string;
  assetVersionId: string;
  status: ReviewStatus;
  requiredApprovers: number;
  approvals: ReviewApproval[];
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

export type DistributionTarget =
  | 'cdnPush'
  | 'hlsStream'
  | 'steam'
  | 'appStoreConnect'
  | 'googlePlay'
  | 'itchIo'
  | 'customWebhook';

export type DeliveryStatus = 'pending' | 'publishing' | 'published' | 'failed';

export interface DeliveryTarget {
  connectionId: string;
  target: DistributionTarget;
  channel?: string;
  publishedAt?: string;
  publishedBy?: string;
  receipt?: Record<string, string>;
  status: DeliveryStatus;
}

export interface DistributionConnection {
  id: string;
  name: string;
  target: DistributionTarget;
  credentialId?: string;
  projectId: string;
  config: Record<string, string>;
  createdAt?: string;
  description?: string;
}

export interface QcCheck {
  name: string;
  passed: boolean;
  value: string | number;
  threshold: string | number;
  message?: string;
}

export interface QcReport {
  assetId: string;
  checks: QcCheck[];
  overallPassed: boolean;
  generatedAt: string;
}

export type AiProvider =
  | 'openai'
  | 'deepgram'
  | 'assemblyai'
  | 'stabilityai'
  | 'meshy'
  | 'elevenlabs'
  | 'custom';

export type ProceduralAssetType = '3d' | 'texture' | 'audio';

export interface GenerativeAssetOrigin {
  provider: AiProvider;
  prompt: string;
  seed?: number;
  model?: string;
  generatedAt: string;
}

export interface PipelineSuggestion {
  rationale: string;
  nodesToAdd: { type: string; label: string; position: { x: number; y: number } }[];
  edgesToAdd: { source: string; sourceHandle: string; target: string; targetHandle: string }[];
}

// ── Production Board ──────────────────────────────────────────────────────────

export type ShotStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface ProductionSequence {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  order: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionShot {
  id: string;
  sequenceId: string;
  projectId: string;
  name: string;
  description?: string;
  order: number;
  status: ShotStatus;
  assignedTo: string[];
  assetId?: string | null;
  exportId?: string | null;
  dueDate?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionTask {
  id: string;
  shotId: string;
  projectId: string;
  name: string;
  status: ShotStatus;
  assignedTo?: string | null;
  priority: TaskPriority;
  dueDate?: string | null;
  notes?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ── Asset Rights ──────────────────────────────────────────────────────────────

export type LicenseType =
  | 'all_rights'
  | 'cc_by'
  | 'cc_by_sa'
  | 'cc_by_nc'
  | 'royalty_free'
  | 'licensed'
  | 'public_domain'
  | 'unknown'

export interface AssetRights {
  assetId: string;
  projectId: string;
  rightsHolder?: string;
  licenseType: LicenseType;
  licenseUrl?: string;
  territory?: string;
  expiresAt?: string | null;
  usageRestrictions?: string;
  notes?: string;
  updatedBy: string;
  updatedAt: string;
}

export type AnnotationType = 'timecoded' | 'spatial' | 'region';

export interface Annotation {
  id: string;
  assetId: string;
  assetVersionId: string;
  authorId: string;
  authorUsername: string;
  type: AnnotationType;
  timecode?: string;
  position3d?: { x: number; y: number; z: number };
  regionRect?: { x: number; y: number; width: number; height: number };
  text: string;
  resolved: boolean;
  resolvedBy?: string;
  createdAt: string;
}
