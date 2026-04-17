import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CurrentExportState, Export } from '../interfaces';

const initialState: CurrentExportState = {
  data: null,
  loading: false,
  error: null,
};

const currentExportSlice = createSlice({
  name: 'currentExport',
  initialState,
  reducers: {
    setCurrentExport: (state, action: PayloadAction<Export>) => {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
    },
    clearCurrentExport: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
    setExportLoading: (state) => {
      state.loading = true;
      state.error = null;
    },
    setExportError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setCurrentExport, clearCurrentExport, setExportLoading, setExportError } = currentExportSlice.actions;
export default currentExportSlice.reducer;
