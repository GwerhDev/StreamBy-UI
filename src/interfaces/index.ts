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
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  image?: string;
  public: boolean;
  dbType?: string;
  allowedOrigin?: string[];
  credentials?: { id: string; key: string; value: string }[];
  exports?: Export[];
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

export type Session = {
  logged: boolean;
  loader: boolean;
  username: string;
  userId?: string;
  role?: string;
  profilePic?: string;
  plan?: string;
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
