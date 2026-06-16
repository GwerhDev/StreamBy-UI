import { createContext, useContext, useState } from 'react';

interface DesktopContextValue {
  minimized: boolean;
  toggleMinimized: () => void;
  setMinimized: (value: boolean) => void;
}

const DesktopContext = createContext<DesktopContextValue | null>(null);

export function DesktopProvider({ children }: { children: React.ReactNode }) {
  const [minimized, setMinimizedState] = useState(false);

  const toggleMinimized = () => setMinimizedState(v => !v);
  const setMinimized = (value: boolean) => setMinimizedState(value);

  return (
    <DesktopContext.Provider value={{ minimized, toggleMinimized, setMinimized }}>
      {children}
    </DesktopContext.Provider>
  );
}

export function useDesktop() {
  const ctx = useContext(DesktopContext);
  if (!ctx) throw new Error('useDesktop must be used within DesktopProvider');
  return ctx;
}
