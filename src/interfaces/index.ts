export interface Project {
  id: string;
  name: string;
  description?: string;
  image?: string;
  dbType?: string;
  exports?: exportList[];
  members?: { userId: string; role: string, archived: boolean }[];
  rootFolders?: string[];
  settings?: {
    allowUpload?: boolean;
    allowSharing?: boolean;
  };
}

export interface DeleteProjectFormProps {
  currentProject: Project | null;
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

export interface exportList {
  id: string;
  name: string;
  collectionName?: string;
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
  description?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  projectId: string;
  collectionName: string;
  exportType: 'json' | 'csv' | 'xml';
  exportedBy: string;
}

export interface ExportDetails {
  id: string;
  name: string;
  type: string;
  method: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  collectionName: string;
  exportedFileUrl?: string;
}

export interface ExportPayload {
  name?: string;
  description?: string;
  collectionName: string;
  exportType?: 'json' | 'csv' | 'xml';
  data?: Record<string, any> | Record<string, any>[];
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
}

export interface FieldDefinition {
  name: string;
  type: string;
  label: string;
  required?: boolean;
}
