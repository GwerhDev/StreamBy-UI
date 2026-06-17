import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ProjectStats } from './ProjectStats';

const makeStore = (projectData: object | null, loading = false) =>
  configureStore({
    reducer: {
      currentProject: () => ({ data: projectData, loading, error: null, membership: null }),
    },
  });

const project = {
  id: 'p1',
  name: 'Demo',
  members: [{ id: 'u1' }, { id: 'u2' }],
  exports: [{ id: 'e1' }],
  apiConnections: [],
  credentials: [{ id: 'c1' }, { id: 'c2' }, { id: 'c3' }],
};

const renderStats = (data: object | null = project, loading = false, readonly = false) =>
  render(
    <Provider store={makeStore(data, loading)}>
      <MemoryRouter>
        <ProjectStats readonly={readonly} />
      </MemoryRouter>
    </Provider>
  );

describe('ProjectStats', () => {
  it('renders stat labels', () => {
    renderStats();
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('Exports')).toBeInTheDocument();
    expect(screen.getByText('API Connections')).toBeInTheDocument();
    expect(screen.getByText('Credentials')).toBeInTheDocument();
  });

  it('renders correct counts from project data', () => {
    renderStats();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders zeros when no project data', () => {
    renderStats(null);
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBe(4);
  });

  it('shows skeleton state when loading', () => {
    const { container } = renderStats(null, true);
    expect(container.querySelector('h4')).toBeInTheDocument();
    expect(screen.queryByText('Members')).not.toBeInTheDocument();
  });
});
