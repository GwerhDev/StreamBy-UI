import s from './ShareRunnerModal.module.css';
import { useEffect, useState } from 'react';
import { faShareNodes, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Team, WorkerRunner } from '../../../interfaces';
import { useProjects } from '../../../hooks/useProjects';
import { getTeams } from '../../../services/teams';
import { ModalShell } from '../Modals/ModalShell';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';

interface ShareRunnerModalProps {
  runner: WorkerRunner;
  busy: boolean;
  onShare: (projectId: string, teamId: string | null) => void;
  onClose: () => void;
}

const WHOLE_PROJECT = '';

// Where to share a runner: one of the user's projects, the whole of it or one of its teams.
export const ShareRunnerModal = ({ runner, busy, onShare, onClose }: ShareRunnerModalProps) => {
  const { projectList } = useProjects();
  const projects = projectList.list;
  const [projectId, setProjectId] = useState('');
  const [teamId, setTeamId] = useState(WHOLE_PROJECT);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    setTeamId(WHOLE_PROJECT);
    setTeams([]);
    if (!projectId) return;
    let cancelled = false;
    getTeams(projectId).then(list => { if (!cancelled) setTeams(list); }).catch(() => {});
    return () => { cancelled = true; };
  }, [projectId]);

  return (
    <ModalShell title={`Share ${runner.name}`} onClose={onClose}>
      <div className={s.body}>
        <p className={s.hint}>
          It shows in the project's workers, and its editors (or only a team's members) can send it jobs while you're in the project.
        </p>
        <LabeledSelect
          id="share-runner-project" htmlFor="share-runner-project" label="Project" value={projectId} disabled={busy}
          options={[{ value: '', label: 'Choose a project' }, ...projects.map(p => ({ value: p.id, label: p.name }))]}
          onChange={e => setProjectId(e.target.value)}
        />
        {projectId && (
          <LabeledSelect
            id="share-runner-team" htmlFor="share-runner-team" label="With" value={teamId} disabled={busy}
            options={[{ value: WHOLE_PROJECT, label: 'The whole project' }, ...teams.map(t => ({ value: t.id, label: `Team ${t.name}` }))]}
            onChange={e => setTeamId(e.target.value)}
          />
        )}
        <div className={s.actions}>
          <ActionButton
            icon={faShareNodes} text="Share" disabled={busy || !projectId} isLoading={busy}
            onClick={() => onShare(projectId, teamId || null)}
          />
          <SecondaryButton icon={faXmark} text="Cancel" disabled={busy} onClick={onClose} />
        </div>
      </div>
    </ModalShell>
  );
};
