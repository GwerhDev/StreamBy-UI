import { createContext } from 'react';

export const NodeEditContext = createContext({
  editMode: false,
  connectedHandles: new Map<string, Set<string>>(),
});
