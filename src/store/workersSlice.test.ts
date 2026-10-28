import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import workers, { addWorker, clearWorkersError, fetchWorkers, removeWorker } from './workersSlice';
import * as service from '../services/workers';
import { worker } from '../test/workers';

const makeStore = () => configureStore({ reducer: { workers } });

beforeEach(() => vi.restoreAllMocks());

describe('workersSlice', () => {
  it("loads the project's workers", async () => {
    vi.spyOn(service, 'getWorkers').mockResolvedValue([worker()]);
    const store = makeStore();
    await store.dispatch(fetchWorkers('p1'));
    expect(store.getState().workers).toMatchObject({ projectId: 'p1', loading: false });
    expect(store.getState().workers.list?.map(w => w.id)).toEqual(['gltf']);
  });

  it('asks once while a load for the same project is under way', async () => {
    const get = vi.spyOn(service, 'getWorkers').mockResolvedValue([]);
    const store = makeStore();
    await Promise.all([store.dispatch(fetchWorkers('p1')), store.dispatch(fetchWorkers('p1'))]);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("forgets another project's workers, and drops an answer that comes for it late", async () => {
    let answerP1: (list: ReturnType<typeof worker>[]) => void = () => {};
    vi.spyOn(service, 'getWorkers').mockImplementation(projectId =>
      projectId === 'p1' ? new Promise(resolve => { answerP1 = resolve; }) : Promise.resolve([worker({ id: 'p2-own' })]));
    const store = makeStore();
    const late = store.dispatch(fetchWorkers('p1'));
    await store.dispatch(fetchWorkers('p2'));
    answerP1([worker({ id: 'p1-own' })]);
    await late;
    expect(store.getState().workers.projectId).toBe('p2');
    expect(store.getState().workers.list?.map(w => w.id)).toEqual(['p2-own']);
  });

  it("shows none when they can't be loaded, and keeps why for the page to tell", async () => {
    vi.spyOn(service, 'getWorkers').mockRejectedValue(new Error('down'));
    const store = makeStore();
    await store.dispatch(fetchWorkers('p1'));
    expect(store.getState().workers).toMatchObject({ list: [], loading: false, error: 'down' });
    store.dispatch(clearWorkersError());
    expect(store.getState().workers.error).toBeNull();
  });

  it("doesn't take a load skipped for one under way for a failure", async () => {
    vi.spyOn(service, 'getWorkers').mockResolvedValue([]);
    const store = makeStore();
    await Promise.all([store.dispatch(fetchWorkers('p1')), store.dispatch(fetchWorkers('p1'))]);
    expect(store.getState().workers.error).toBeNull();
  });

  it("adds one connected, and removes only the project's own by its id", async () => {
    vi.spyOn(service, 'getWorkers').mockResolvedValue([worker({ id: 'same' }), worker({ source: 'project', id: 'same', name: 'Own' })]);
    const store = makeStore();
    await store.dispatch(fetchWorkers('p1'));
    store.dispatch(addWorker(worker({ source: 'project', id: 'w3' })));
    store.dispatch(removeWorker('same'));
    expect(store.getState().workers.list?.map(w => `${w.source}:${w.id}`)).toEqual(['builtin:same', 'project:w3']);
  });
});
