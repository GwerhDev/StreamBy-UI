import { createSlice } from '@reduxjs/toolkit';

type Project = {
  id: string;
  name: string;
  description?: string;
  image?: string;
  members?: { userId: string; role: string }[];
  rootFolders?: any[];
  settings?: {
    allowUpload?: boolean;
    allowSharing?: boolean;
  };
};

const initialState: Project | null = { id: "", name: "" };

const currentProjectSlice = createSlice({
  name: 'currentProject',
  initialState,
  reducers: {
    setCurrentProject: (_, action) => action.payload,
    clearCurrentProject: () => initialState,
  },
});

export const { setCurrentProject, clearCurrentProject } = currentProjectSlice.actions;
export default currentProjectSlice.reducer;
