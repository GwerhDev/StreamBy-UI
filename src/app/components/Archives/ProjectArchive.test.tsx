import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ProjectArchive } from './ProjectArchive';

const makeStore = (projects: { id: string; name: string; archived: boolean }[]) =>
  configureStore({
    reducer: {
      projects: () => ({ list: projects, loading: false, error: null }),
    },
  });

const archivedProject = { id: 'p1', name: 'Old Project', archived: true };
const activeProject   = { id: 'p2', name: 'Active Project', archived: false };

const renderArchive = (projects = [archivedProject]) =>
  render(
    <Provider store={makeStore(projects)}>
      <MemoryRouter>
        <ProjectArchive />
      </MemoryRouter>
    </Provider>,
  );

describe('ProjectArchive', () => {
  it('renders the section header when archived projects exist', () => {
    renderArchive();
    expect(screen.getByText('Archive Enemy')).toBeInTheDocument();
  });

  it('renders archived project names', () => {
    renderArchive();
    expect(screen.getByTitle('Old Project')).toBeInTheDocument();
  });

  it('shows EmptyBackground when no archived projects', () => {
    const { container } = renderArchive([activeProject]);
    expect(screen.queryByText('Archive Enemy')).not.toBeInTheDocument();
    expect(container.firstChild).toBeInTheDocument();
  });

  it('does not render active projects', () => {
    renderArchive([archivedProject, activeProject]);
    expect(screen.queryByTitle('Active Project')).not.toBeInTheDocument();
  });
});
