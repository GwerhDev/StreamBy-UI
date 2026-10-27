import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import documents, { childrenOf, documentEventReceived, fetchDocuments, removeDocuments, upsertDocument, withDescendants } from './documentsSlice';
import * as service from '../services/documents';
import { ADA, doc } from '../test/documents';

const makeStore = () => configureStore({ reducer: { documents } });
const folder = doc({ id: 'f1', kind: 'folder', title: 'Concept' });
const tree = [doc({ id: 'd2', parentId: 'f1', position: 1 }), folder, doc({ id: 'd3', parentId: 'f1', position: 0 }), doc({ id: 'd1' })];

beforeEach(() => vi.restoreAllMocks());

describe('documentsSlice', () => {
  it("loads the project's tree, keeps no content, and forgets another project's", async () => {
    vi.spyOn(service, 'getDocuments').mockResolvedValue(tree);
    const store = makeStore();
    await store.dispatch(fetchDocuments('p1'));
    expect(store.getState().documents).toMatchObject({ projectId: 'p1', loading: false });
    store.dispatch(upsertDocument(doc({ id: 'd9', content: 'long text' })));
    expect(store.getState().documents.list!.find(d => d.id === 'd9')).not.toHaveProperty('content');

    vi.spyOn(service, 'getDocuments').mockReturnValue(new Promise(() => {}));
    store.dispatch(fetchDocuments('p2'));
    expect(store.getState().documents.list).toBeNull();
  });

  it('keeps the latest change someone made, and drops what they deleted', async () => {
    vi.spyOn(service, 'getDocuments').mockResolvedValue(tree);
    const store = makeStore();
    await store.dispatch(fetchDocuments('p1'));
    const event = { projectId: 'p1', action: 'deleted' as const, documentIds: ['f1', 'd2', 'd3'], author: ADA };
    store.dispatch(documentEventReceived(event));
    expect(store.getState().documents.lastEvent).toEqual(event);
    expect(store.getState().documents.list!.map(d => d.id)).toEqual(['d1']);
    store.dispatch(removeDocuments(['d1']));
    expect(store.getState().documents.list).toEqual([]);
  });

  it("orders a folder's documents, and finds everything inside one", () => {
    expect(childrenOf(tree, 'f1').map(d => d.id)).toEqual(['d3', 'd2']);
    expect(withDescendants(tree, 'f1')).toEqual(['f1', 'd3', 'd2']);
  });
});
