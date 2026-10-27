import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DocumentEvent, DocumentSummary, ProjectDocument } from '../interfaces';
import { getDocuments } from '../services/documents';

// The documents of the project being seen (the tree, no contents): shared by the lateral menu
// and the Documents pages. `lastEvent` is the latest change someone made, as the websocket
// brought it: an open document reacts to it.
interface DocumentsState {
  projectId: string | null;
  // null until loaded.
  list: DocumentSummary[] | null;
  loading: boolean;
  lastEvent: DocumentEvent | null;
}

const initialState: DocumentsState = { projectId: null, list: null, loading: false, lastEvent: null };

export const fetchDocuments = createAsyncThunk(
  'documents/fetch',
  (projectId: string) => getDocuments(projectId),
  {
    // The menu and a page may ask at once: one request.
    condition: (projectId, { getState }) => {
      const { documents } = getState() as { documents: DocumentsState };
      return !(documents.loading && documents.projectId === projectId);
    },
  },
);

const summaryOf = ({ content: _content, ...summary }: ProjectDocument | DocumentSummary & { content?: string }): DocumentSummary => summary;

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    // A document as saved, created or moved here: into the tree, in its place.
    upsertDocument(state, action: PayloadAction<ProjectDocument | DocumentSummary>) {
      if (!state.list || action.payload.projectId !== state.projectId) return;
      const summary = summaryOf(action.payload);
      const i = state.list.findIndex(d => d.id === summary.id);
      if (i === -1) state.list.push(summary);
      else state.list[i] = summary;
    },
    removeDocuments(state, action: PayloadAction<string[]>) {
      if (state.list) state.list = state.list.filter(d => !action.payload.includes(d.id));
    },
    documentEventReceived(state, action: PayloadAction<DocumentEvent>) {
      state.lastEvent = action.payload;
      if (action.payload.action === 'deleted' && action.payload.projectId === state.projectId && state.list) {
        state.list = state.list.filter(d => !action.payload.documentIds.includes(d.id));
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchDocuments.pending, (state, action) => {
        if (state.projectId !== action.meta.arg) state.list = null;
        state.projectId = action.meta.arg;
        state.loading = true;
      })
      // An answer for a project no longer being seen is dropped.
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        if (action.meta.arg !== state.projectId) return;
        state.list = action.payload;
        state.loading = false;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        if (action.meta.arg !== state.projectId) return;
        state.list = state.list ?? [];
        state.loading = false;
      });
  },
});

export const { upsertDocument, removeDocuments, documentEventReceived } = documentsSlice.actions;
export default documentsSlice.reducer;

/** A folder's documents (the top's, for null), in their order. */
export const childrenOf = (list: DocumentSummary[], parentId: string | null) =>
  list.filter(d => d.parentId === parentId).sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt));

/** A document and everything inside it (a folder's documents, at any depth), the folder first. */
export const withDescendants = (list: DocumentSummary[], id: string): string[] => {
  const ids = [id];
  for (let i = 0; i < ids.length; i++) {
    for (const child of childrenOf(list, ids[i])) ids.push(child.id);
  }
  return ids;
};
