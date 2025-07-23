import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Session } from '../interfaces';

const initialState: Session = { logged: false, loader: true };

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSession: (_, action: PayloadAction<Session>) => action.payload,
    clearSession: () => (window.location.href = '/unauthorized', { logged: false, loader: true }),
    setLoader: (state, action: PayloadAction<boolean>) => {
      state.loader = action.payload;
    },
  },
});

export const { setSession, clearSession, setLoader } = sessionSlice.actions;
export default sessionSlice.reducer;
