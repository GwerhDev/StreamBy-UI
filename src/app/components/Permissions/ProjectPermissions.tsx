import s from './ProjectPermissions.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { faFloppyDisk, faPlug, faRotateLeft, faShield, faUserShield, faUsers } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch, RootState } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { ActionRole, ProjectPermissionsConfig, Team } from '../../../interfaces';
import { getProjectPermissions, saveProjectPermissions } from '../../../services/permissions';
import { getTeams } from '../../../services/teams';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { Accordion } from '../Accordion/Accordion';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { RolePermissions } from './RolePermissions';
import { TeamPermissions } from './TeamPermissions';
import { AppPermissions } from './AppPermissions';

const toggled = (list: string[], item: string, on: boolean) => (on ? [...list.filter(x => x !== item), item] : list.filter(x => x !== item));

// What each role can do in the project, what its teams add for their editors, and what the apps
// its members connect (OAuth, e.g. Claude) can do over what they're approved for. It loads and
// saves them; each section only shows and edits. Its admins change them; others see them.
export const ProjectPermissions = () => {
  const { id: projectId = '' } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const userId = useSelector((state: RootState) => state.session.userId);
  const currentProject = useSelector((state: RootState) => state.currentProject.data);
  const isAdmin = currentProject?.members?.find(m => m.userId === userId)?.role === 'admin';

  const [saved, setSaved] = useState<ProjectPermissionsConfig | null>(null);
  const [draft, setDraft] = useState<ProjectPermissionsConfig | null>(null);
  const [actions, setActions] = useState<string[]>([]);
  const [appPermissions, setAppPermissions] = useState<string[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    Promise.all([getProjectPermissions(projectId), getTeams(projectId).catch(() => [] as Team[])])
      .then(([answer, found]) => {
        if (cancelled) return;
        setSaved(answer.permissions);
        setDraft(answer.permissions);
        setActions(answer.actions);
        setAppPermissions(answer.appPermissions);
        setTeams(found);
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [projectId]);

  const changed = !!saved && !!draft && JSON.stringify(saved) !== JSON.stringify(draft);
  const change = (update: (d: ProjectPermissionsConfig) => ProjectPermissionsConfig) => setDraft(d => (d ? update(d) : d));
  const setRole = (action: string, role: ActionRole) => change(d => ({ ...d, roles: { ...d.roles, [action]: role } }));
  const toggleTeam = (teamId: string, action: string, on: boolean) =>
    change(d => ({ ...d, teams: { ...d.teams, [teamId]: toggled(d.teams[teamId] ?? [], action, on) } }));
  const toggleApp = (permission: string, on: boolean) => change(d => ({ ...d, apps: toggled(d.apps, permission, on) }));

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      // A team with nothing left adds nothing: not sent.
      const teamsAdding = Object.fromEntries(Object.entries(draft.teams).filter(([, list]) => list.length));
      const answer = await saveProjectPermissions(projectId, { roles: draft.roles, teams: teamsAdding, apps: draft.apps });
      setSaved(answer);
      setDraft(answer);
      dispatch(addApiResponse({ message: 'Permissions saved.', type: 'success' }));
    } catch (err) {
      dispatch(addApiResponse({ message: err instanceof Error && err.message ? err.message : 'Failed to save the permissions.', type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

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
              icon={faUserShield} title="Roles"
              description="Admins can do everything, and viewers only see. Managing members and deleting the project are always the admins'."
            >
              <RolePermissions actions={actions} roles={draft.roles} editable={isAdmin} onChange={setRole} />
            </Accordion>
            <Accordion
              icon={faUsers} title="Teams"
              description="What a team adds for the editors in it, over what editors can do. A viewer in a team still only sees."
            >
              <TeamPermissions teams={teams} actions={actions} roles={draft.roles} grants={draft.teams} editable={isAdmin} onToggle={toggleTeam} />
            </Accordion>
            <Accordion
              icon={faPlug} title="Connected apps"
              description="Apps your members connect, such as Claude, make and change things but never delete nor publish. Here they can also do what's checked, in this project only, and never more than their user's role allows."
            >
              <AppPermissions appPermissions={appPermissions} granted={draft.apps} editable={isAdmin} onToggle={toggleApp} />
            </Accordion>

            {isAdmin ? (
              <div className={s.actions}>
                <ActionButton icon={faFloppyDisk} text={saving ? 'Saving…' : 'Save'} disabled={!changed || saving} onClick={save} />
                <SecondaryButton icon={faRotateLeft} text="Discard" disabled={!changed || saving} onClick={() => setDraft(saved)} />
              </div>
            ) : (
              <p className={s.note}>Only the project's admins change them.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
