import { ActionRole } from '../../../interfaces';

// What each action a role (or a team) may be let do is.
export const ACTIONS: Record<string, { area: string; label: string }> = {
  'project:update': { area: 'Project', label: 'Change its details and settings' },
  'teams:manage': { area: 'Teams', label: 'Make, change and delete teams' },
  'assets:write': { area: 'Assets', label: 'Upload and change files' },
  'assets:delete': { area: 'Assets', label: 'Delete files' },
  'production:write': { area: 'Production', label: 'Make and change sequences, shots, tasks and columns' },
  'production:delete': { area: 'Production', label: 'Delete sequences, shots, tasks and columns' },
  'workflow:write': { area: 'Workflow', label: 'Change the workflow and its pipelines' },
  'exports:write': { area: 'Exports', label: 'Make and change exports' },
  'rights:write': { area: 'Rights', label: "Set assets' license metadata" },
  'jobs:run': { area: 'Jobs', label: 'Start jobs' },
  'docs:write': { area: 'Documents', label: 'Write and move documents' },
  'docs:publish': { area: 'Documents', label: 'Publish documents' },
  'docs:delete': { area: 'Documents', label: 'Delete documents' },
};

// What a project may add for its apps.
export const APP_LABEL: Record<string, string> = {
  'assets:delete': 'Delete files',
  'production:delete': 'Delete sequences, shots, tasks and columns',
  'docs:publish': 'Publish documents',
  'docs:delete': 'Delete documents',
  'members:manage': 'Manage teams',
};

export const WHO: { value: ActionRole; label: string }[] = [
  { value: 'editor', label: 'Editors and admins' },
  { value: 'admin', label: 'Admins only' },
];
