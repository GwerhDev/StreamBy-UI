import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// The thumbnails made since a list was read (the websocket tells each one): by file id, its URL.
// A card shows its file's from here, before the next read of its list brings it.
interface AssetThumbnailsState {
  byFileId: Record<string, string>;
}

const initialState: AssetThumbnailsState = { byFileId: {} };

const assetThumbnailsSlice = createSlice({
  name: 'assetThumbnails',
  initialState,
  reducers: {
    assetThumbnailReceived(state, action: PayloadAction<{ fileId: string; thumbnailUrl: string | null }>) {
      if (action.payload.thumbnailUrl) state.byFileId[action.payload.fileId] = action.payload.thumbnailUrl;
    },
  },
});

export const { assetThumbnailReceived } = assetThumbnailsSlice.actions;
export default assetThumbnailsSlice.reducer;
