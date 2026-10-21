import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiTokenCreate } from './ApiTokenCreate';
import * as apiTokensService from '../../../services/apiTokens';
import { levelPermissions } from './permissions';
import { renderAt, token } from '../../../test/apiTokens';

const Where = () => <p data-testid="location">{useLocation().pathname}</p>;
const page = (projectId?: string) => <><ApiTokenCreate projectId={projectId} /><Where /></>;

// A LabeledSelect: its trigger shows the current option; an option is chosen on mousedown.
const choose = async (current: RegExp | string, option: RegExp | string) => {
  await userEvent.setup().click(screen.getByRole('button', { name: current }));
  fireEvent.mouseDown(screen.getByText(option));
};

beforeEach(() => vi.restoreAllMocks());

describe("making a user's token", () => {
  it('makes it with what was chosen, shows it once, and goes back to the list', async () => {
    const create = vi.spyOn(apiTokensService, 'createApiToken').mockResolvedValue({ token: 'sbt_the-secret', apiToken: token({}) });
    renderAt('/user/settings/api-tokens/create', page());
    const user = userEvent.setup();
    const submit = within(screen.getByTestId('api-token-form')).getByRole('button', { name: /Create token/ });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText('Name'), 'Claude Code');
    expect(submit).toBeDisabled();
    await user.click(screen.getByLabelText('Beta'));
    expect(submit).toBeEnabled();
    await user.click(submit);

    await waitFor(() => expect(create).toHaveBeenCalledWith({
      name: 'Claude Code', permissions: levelPermissions('read', 'user'), projectIds: ['p2'], expiresInDays: 30,
    }, undefined));
    expect(await screen.findByTestId('api-token-value')).toHaveTextContent('sbt_the-secret');
    await user.click(screen.getByRole('button', { name: /Done/ }));
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/user\/settings\/api-tokens$/);
  });

  it('starts from a level, and is fine-tuned permission by permission', async () => {
    const create = vi.spyOn(apiTokensService, 'createApiToken').mockResolvedValue({ token: 'sbt_x', apiToken: token({}) });
    renderAt('/user/settings/api-tokens/create', page());
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Name'), 'Agent');
    await user.click(screen.getByLabelText(/All my projects/));

    await choose(/^Read:/, /^Edit:/);
    expect(screen.getByLabelText('Write', { selector: '#permission-assets\\:write' })).toBeChecked();
    expect(screen.getByLabelText('Delete', { selector: '#permission-assets\\:delete' })).not.toBeChecked();
    // One more makes it custom.
    await user.click(screen.getByLabelText('Delete', { selector: '#permission-assets\\:delete' }));
    expect(screen.getByRole('button', { name: 'Custom' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Create token/ }));
    await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({
      permissions: [...levelPermissions('edit', 'user'), 'assets:delete'], projectIds: '*',
    }), undefined));
  });

  it('can create projects, and then needs no project to start with', async () => {
    const create = vi.spyOn(apiTokensService, 'createApiToken').mockResolvedValue({ token: 'sbt_x', apiToken: token({}) });
    renderAt('/user/settings/api-tokens/create', page());
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Name'), 'Maker');
    await user.click(screen.getByLabelText('Create projects'));
    expect(screen.getByText('It also reaches the projects it creates.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Create token/ }));
    await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({
      permissions: expect.arrayContaining(['projects:create']), projectIds: [],
    }), undefined));
  });

  it('warns about deleting and broad permissions, and about no expiration', async () => {
    renderAt('/user/settings/api-tokens/create', page());
    expect(screen.queryByTestId('api-token-warnings')).not.toBeInTheDocument();
    await choose(/^Read:/, /^Admin:/);
    const warnings = screen.getByTestId('api-token-warnings');
    expect(warnings).toHaveTextContent('It can delete the project, manage its members, delete assets and delete sequences, shots and tasks.');
    await choose('30 days', 'No expiration');
    expect(screen.getByTestId('api-token-warnings')).toHaveTextContent('without expiration');
  });
});

describe("making a project's token", () => {
  it('tells it belongs to the project, has no account permissions, and reaches the project', async () => {
    const create = vi.spyOn(apiTokensService, 'createApiToken').mockResolvedValue({ token: 'sbt_x', apiToken: token({}) });
    renderAt('/project/p1/settings/api-tokens/create', page('p1'));
    const user = userEvent.setup();
    const warnings = screen.getByTestId('api-token-warnings');
    expect(warnings).toHaveTextContent('belongs to Alpha, not to you');
    expect(warnings).toHaveTextContent('Anyone who has it');
    expect(screen.queryByLabelText('Create projects')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/All my projects/)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Name'), 'CI');
    await user.click(screen.getByRole('button', { name: /Create token/ }));
    await waitFor(() => expect(create).toHaveBeenCalledWith({
      name: 'CI', permissions: levelPermissions('read', 'project'), expiresInDays: 30,
    }, 'p1'));
    await user.click(await screen.findByRole('button', { name: /Done/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/project/p1/settings/api-tokens');
  });
});
