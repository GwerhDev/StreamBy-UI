import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AllowedOriginsList } from './AllowedOriginsList';
import currentProject from '../../../store/currentProjectSlice';
import * as projects from '../../../services/projects';

const Where = () => <p data-testid="location">{useLocation().pathname}</p>;

const renderList = (origins: string[]) => {
  const store = configureStore({
    reducer: { currentProject, apiResponses: (state = { responses: [] as unknown[] }) => state },
    preloadedState: { currentProject: { data: { id: 'p1', name: 'Portfolio', allowedOrigin: origins }, loading: false, error: null, membership: null } as never },
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/project/p1/settings/allowed-origins']}>
        <Routes>
          <Route path="/project/:id/settings/allowed-origins" element={<AllowedOriginsList />} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
};

beforeEach(() => vi.restoreAllMocks());

describe('AllowedOriginsList', () => {
  it("lists the project's allowed origins, fetched on their own", async () => {
    const fetchOrigins = vi.spyOn(projects, 'fetchProjectOrigins').mockResolvedValue(['https://nhexa.cl', 'https://gwerh.dev']);
    renderList([]);
    expect(await screen.findByText('https://gwerh.dev')).toBeInTheDocument();
    expect(screen.getByText('https://nhexa.cl')).toBeInTheDocument();
    expect(fetchOrigins).toHaveBeenCalledWith('p1');
  });

  it('adds one on its own page, under Allowed Origins', async () => {
    vi.spyOn(projects, 'fetchProjectOrigins').mockResolvedValue([]);
    renderList([]);
    await userEvent.setup().click(await screen.findByRole('button', { name: /Add a new origin/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/project/p1/settings/allowed-origins/create');
  });
});
