import { ApiTokenKind, ApiTokenPermission } from '../../../interfaces';

export interface PermissionGroup {
  resource: string;
  label: string;
  description: string;
  actions: { permission: ApiTokenPermission; label: string }[];
  // Account permissions: a user's token only.
  account?: boolean;
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    resource: 'project', label: 'Project', description: 'Its details, settings and connections',
    actions: [
      { permission: 'project:read', label: 'Read' },
      { permission: 'project:update', label: 'Update' },
      { permission: 'project:delete', label: 'Delete' },
    ],
  },
  {
    resource: 'members', label: 'Members', description: 'Who is in the project, and their roles',
    actions: [
      { permission: 'members:read', label: 'Read' },
      { permission: 'members:manage', label: 'Manage' },
    ],
  },
  {
    resource: 'assets', label: 'Assets', description: 'Files, folders, metadata and reviews',
    actions: [
      { permission: 'assets:read', label: 'Read' },
      { permission: 'assets:write', label: 'Write' },
      { permission: 'assets:delete', label: 'Delete' },
    ],
  },
  {
    resource: 'production', label: 'Production', description: 'Sequences, shots and tasks',
    actions: [
      { permission: 'production:read', label: 'Read' },
      { permission: 'production:write', label: 'Write' },
      { permission: 'production:delete', label: 'Delete' },
    ],
  },
  {
    resource: 'workflow', label: 'Workflow', description: 'The workflow and its pipelines',
    actions: [
      { permission: 'workflow:read', label: 'Read' },
      { permission: 'workflow:write', label: 'Write' },
    ],
  },
  {
    resource: 'exports', label: 'Exports', description: 'Published endpoints',
    actions: [
      { permission: 'exports:read', label: 'Read' },
      { permission: 'exports:write', label: 'Write' },
    ],
  },
  {
    resource: 'rights', label: 'Rights', description: "Assets' licenses and restrictions",
    actions: [
      { permission: 'rights:read', label: 'Read' },
      { permission: 'rights:write', label: 'Write' },
    ],
  },
  {
    resource: 'jobs', label: 'Jobs', description: 'Transcoding, rendering, AI and publishing',
    actions: [
      { permission: 'jobs:read', label: 'Read' },
      { permission: 'jobs:run', label: 'Run' },
    ],
  },
  {
    resource: 'docs', label: 'Documents', description: "The project's documents and their history",
    actions: [
      { permission: 'docs:read', label: 'Read' },
      { permission: 'docs:write', label: 'Write' },
      { permission: 'docs:delete', label: 'Delete' },
    ],
  },
  {
    resource: 'account', label: 'Account', description: 'Creating projects', account: true,
    actions: [{ permission: 'projects:create', label: 'Create projects' }],
  },
];

export const groupsFor = (kind: ApiTokenKind) => PERMISSION_GROUPS.filter(g => kind === 'user' || !g.account);

const projectPermissions = PERMISSION_GROUPS.filter(g => !g.account).flatMap(g => g.actions.map(a => a.permission));
const reads = projectPermissions.filter(p => p.endsWith(':read'));
const edits = projectPermissions.filter(p => !p.endsWith(':delete') && p !== 'members:manage');

export type PermissionLevel = 'read' | 'edit' | 'admin' | 'custom';

// The levels a token starts from; deleting and managing members come only with admin, or one by one.
export const levelPermissions = (level: Exclude<PermissionLevel, 'custom'>, kind: ApiTokenKind): ApiTokenPermission[] => {
  if (level === 'read') return reads;
  if (level === 'edit') return edits;
  return kind === 'user' ? [...projectPermissions, 'projects:create'] : projectPermissions;
};

/** The level a set of permissions is exactly, or 'custom'. */
export const levelOf = (permissions: ApiTokenPermission[], kind: ApiTokenKind): PermissionLevel => {
  const same = (other: ApiTokenPermission[]) => other.length === permissions.length && other.every(p => permissions.includes(p));
  return (['read', 'edit', 'admin'] as const).find(level => same(levelPermissions(level, kind))) ?? 'custom';
};

export const LEVEL_OPTIONS: { value: PermissionLevel; label: string }[] = [
  { value: 'read', label: 'Read: sees everything, changes nothing' },
  { value: 'edit', label: 'Edit: reads and changes, deletes nothing' },
  { value: 'admin', label: 'Admin: everything, deleting included' },
  { value: 'custom', label: 'Custom' },
];

export const LEVEL_LABEL: Record<PermissionLevel, string> = { read: 'Read', edit: 'Edit', admin: 'Admin', custom: 'Custom' };

// Destructive or broad: called out when chosen, as what they let a token do.
export const RISKY_ACTIONS: Partial<Record<ApiTokenPermission, string>> = {
  'project:delete': 'delete the project',
  'members:manage': 'manage its members',
  'assets:delete': 'delete assets',
  'production:delete': 'delete sequences, shots and tasks',
  'docs:delete': 'delete documents',
};
export const RISKY_PERMISSIONS = Object.keys(RISKY_ACTIONS) as ApiTokenPermission[];

/** "a, b and c". */
export const listOf = (items: string[]) =>
  items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items.join('');
