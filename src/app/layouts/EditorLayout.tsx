import { Outlet, useParams } from 'react-router-dom';
import { LateralMenu } from '../components/LateralMenu/LateralMenu';
import { useEffect } from 'react';
import { useEditorMenu } from '../../context/EditorMenuContext';
import { useProjectInit } from '../../hooks/useProjectInit';

export default function EditorLayout() {
  const { projectId } = useParams<{ projectId: string }>();
  const { closeMenu } = useEditorMenu();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { closeMenu(); }, []);

  useProjectInit(projectId);

  return (
    <div className="dashboard-sections">
      <LateralMenu />
      <Outlet />
    </div>
  );
}
