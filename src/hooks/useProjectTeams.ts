import { useEffect, useState } from 'react';
import { getTeams } from '../services/teams';
import { Team } from '../interfaces';

// A project's teams (who can be given work, with its members), and a name for any team id.
export function useProjectTeams(projectId: string) {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    let cancelled = false;
    getTeams(projectId)
      .then(found => { if (!cancelled) setTeams(found); })
      .catch(() => { if (!cancelled) setTeams([]); });
    return () => { cancelled = true; };
  }, [projectId]);

  const teamName = (teamId: string) => teams.find(t => t.id === teamId)?.name ?? 'Deleted team';
  return { teams, teamName };
}
