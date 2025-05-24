import { createSlice } from '@reduxjs/toolkit';
import { Project } from '../interfaces';

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
