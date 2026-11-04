import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UpdateProjectForm } from './UpdateProjectForm';
import * as projects from '../../../services/projects';
import * as production from '../../../services/production';

const PROJECT = {
  id: 'p1', name: 'World of Gwerh', description: '', public: true, category: null,
  members: [{ userId: 'u1', role: 'admin', status: 'active' }, { userId: 'u2', role: 'editor', status: 'active' }],
};

const renderForm = (userId = 'u1') => {
  const store = configureStore({
    reducer: {
      currentProject: () => ({ data: PROJECT, loading: false, error: null }),
      management: () => ({ integrations: [] }),
      session: () => ({ logged: true, loader: false, username: 'ada', userId, plan: 'subscriber' }),
      apiResponses: () => ({ responses: [] }),
    },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/project/p1/dashboard/overview/edit']}>
        <Routes>
          <Route path="/project/:id/dashboard/overview/edit" element={<UpdateProjectForm />} />
          <Route path="*" element={<p>Left the form</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(projects, 'updateProject').mockResolvedValue({ projectId: 'p1' } as never);
  vi.spyOn(production, 'getBoard').mockResolvedValue({ columns: [], key: 'WOG' });
});

describe('UpdateProjectForm', () => {
  it("shows the project's details to edit", async () => {
    renderForm();
    expect(screen.getByLabelText("Project's name")).toHaveValue('World of Gwerh');
  });

  it("an admin changes the project's card key, saved with the rest", async () => {
    const setKey = vi.spyOn(production, 'setCardKey').mockResolvedValue('WG');
    renderForm();
    const user = userEvent.setup();
    const key = await screen.findByLabelText(/Card key/);
    await waitFor(() => expect(key).toHaveValue('WOG'));
    await user.clear(key);
    await user.type(key, 'wg');
    expect(key).toHaveValue('WG');
    await user.click(screen.getByRole('button', { name: /Update/ }));
    await waitFor(() => expect(setKey).toHaveBeenCalledWith('p1', 'WG'));
  });

  it("doesn't save the key when it's the same", async () => {
    const setKey = vi.spyOn(production, 'setCardKey');
    renderForm();
    const user = userEvent.setup();
    await waitFor(() => expect(screen.getByLabelText(/Card key/)).toHaveValue('WOG'));
    await user.click(screen.getByRole('button', { name: /Update/ }));
    await waitFor(() => expect(projects.updateProject).toHaveBeenCalled());
    expect(setKey).not.toHaveBeenCalled();
  });

  it('an admin names its sequences and shots; only the names changed are saved', async () => {
    vi.spyOn(production, 'getBoard').mockResolvedValue({ columns: [], key: 'WOG', labels: { sequence: 'Sequence', sequences: 'Sequences', shot: 'Shot', shots: 'Shots' } });
    const setLabels = vi.spyOn(production, 'setProductionLabels').mockResolvedValue({ sequence: 'Set', sequences: 'Sets', shot: 'Shot', shots: 'Shots' });
    renderForm();
    const user = userEvent.setup();
    const one = await screen.findByLabelText('A sequence is called');
    await waitFor(() => expect(one).toHaveValue('Sequence'));
    await user.clear(one);
    await user.type(one, 'Set');
    await user.clear(screen.getByLabelText('Sequences are called'));
    await user.type(screen.getByLabelText('Sequences are called'), 'Sets');
    await user.click(screen.getByRole('button', { name: /Update/ }));
    await waitFor(() => expect(setLabels).toHaveBeenCalledWith('p1', { sequence: 'Set', sequences: 'Sets' }));
  });

  it("doesn't save the names when none changed", async () => {
    const setLabels = vi.spyOn(production, 'setProductionLabels');
    vi.spyOn(production, 'getBoard').mockResolvedValue({ columns: [], key: 'WOG', labels: { sequence: 'Set', sequences: 'Sets', shot: 'Asset', shots: 'Assets' } });
    renderForm();
    await waitFor(() => expect(screen.getByLabelText('A shot is called')).toHaveValue('Asset'));
    await userEvent.setup().click(screen.getByRole('button', { name: /Update/ }));
    await waitFor(() => expect(projects.updateProject).toHaveBeenCalled());
    expect(setLabels).not.toHaveBeenCalled();
  });

  it("isn't offered to who isn't an admin", async () => {
    renderForm('u2');
    expect(screen.getByLabelText("Project's name")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Card key/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('A shot is called')).not.toBeInTheDocument();
    expect(production.getBoard).not.toHaveBeenCalled();
  });
});
