import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AssetRightsEvent, CreditsSheetSummary } from '../interfaces';
import { getCreditsSheets } from '../services/creditsSheets';

// The credits sheets of the project being seen, with their status (as their workflow nodes
// show it), and the latest change to its assets' license metadata the websocket brought: an
// open sheet or Rights tab reads again on it.
interface CreditsSheetsState {
  projectId: string | null;
  // null until loaded.
  list: CreditsSheetSummary[] | null;
  loading: boolean;
  lastEvent: AssetRightsEvent | null;
  // Counts the events, so the same change told twice is still two.
  eventSeq: number;
}

const initialState: CreditsSheetsState = { projectId: null, list: null, loading: false, lastEvent: null, eventSeq: 0 };

export const fetchCreditsSheets = createAsyncThunk(
  'creditsSheets/fetch',
  (projectId: string) => getCreditsSheets(projectId),
  {
    condition: (projectId, { getState }) => {
      const { creditsSheets } = getState() as { creditsSheets: CreditsSheetsState };
      return !(creditsSheets.loading && creditsSheets.projectId === projectId);
    },
  },
);

const creditsSheetsSlice = createSlice({
  name: 'creditsSheets',
  initialState,
  reducers: {
    assetRightsEventReceived(state, action: PayloadAction<AssetRightsEvent>) {
      state.lastEvent = action.payload;
      state.eventSeq += 1;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchCreditsSheets.pending, (state, action) => {
        if (state.projectId !== action.meta.arg) state.list = null;
        state.projectId = action.meta.arg;
        state.loading = true;
      })
      .addCase(fetchCreditsSheets.fulfilled, (state, action) => {
        if (action.meta.arg !== state.projectId) return;
        state.list = action.payload;
        state.loading = false;
      })
      .addCase(fetchCreditsSheets.rejected, (state, action) => {
        if (action.meta.arg !== state.projectId) return;
        state.list = state.list ?? [];
        state.loading = false;
      });
  },
});

export const { assetRightsEventReceived } = creditsSheetsSlice.actions;
export default creditsSheetsSlice.reducer;
