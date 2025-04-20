import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Session = {
  logged: boolean;
  loader: boolean;
  userId?: string;
  role?: string;
  username?: string;
  profilePic?: string;
};

const initialState: Session = { logged: false, loader: false };

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSession: (_, action: PayloadAction<Session>) => action.payload,
    clearSession: () => ({ logged: false, loader: false }),
    setLoader: (state, action: PayloadAction<boolean>) => {
      state.loader = action.payload;
    },
  },
});

export const { setSession, clearSession, setLoader } = sessionSlice.actions;
export default sessionSlice.reducer;
