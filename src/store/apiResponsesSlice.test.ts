import reducer, {
  addApiResponse,
  removeApiResponse,
  clearApiResponses,
} from './apiResponsesSlice';

const initialState = { responses: [] };

describe('apiResponsesSlice', () => {
  describe('addApiResponse', () => {
    it('appends a response with a generated id', () => {
      const state = reducer(initialState, addApiResponse({ message: 'Saved', type: 'success' }));
      expect(state.responses).toHaveLength(1);
      expect(state.responses[0].message).toBe('Saved');
      expect(state.responses[0].type).toBe('success');
      expect(typeof state.responses[0].id).toBe('string');
      expect(state.responses[0].id.length).toBeGreaterThan(0);
    });

    it('each response gets a unique id', () => {
      let state = reducer(initialState, addApiResponse({ message: 'A', type: 'success' }));
      state = reducer(state, addApiResponse({ message: 'B', type: 'error' }));
      expect(state.responses[0].id).not.toBe(state.responses[1].id);
    });

    it('accumulates multiple responses', () => {
      let state = reducer(initialState, addApiResponse({ message: 'A', type: 'success' }));
      state = reducer(state, addApiResponse({ message: 'B', type: 'error' }));
      expect(state.responses).toHaveLength(2);
    });
  });

  describe('removeApiResponse', () => {
    it('removes the response with the matching id', () => {
      let state = reducer(initialState, addApiResponse({ message: 'X', type: 'success' }));
      const id = state.responses[0].id;
      state = reducer(state, removeApiResponse(id));
      expect(state.responses).toHaveLength(0);
    });

    it('leaves other responses intact', () => {
      let state = reducer(initialState, addApiResponse({ message: 'A', type: 'success' }));
      state = reducer(state, addApiResponse({ message: 'B', type: 'error' }));
      const idA = state.responses[0].id;
      state = reducer(state, removeApiResponse(idA));
      expect(state.responses).toHaveLength(1);
      expect(state.responses[0].message).toBe('B');
    });

    it('is a no-op for unknown id', () => {
      let state = reducer(initialState, addApiResponse({ message: 'A', type: 'success' }));
      state = reducer(state, removeApiResponse('nonexistent'));
      expect(state.responses).toHaveLength(1);
    });
  });

  describe('clearApiResponses', () => {
    it('empties the responses array', () => {
      let state = reducer(initialState, addApiResponse({ message: 'A', type: 'success' }));
      state = reducer(state, addApiResponse({ message: 'B', type: 'error' }));
      state = reducer(state, clearApiResponses());
      expect(state.responses).toHaveLength(0);
    });

    it('is safe to call on empty state', () => {
      const state = reducer(initialState, clearApiResponses());
      expect(state.responses).toHaveLength(0);
    });
  });
});
