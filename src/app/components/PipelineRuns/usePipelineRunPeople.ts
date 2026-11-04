import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { Member, Team } from '../../../interfaces';
import { getTeams } from '../../../services/teams';

const NO_MEMBERS: Member[] = [];

// Who a run's steps may be completed by, to name them: the project's members and teams.
export function usePipelineRunPeople(projectId: string | undefined): { members: Member[]; teams: Team[] } {
  const members = useSelector((state: RootState) => state.currentProject?.data?.members ?? NO_MEMBERS) as Member[];
  const [teams, setTeams] = useState<Team[]>([]);
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    getTeams(projectId).then(list => { if (!cancelled) setTeams(list); }).catch(() => { if (!cancelled) setTeams([]); });
    return () => { cancelled = true; };
  }, [projectId]);
  return { members, teams };
}
