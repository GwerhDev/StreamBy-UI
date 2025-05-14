import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Session = {
  logged: boolean;
  loader: boolean;
  userId?: string;
  role?: string;
  username?: string;
  profilePic?: string;
};

const initialState: Session = { logged: false, loader: true };

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSession: (_, action: PayloadAction<Session>) => action.payload,
    clearSession: () => (window.location.href = '/login', { logged: false, loader: true }),
    setLoader: (state, action: PayloadAction<boolean>) => {
      state.loader = action.payload;
    },
  },
});

export const { setSession, clearSession, setLoader } = sessionSlice.actions;
export default sessionSlice.reducer;
