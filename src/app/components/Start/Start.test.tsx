import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { Start } from './Start';

const makeStore = (list: object[], loading = false) =>
  configureStore({
    reducer: {
      projects: () => ({ list, loading, error: null }),
    },
  });

const projects = [
  { id: 'p1', name: 'Alpha', archived: false },
  { id: 'p2', name: 'Beta', archived: false },
  { id: 'p3', name: 'Old', archived: true },
];

const renderStart = (list = projects, loading = false) =>
  render(
    <Provider store={makeStore(list, loading)}>
      <MemoryRouter>
        <Start />
      </MemoryRouter>
    </Provider>
  );

describe('Start', () => {
  it('renders empty state when no projects', () => {
    renderStart([]);
    expect(screen.getByText('Born to Dev')).toBeInTheDocument();
    expect(screen.getByText('Create project')).toBeInTheDocument();
  });

  it('renders project cards when projects exist', () => {
    renderStart();
    expect(screen.getByTitle('Alpha')).toBeInTheDocument();
    expect(screen.getByTitle('Beta')).toBeInTheDocument();
  });

  it('does not render archived projects', () => {
    renderStart();
    expect(screen.queryByTitle('Old')).not.toBeInTheDocument();
  });

  it('renders loading skeleton when loading', () => {
    const { container } = renderStart([], true);
    expect(screen.getByText('Searching...')).toBeInTheDocument();
    const skeletons = container.querySelectorAll('li');
    expect(skeletons.length).toBe(3);
  });

  it('renders create new project item in non-empty list', () => {
    renderStart();
    expect(screen.getByText('Create a new Project')).toBeInTheDocument();
  });
});
