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

export interface ProjectList {
  id: string;
  name: string;
  image?: string;
  description?: string;
  archived: boolean;
}

export interface exportList {
  _id: string;
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
  userId: string;
  username: string;
  role: string;
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
  description?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  projectId: string;
  collectionName: string;
  exportType: 'json' | 'csv' | 'xml';
  exportedBy: string;
  exportedFileUrl?: string;
}

export interface User {
  id: string;
  username: string;
  profilePic?: string;
  email: string;
  role: string;
}

export interface Database {
  id: string;
  name: string;
  type: string;
}