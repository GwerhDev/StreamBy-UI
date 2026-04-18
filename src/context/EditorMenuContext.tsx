import { createContext, useContext, useState } from 'react';

interface EditorMenuCtx {
  menuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
}

const EditorMenuContext = createContext<EditorMenuCtx>({
  menuOpen: false,
  toggleMenu: () => {},
  closeMenu: () => {},
});

export const EditorMenuProvider = ({ children }: { children: React.ReactNode }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <EditorMenuContext.Provider value={{ menuOpen, toggleMenu: () => setMenuOpen(o => !o), closeMenu: () => setMenuOpen(false) }}>
      {children}
    </EditorMenuContext.Provider>
  );
};

export const useEditorMenu = () => useContext(EditorMenuContext);
