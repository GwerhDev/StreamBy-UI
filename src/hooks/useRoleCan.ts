import { useEffect, useState } from 'react';
import { getProjectPermissions } from '../services/permissions';

/**
 * Whether a role may do an action in a project, as the project sets it (its Permissions): an
 * admin always, a viewer never, an editor if the project lets editors. Only an editor's needs
 * asking the project.
 */
export function useRoleCan(projectId: string | undefined, role: string | undefined, action: string): boolean {
  const [editorsMay, setEditorsMay] = useState(false);
  useEffect(() => {
    if (!projectId || role !== 'editor') return;
    let cancelled = false;
    getProjectPermissions(projectId)
      .then(({ permissions }) => { if (!cancelled) setEditorsMay(permissions.roles[action] === 'editor'); })
      .catch(() => { if (!cancelled) setEditorsMay(false); });
    return () => { cancelled = true; };
  }, [projectId, role, action]);
  if (role === 'admin') return true;
  return role === 'editor' && editorsMay;
}
