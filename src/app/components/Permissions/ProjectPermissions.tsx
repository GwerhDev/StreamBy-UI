import s from './ProjectPermissions.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { faPlug, faShield, faUserShield, faUsers } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch, RootState } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { ActionRole, ProjectPermissionsConfig, Team } from '../../../interfaces';
import { getProjectPermissions, saveProjectPermissions } from '../../../services/permissions';
import { getTeams } from '../../../services/teams';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { Accordion } from '../Accordion/Accordion';
import { RolePermissions } from './RolePermissions';
import { TeamPermissions } from './TeamPermissions';
import { AppPermissions } from './AppPermissions';

const toggled = (list: string[], item: string, on: boolean) => (on ? [...list.filter(x => x !== item), item] : list.filter(x => x !== item));

// What each role can do in the project, what its teams add for their editors, and what the apps
// its members connect (OAuth, e.g. Claude) can do over what they're approved for. It loads and
// saves them; each section only shows and edits. Its admins change them, each change saved as
// it's made; others see them.
export const ProjectPermissions = () => {
  const { id: projectId = '' } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const userId = useSelector((state: RootState) => state.session.userId);
  const currentProject = useSelector((state: RootState) => state.currentProject.data);
  const isAdmin = currentProject?.members?.find(m => m.userId === userId)?.role === 'admin';

  const [draft, setDraft] = useState<ProjectPermissionsConfig | null>(null);
  const [actions, setActions] = useState<string[]>([]);
  const [appPermissions, setAppPermissions] = useState<string[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [failed, setFailed] = useState(false);
  // What the server has, what's shown (the last change made), and whether a save is on its way:
  // a change made while one is saves after it, with every change made meanwhile.
  const saved = useRef<ProjectPermissionsConfig | null>(null);
  const latest = useRef<ProjectPermissionsConfig | null>(null);
  const saving = useRef(false);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    Promise.all([getProjectPermissions(projectId), getTeams(projectId).catch(() => [] as Team[])])
      .then(([answer, found]) => {
        if (cancelled) return;
        saved.current = answer.permissions;
        latest.current = answer.permissions;
        setDraft(answer.permissions);
        setActions(answer.actions);
        setAppPermissions(answer.appPermissions);
        setTeams(found);
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [projectId]);

  const persist = async () => {
    if (saving.current) return;
    saving.current = true;
    try {
      while (latest.current && latest.current !== saved.current) {
        const sending = latest.current;
        // A team with nothing left adds nothing: not sent.
        const teamsAdding = Object.fromEntries(Object.entries(sending.teams).filter(([, list]) => list.length));
        try {
          const answer = await saveProjectPermissions(projectId, { roles: sending.roles, teams: teamsAdding, apps: sending.apps });
          saved.current = answer;
          if (latest.current === sending) { latest.current = answer; setDraft(answer); }
        } catch (err) {
          // Back to what's saved: what's shown is what the project has.
          latest.current = saved.current;
          setDraft(saved.current);
          dispatch(addApiResponse({ message: err instanceof Error && err.message ? err.message : 'Failed to save the permissions.', type: 'error' }));
          return;
        }
      }
      dispatch(addApiResponse({ message: 'Permissions saved.', type: 'success' }));
    } finally {
      saving.current = false;
    }
  };

  const change = (update: (d: ProjectPermissionsConfig) => ProjectPermissionsConfig) => {
    if (!latest.current) return;
    latest.current = update(latest.current);
    setDraft(latest.current);
    void persist();
  };
  const setRole = (action: string, role: ActionRole) => change(d => ({ ...d, roles: { ...d.roles, [action]: role } }));
  const toggleTeam = (teamId: string, action: string, on: boolean) =>
    change(d => ({ ...d, teams: { ...d.teams, [teamId]: toggled(d.teams[teamId] ?? [], action, on) } }));
  const toggleApp = (permission: string, on: boolean) => change(d => ({ ...d, apps: toggled(d.apps, permission, on) }));

  return (
    <div className={s.container}>
      <SectionHeader icon={faShield} title="Permissions" subtitle="What each role can do in this project." />
      <div className={s.column}>
        {failed ? (
          <p className={s.note}>The permissions couldn't be loaded.</p>
        ) : !draft ? (
          <div className={s.loading} data-testid="permissions-skeleton" aria-busy="true">
            {Array.from({ length: 3 }, (_, i) => <span key={i} className={`${s.skeletonRow} ${skeleton.skeleton}`} />)}
          </div>
        ) : (
          <>
            <Accordion
              icon={faUserShield} title="Roles" defaultOpen={false}
              description="Admins can do everything, and viewers only see. Managing members and deleting the project are always the admins'."
            >
              <RolePermissions actions={actions} roles={draft.roles} editable={isAdmin} onChange={setRole} />
            </Accordion>
            <Accordion
              icon={faUsers} title="Teams" defaultOpen={false}
              description="What a team adds for the editors in it, over what editors can do. A viewer in a team still only sees."
            >
              <TeamPermissions teams={teams} actions={actions} roles={draft.roles} grants={draft.teams} editable={isAdmin} onToggle={toggleTeam} />
            </Accordion>
            <Accordion
              icon={faPlug} title="Connected apps" defaultOpen={false}
              description="Apps your members connect, such as Claude, make and change things but never delete nor publish. Here they can also do what's checked, in this project only, and never more than their user's role allows."
            >
              <AppPermissions appPermissions={appPermissions} granted={draft.apps} editable={isAdmin} onToggle={toggleApp} />
            </Accordion>

            {!isAdmin && <p className={s.note}>Only the project's admins change them.</p>}
          </>
        )}
      </div>
    </div>
  );
};
