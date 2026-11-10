import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// The names a page gives the ids in its route, for the breadcrumbs to show (an asset's, in its
// inspector). An id no page names, and nothing is loading to name, is shown as a short id.
export interface CrumbNamesState { names: Record<string, string> }

const initialState: CrumbNamesState = { names: {} };

const crumbNamesSlice = createSlice({
  name: 'crumbNames',
  initialState,
  reducers: {
    nameCrumb: (state, action: PayloadAction<{ id: string; name: string }>) => {
      state.names[action.payload.id] = action.payload.name;
    },
  },
});

export const { nameCrumb } = crumbNamesSlice.actions;
export default crumbNamesSlice.reducer;
