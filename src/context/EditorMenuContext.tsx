import { createContext, useContext, useState } from 'react';

interface EditorMenuCtx {
  menuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
  openMenu: () => void;
}

const EditorMenuContext = createContext<EditorMenuCtx>({
  menuOpen: true,
  toggleMenu: () => { },
  closeMenu: () => { },
  openMenu: () => { }
});

export const EditorMenuProvider = ({ children }: { children: React.ReactNode }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <EditorMenuContext.Provider value={{ menuOpen, toggleMenu: () => setMenuOpen(o => !o), openMenu: () => setMenuOpen(true), closeMenu: () => setMenuOpen(false) }}>
      {children}
    </EditorMenuContext.Provider>
  );
};

//eslint-disable-next-line
export const useEditorMenu = () => useContext(EditorMenuContext);
