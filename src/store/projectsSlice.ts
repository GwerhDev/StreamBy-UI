import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const projectsSlice = createSlice({
  name: 'projects',
  initialState: {
    list: [],
  },
  reducers: {
    setProjects: (state, action: PayloadAction<any[]>) => {
      state.list = action.payload;
    },
  },
});

export const { setProjects } = projectsSlice.actions;
export default projectsSlice.reducer;
