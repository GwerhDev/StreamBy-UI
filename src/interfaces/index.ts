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