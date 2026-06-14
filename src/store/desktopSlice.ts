import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DesktopState {
  minimized: boolean;
}

const initialState: DesktopState = { minimized: false };

export const desktopSlice = createSlice({
  name: 'desktop',
  initialState,
  reducers: {
    toggleMinimized: state => { state.minimized = !state.minimized; },
    setMinimized: (state, action: PayloadAction<boolean>) => { state.minimized = action.payload; },
  },
});

export const { toggleMinimized, setMinimized } = desktopSlice.actions;
export default desktopSlice.reducer;
