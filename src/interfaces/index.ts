export interface Project {
  id: string;
  name: string;
  description?: string;
  image?: string;
  dbType?: string;
  allowedOrigin?: string[];
  credentials?: { id: string; key: string; value: string }[];
  exports?: Export[];
  members?: { userId: string; role: string, archived: boolean }[];
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

export interface CurrentProjectState {
  data: Project | null;
  loading: boolean;
  error: string | null;
}

export interface DeleteProjectFormProps {
  currentProject: CurrentProjectState | null;
  handleDeleteProject: (e: React.FormEvent) => void;
  handleCancel: () => void;
  handleInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  loader: boolean;
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
  userId?: string;
  role?: string;
  username?: string;
  profilePic?: string;
};

export interface Member {
  role: string;
  userId: string;
  username: string;
  profilePic?: string;
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
  type: 'json' | 'raw' | 'externalApi';
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  description?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  projectId: string;
  collectionName: string;
  exportType: 'json' | 'externalApi';
  exportedBy: string;
  allowedOrigin?: string[];
  private?: boolean;
  credentialId?: string;
  apiUrl?: string;
  prefix?: string;
  json?: JSON | null;
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
