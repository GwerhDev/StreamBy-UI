import { useEffect, useLayoutEffect } from 'react';
import { useSelector } from 'react-redux';
import { Start } from '../components/Start/Start';
import { HomeMenu } from '../components/LateralMenu/HomeMenu';
import { useEditorMenu } from '../../context/EditorMenuContext';
import { RootState } from '../../store';

export const Home = () => {
  const { closeMenu, openMenu } = useEditorMenu();
  const projects = useSelector((state: RootState) => state.projects);

  // Close before first paint to avoid flash
  useLayoutEffect(() => { closeMenu(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Once loading finishes, open only if no active projects
  useEffect(() => {
    if (projects.loading) return;
    const hasProjects = projects.list.filter(p => !p.archived).length > 0;
    if (!hasProjects) openMenu();
  }, [projects.loading]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="dashboard-sections">
      <HomeMenu />
      <div style={{ flexGrow: 1, minHeight: 0, overflow: 'auto' }}>
        <Start />
      </div>
    </div>
  );
};
