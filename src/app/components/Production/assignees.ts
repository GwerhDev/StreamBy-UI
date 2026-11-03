import { ProductionShot, Team } from '../../../interfaces';

// Who a shot is assigned to, as a board finds it: the shot's people and teams, and its tasks'.
const peopleOf = (shot: ProductionShot) => new Set([...shot.assignedTo, ...(shot.taskSummary?.assignedTo ?? [])]);
const teamsOf = (shot: ProductionShot) => new Set([...(shot.teamIds ?? []), ...(shot.taskSummary?.teamIds ?? [])]);

/**
 * Whether a shot is assigned to someone: to them, or to a team they're in now (one they joined
 * after it was assigned to it too), the shot itself or one of its tasks.
 */
export function isAssignedTo(shot: ProductionShot, userId: string, teams: Team[]): boolean {
  if (peopleOf(shot).has(userId)) return true;
  const shotTeams = teamsOf(shot);
  return teams.some(team => shotTeams.has(team.id) && team.members.some(m => m.userId === userId));
}

/** Whether a shot, or one of its tasks, is assigned to a team. */
export const isAssignedToTeam = (shot: ProductionShot, teamId: string): boolean => teamsOf(shot).has(teamId);
