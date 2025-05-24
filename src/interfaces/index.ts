export interface Project {
  id: string;
  name: string;
  description?: string;
  image?: string;
  members?: { userId: string; role: string, archived: boolean }[];
  rootFolders?: any[];
  settings?: {
    allowUpload?: boolean;
    allowSharing?: boolean;
  };
}

export type Session = {
  logged: boolean;
  loader: boolean;
  userId?: string;
  role?: string;
  username?: string;
  profilePic?: string;
};