// Where a user's own tokens are listed, or a project's.
export const apiTokensPath = (projectId?: string) =>
  projectId ? `/project/${projectId}/settings/api-tokens` : '/user/settings/api-tokens';
