import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Session, WorkspaceMode } from '../interfaces';

const STORAGE_KEY = 'streamby-workspace-mode';

function loadMode(): WorkspaceMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'developer' || v === 'designer') return v;
  } catch { /* ignore */ }
  return 'developer';
}

const initialState: Session = { username: "", logged: false, loader: true, mode: loadMode() };

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<Session>) => ({ ...action.payload, mode: state.mode }),
    clearSession: (state) => ({ username: "", logged: false, loader: true, mode: state.mode }),
    setLoader: (state, action: PayloadAction<boolean>) => {
      state.loader = action.payload;
    },
    setMode: (state, action: PayloadAction<WorkspaceMode>) => {
      state.mode = action.payload;
      try { localStorage.setItem(STORAGE_KEY, action.payload); } catch { /* ignore */ }
    },
  },
});

export const { setSession, clearSession, setLoader, setMode } = sessionSlice.actions;
export default sessionSlice.reducer;
