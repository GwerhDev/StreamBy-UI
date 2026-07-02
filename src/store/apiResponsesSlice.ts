import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ApiResponse {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ApiResponsesState {
  responses: ApiResponse[];
  nextId: number;
}

const initialState: ApiResponsesState = {
  responses: [],
  nextId: 0,
};

const apiResponsesSlice = createSlice({
  name: 'apiResponses',
  initialState,
  reducers: {
    addApiResponse: (state, action: PayloadAction<{ message: string; type: 'success' | 'error' }>) => {
      const newResponse: ApiResponse = {
        id: String(state.nextId),
        ...action.payload,
      };
      state.nextId++;
      state.responses.push(newResponse);
    },
    removeApiResponse: (state, action: PayloadAction<string>) => {
      state.responses = state.responses.filter((response) => response.id !== action.payload);
    },
    clearApiResponses: (state) => {
      state.responses = [];
    },
  },
});

export const { addApiResponse, removeApiResponse, clearApiResponses } = apiResponsesSlice.actions;
export default apiResponsesSlice.reducer;
