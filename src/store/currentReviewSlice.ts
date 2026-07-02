import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ReviewSession, Annotation, ReviewDecision } from '../interfaces';

interface CurrentReviewState {
  session: ReviewSession | null;
  annotations: Annotation[];
  loading: boolean;
  error: string | null;
}

const initialState: CurrentReviewState = {
  session: null,
  annotations: [],
  loading: false,
  error: null,
};

export const fetchReviewSession = createAsyncThunk(
  'currentReview/fetchSession',
  async ({ projectId, reviewId }: { projectId: string; reviewId: string }) => {
    const { API_BASE } = await import('../config/api');
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/reviews/${reviewId}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch review session');
    const data = await res.json();
    return data.review as ReviewSession;
  },
);

export const fetchAnnotations = createAsyncThunk(
  'currentReview/fetchAnnotations',
  async ({ projectId, assetId, assetVersionId }: { projectId: string; assetId: string; assetVersionId: string }) => {
    const { API_BASE } = await import('../config/api');
    const res = await fetch(
      `${API_BASE}/streamby/projects/${projectId}/assets/${assetId}/versions/${assetVersionId}/annotations`,
      { credentials: 'include' },
    );
    if (!res.ok) throw new Error('Failed to fetch annotations');
    const data = await res.json();
    return data.annotations as Annotation[];
  },
);

export const submitReviewDecision = createAsyncThunk(
  'currentReview/submitDecision',
  async ({
    projectId,
    reviewId,
    decision,
    comment,
  }: {
    projectId: string;
    reviewId: string;
    decision: ReviewDecision;
    comment?: string;
  }) => {
    const { API_BASE } = await import('../config/api');
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/reviews/${reviewId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ decision, comment }),
    });
    if (!res.ok) throw new Error('Failed to submit decision');
    const data = await res.json();
    return data.review as ReviewSession;
  },
);

const currentReviewSlice = createSlice({
  name: 'currentReview',
  initialState,
  reducers: {
    clearReview(state) {
      state.session = null;
      state.annotations = [];
      state.error = null;
    },
    addAnnotation(state, action: PayloadAction<Annotation>) {
      state.annotations.push(action.payload);
    },
    resolveAnnotation(state, action: PayloadAction<string>) {
      const a = state.annotations.find(x => x.id === action.payload);
      if (a) a.resolved = true;
    },
    handleReviewEvent(state, action: PayloadAction<Partial<ReviewSession>>) {
      if (state.session && action.payload.id === state.session.id) {
        Object.assign(state.session, action.payload);
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchReviewSession.pending, state => { state.loading = true; state.error = null; })
      .addCase(fetchReviewSession.fulfilled, (state, action) => {
        state.loading = false;
        state.session = action.payload;
      })
      .addCase(fetchReviewSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Unknown error';
      })
      .addCase(fetchAnnotations.fulfilled, (state, action) => {
        state.annotations = action.payload;
      })
      .addCase(submitReviewDecision.fulfilled, (state, action) => {
        state.session = action.payload;
      });
  },
});

export const { clearReview, addAnnotation, resolveAnnotation, handleReviewEvent } = currentReviewSlice.actions;
export default currentReviewSlice.reducer;
