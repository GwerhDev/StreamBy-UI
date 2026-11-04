import { render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import UserLayout from './UserLayout';

const renderAt = (path: string) => {
  const store = configureStore({
    reducer: {
      session: () => ({ logged: true, loader: false, username: 'dev-user', userId: 'u1' }),
      currentProject: () => ({ data: null, loading: false, error: null, membership: null }),
      workers: () => ({ list: [], projectId: null, loading: false, error: null }),
      documents: () => ({ list: [] }),
      projects: () => ({ list: [], loading: false, error: null }),
      apiResponses: () => ({ responses: [] }),
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes><Route path="/user/*" element={<UserLayout />} /></Routes>
      </MemoryRouter>
    </Provider>,
  );
};
const link = (name: string) => screen.getByRole('link', { name });

describe('UserLayout', () => {
  it("the settings' own page marks none of its categories", () => {
    renderAt('/user/settings');
    for (const name of ['Account', 'Appearance', 'Notifications', 'Editor', 'Security', 'Plan & Billing']) {
      expect(link(name).className, name).not.toMatch(/activeLink/);
    }
  });

  it('a category open is marked, and only it', () => {
    renderAt('/user/settings?tab=security');
    expect(link('Security').className).toMatch(/activeLink/);
    expect(link('Account').className).not.toMatch(/activeLink/);
  });

  it("marks the user's page open", () => {
    renderAt('/user/archive');
    expect(link('Archive').className).toMatch(/activeLink/);
    expect(link('Account').className).not.toMatch(/activeLink/);
  });
});
