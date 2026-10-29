import { useEffect, useRef } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InitialEntry, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FormRouteProvider, useBackgroundLocation, useFormRoute, useFormSaved, useOpenForm } from '../../../hooks/useFormRoute';
import { FormModalRoutes } from './FormModalRoutes';
import { CustomForm } from '../Forms/CustomForm';

// A list and the form that makes its items, routed as the app routes them (App.tsx).
let mounts = 0;
let loads = 0;

const List = () => {
  const openForm = useOpenForm();
  const saved = useFormSaved();
  const mounted = useRef(false);
  useEffect(() => { if (!mounted.current) { mounted.current = true; mounts += 1; } }, []);
  useEffect(() => { loads += 1; }, [saved]);
  return <><p>The list</p><button onClick={() => openForm('/things/create')}>New thing</button></>;
};

const ThingForm = () => {
  const { close, done } = useFormRoute();
  return (
    <div>
      <CustomForm
        header={{ icon: faPlus, title: 'Create a thing' }}
        fields={[]}
        actions={<><button onClick={() => done('/things')}>Save</button><button onClick={() => close('/things')}>Cancel</button></>}
      />
    </div>
  );
};

const FORMS = [{ path: '/things/create', element: <ThingForm /> }];

const Routed = () => {
  const location = useLocation();
  const background = useBackgroundLocation();
  return (
    <FormRouteProvider>
      <Routes location={background ?? location}>
        <Route path="/things" element={<List />} />
        <Route path="/things/create" element={<ThingForm />} />
      </Routes>
      {background && <FormModalRoutes forms={FORMS} />}
      <p data-testid="location">{location.pathname}</p>
    </FormRouteProvider>
  );
};

const renderAt = (entry: InitialEntry, before: InitialEntry[] = []) => {
  mounts = 0;
  loads = 0;
  render(<MemoryRouter initialEntries={[...before, entry]}><Routed /></MemoryRouter>);
};
const where = () => screen.getByTestId('location').textContent;
const modal = () => screen.queryByTestId('form-modal');

describe('a form with a route of its own', () => {
  it('opened from inside the app is a modal over the screen it was opened from, at its own URL', async () => {
    renderAt('/things');
    await userEvent.click(screen.getByRole('button', { name: 'New thing' }));

    expect(where()).toBe('/things/create');
    expect(screen.getByText('The list')).toBeInTheDocument();
    // The form is the modal: its header, with a way to close it, and its actions, in it.
    const form = modal()!.querySelector('[data-form-card]') as HTMLElement;
    expect(within(form).getByText('Create a thing')).toBeInTheDocument();
    expect(within(form).getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(within(form).getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('closed (Cancel, its ×, outside it, Esc) goes back to that screen without reloading it', async () => {
    renderAt('/things');
    const user = userEvent.setup();
    for (const closeIt of [
      () => user.click(screen.getByRole('button', { name: 'Cancel' })),
      () => user.click(screen.getByRole('button', { name: 'Close' })),
      () => user.click(modal()!),
      async () => { fireEvent.keyDown(window, { key: 'Escape' }); },
    ]) {
      await user.click(screen.getByRole('button', { name: 'New thing' }));
      await act(closeIt);
      expect(where()).toBe('/things');
      expect(modal()).not.toBeInTheDocument();
    }
    expect([mounts, loads]).toEqual([1, 1]);
  });

  it('a click inside it is not outside it', async () => {
    renderAt('/things');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'New thing' }));
    await user.click(screen.getByText('Create a thing'));
    expect(where()).toBe('/things/create');
  });

  it('saved, goes back to that screen, which loads what it shows again', async () => {
    renderAt('/things');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'New thing' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(where()).toBe('/things');
    expect(modal()).not.toBeInTheDocument();
    expect([mounts, loads]).toEqual([1, 2]);
  });

  it('followed directly is a page of its own, with nothing under it', async () => {
    renderAt('/things/create');
    expect(screen.getByText('Create a thing')).toBeInTheDocument();
    expect(screen.queryByText('The list')).not.toBeInTheDocument();
    expect(modal()).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(where()).toBe('/things');
    expect(screen.getByText('The list')).toBeInTheDocument();
  });

  it('as a page, cancelled, goes to its screen, never back (followed directly, back is another site)', async () => {
    renderAt('/things/create', ['/elsewhere']);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(where()).toBe('/things');
    expect(screen.getByText('The list')).toBeInTheDocument();
  });

  it('reloaded (the navigation state kept) is a page too', () => {
    renderAt({ pathname: '/things/create', state: { backgroundLocation: { pathname: '/things', search: '', hash: '', state: null, key: 'k' } } });
    expect(where()).toBe('/things/create');
    expect(screen.getByText('Create a thing')).toBeInTheDocument();
    expect(screen.queryByText('The list')).not.toBeInTheDocument();
    expect(modal()).not.toBeInTheDocument();
  });
});
