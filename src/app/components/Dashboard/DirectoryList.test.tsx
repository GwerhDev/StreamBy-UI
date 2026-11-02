import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import currentProject, { setCurrentProject } from '../../../store/currentProjectSlice';
import { Project } from '../../../interfaces';
import { DirectoryList } from './DirectoryList';

const renderList = (loaded?: string) => {
  const store = configureStore({ reducer: { currentProject } });
  if (loaded) store.dispatch(setCurrentProject({ id: loaded, name: 'Demo', public: false } as Project));
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/project/p1/dashboard']}>
        <Routes>
          <Route path="/project/:id/dashboard" element={<DirectoryList list={[{ name: 'Members', path: 'dashboard/members' }]} />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return screen.getByRole('link', { name: 'Members' }).getAttribute('href');
};

describe('DirectoryList', () => {
  it("links to the URL's project before its data loads", () => {
    expect(renderList()).toBe('/project/p1/dashboard/members');
  });

  it("links to the URL's project while another's data is still there", () => {
    expect(renderList('p9')).toBe('/project/p1/dashboard/members');
  });
});
