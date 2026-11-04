import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RolePermissions } from './RolePermissions';
import { TeamPermissions } from './TeamPermissions';
import { AppPermissions } from './AppPermissions';
import { PermissionList, PermissionRow } from './PermissionList';

const ACTIONS = ['teams:manage', 'docs:delete'];
const ROLES = { 'teams:manage': 'admin', 'docs:delete': 'editor' } as const;
const TEAMS = [
  { id: 't1', name: 'Docs', members: [], createdAt: '', updatedAt: '' },
  { id: 't2', name: 'Leads', members: [], createdAt: '', updatedAt: '' },
];

describe('PermissionRow', () => {
  it('shows what it is, its area and a hint; its label labels its control', () => {
    render(<PermissionList label="Things"><PermissionRow area="Documents" label="Delete documents" hint="Careful" controlId="x" control={<input id="x" type="checkbox" />} /></PermissionList>);
    expect(screen.getByRole('list', { name: 'Things' })).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Careful')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Delete documents/ })).toBeInTheDocument();
  });
});

describe('RolePermissions', () => {
  it('a dropdown per action for who may edit them; the change is told', () => {
    const onChange = vi.fn();
    render(<RolePermissions actions={ACTIONS} roles={{ ...ROLES }} editable onChange={onChange} />);
    const teams = screen.getByLabelText('Who can: Make, change and delete teams');
    expect(within(teams).getByRole('button')).toHaveTextContent('Admins only');
    fireEvent.click(within(teams).getByRole('button'));
    fireEvent.mouseDown(screen.getByText('Editors and admins', { selector: 'li' }));
    expect(onChange).toHaveBeenCalledWith('teams:manage', 'editor');
  });

  it("says, where managing teams is given, that teams that grant permissions stay the admins'", () => {
    render(<RolePermissions actions={ACTIONS} roles={{ ...ROLES }} editable onChange={vi.fn()} />);
    expect(screen.getByText("Teams that grant permissions stay the admins' to manage")).toBeInTheDocument();
  });

  it('only the values, to who may not', () => {
    render(<RolePermissions actions={ACTIONS} roles={{ ...ROLES }} editable={false} onChange={vi.fn()} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Admins only')).toBeInTheDocument();
    expect(screen.getByText('Editors and admins')).toBeInTheDocument();
  });

  it("leaves out an action it doesn't know", () => {
    render(<RolePermissions actions={['later:thing', 'docs:delete']} roles={{ ...ROLES }} editable onChange={vi.fn()} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });
});

describe('TeamPermissions', () => {
  it("per team, the admins' only actions it may add; one it has that editors can do now, said so", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<TeamPermissions teams={TEAMS} actions={ACTIONS} roles={{ ...ROLES }} grants={{ t1: ['teams:manage', 'docs:delete'] }} editable onToggle={onToggle} />);
    const docs = screen.getByRole('list', { name: 'What Docs adds' });
    expect(within(docs).getByRole('checkbox', { name: /Make, change and delete teams/ })).toBeChecked();
    expect(within(docs).getByRole('checkbox', { name: /Delete documents/ })).toBeChecked();
    expect(within(docs).getByText('Editors can already')).toBeInTheDocument();
    // Leads has nothing that editors can do: only the admins' action.
    const leads = screen.getByRole('list', { name: 'What Leads adds' });
    expect(within(leads).getAllByRole('checkbox')).toHaveLength(1);
    await user.click(within(leads).getByRole('checkbox', { name: /Make, change and delete teams/ }));
    expect(onToggle).toHaveBeenCalledWith('t2', 'teams:manage', true);
    await user.click(within(docs).getByRole('checkbox', { name: /Delete documents/ }));
    expect(onToggle).toHaveBeenLastCalledWith('t1', 'docs:delete', false);
  });

  it('says how to let a team do something when editors can already do it all', () => {
    render(<TeamPermissions teams={TEAMS} actions={ACTIONS} roles={{ 'teams:manage': 'editor', 'docs:delete': 'editor' }} grants={{}} editable onToggle={vi.fn()} />);
    expect(screen.getByText(/set an action as Admins only in Roles/)).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it("says it too where a team is given managing teams", () => {
    render(<TeamPermissions teams={TEAMS} actions={ACTIONS} roles={{ ...ROLES }} grants={{}} editable onToggle={vi.fn()} />);
    const docs = screen.getByRole('list', { name: 'What Docs adds' });
    expect(within(docs).getByText("Teams that grant permissions stay the admins' to manage")).toBeInTheDocument();
  });

  it('says where to make teams when there are none', () => {
    render(<TeamPermissions teams={[]} actions={ACTIONS} roles={{ ...ROLES }} grants={{}} editable onToggle={vi.fn()} />);
    expect(screen.getByText('No teams yet: make them in Members, Teams.')).toBeInTheDocument();
  });

  it("can't be changed by who may not", () => {
    render(<TeamPermissions teams={TEAMS} actions={ACTIONS} roles={{ ...ROLES }} grants={{}} editable={false} onToggle={vi.fn()} />);
    screen.getAllByRole('checkbox').forEach(box => expect(box).toBeDisabled());
  });
});

describe('AppPermissions', () => {
  it('a checkbox per permission the project may add; the change is told', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<AppPermissions appPermissions={['docs:delete', 'docs:publish']} granted={['docs:publish']} editable onToggle={onToggle} />);
    expect(screen.getByRole('checkbox', { name: 'Publish documents' })).toBeChecked();
    await user.click(screen.getByRole('checkbox', { name: 'Delete documents' }));
    expect(onToggle).toHaveBeenCalledWith('docs:delete', true);
  });

  it("can't be changed by who may not", () => {
    render(<AppPermissions appPermissions={['docs:delete']} granted={[]} editable={false} onToggle={vi.fn()} />);
    expect(screen.getByRole('checkbox', { name: 'Delete documents' })).toBeDisabled();
  });
});
