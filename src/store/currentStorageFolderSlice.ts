import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StorageFolder } from '../interfaces';

interface CurrentStorageFolderState {
  data: StorageFolder | null;
}

const initialState: CurrentStorageFolderState = { data: null };

const currentStorageFolderSlice = createSlice({
  name: 'currentStorageFolder',
  initialState,
  reducers: {
    setCurrentStorageFolder: (state, action: PayloadAction<StorageFolder>) => {
      state.data = action.payload;
    },
    clearCurrentStorageFolder: (state) => {
      state.data = null;
    },
  },
});

export const { setCurrentStorageFolder, clearCurrentStorageFolder } = currentStorageFolderSlice.actions;
export default currentStorageFolderSlice.reducer;
