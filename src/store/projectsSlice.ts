import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Project {
  id: string;
  name: string;
  description?: string;
  image?: string;
  members: { userId: string; role: string }[];
  rootFolders?: any[];
  settings?: {
    allowUpload?: boolean;
    allowSharing?: boolean;
  };
}

const initialState: Project[] = [];

export const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjects: (state, action: PayloadAction<Project[]>) => {
      return action.payload;
    },
    addProject: (state, action: PayloadAction<Project>) => {
      state.push(action.payload);
    },
    removeProject: (state, action: PayloadAction<string>) => {
      return state.filter(p => p.id !== action.payload);
    },
  },
});

export const { setProjects, addProject, removeProject } = projectsSlice.actions;
export default projectsSlice.reducer;
