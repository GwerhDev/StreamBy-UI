import { act, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentView } from './DocumentView';
import * as service from '../../../services/documents';
import { documentEventReceived } from '../../../store/documentsSlice';
import { CLAUDE, doc, renderAt } from '../../../test/documents';

const ROUTE = '/project/:id/dashboard/documents/:docId';
const PATH = '/project/p1/dashboard/documents/d1';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(service, 'getDocuments').mockResolvedValue([doc()]);
  vi.spyOn(service, 'getDocument').mockResolvedValue(doc());
});

describe('DocumentView', () => {
  it('shows the document, its version and who saved it, as a draft until published', async () => {
    renderAt(PATH, ROUTE, <DocumentView />);
    const view = await screen.findByTestId('document-view');
    expect(view).toHaveTextContent('Version 1 · saved by ada');
    expect(view).toHaveTextContent('Draft');
    expect(screen.getByTestId('markdown-view').querySelector('h2')).toHaveTextContent('Storage');
  });

  it("shows a folder as what's in it", async () => {
    vi.spyOn(service, 'getDocument').mockResolvedValue(doc({ id: 'd1', kind: 'folder', title: 'Concept', content: '' }));
    vi.spyOn(service, 'getDocuments').mockResolvedValue([doc({ id: 'd1', kind: 'folder', title: 'Concept', content: '' }), doc({ id: 'd2', title: 'Vision', parentId: 'd1' })]);
    renderAt(PATH, ROUTE, <DocumentView />);
    expect(await screen.findByTestId('document-d2')).toHaveTextContent('Vision');
    expect(screen.queryByTestId('document-view')).not.toBeInTheDocument();
  });

  it('follows a new version someone saves while it is open, and says who', async () => {
    const store = renderAt(PATH, ROUTE, <DocumentView />);
    await screen.findByTestId('document-view');
    vi.spyOn(service, 'getDocument').mockResolvedValue(doc({ version: 2, content: '## Storage\n\nCloud too.\n', updatedBy: CLAUDE }));
    act(() => { store.dispatch(documentEventReceived({ projectId: 'p1', action: 'saved', documentIds: ['d1'], version: 2, author: CLAUDE })); });

    expect(await screen.findByTestId('document-notice')).toHaveTextContent('Updated to version 2 by Claude on behalf of ada.');
    expect(screen.getByTestId('markdown-view')).toHaveTextContent('Cloud too.');
  });

  it("doesn't take a change made before it was opened for a new one", async () => {
    const store = renderAt(PATH, ROUTE, <></>);
    act(() => { store.dispatch(documentEventReceived({ projectId: 'p1', action: 'saved', documentIds: ['d1'], version: 2, author: CLAUDE })); });
    // Opened afterwards: the same store, a new view.
    const { render } = await import('@testing-library/react');
    const { Provider } = await import('react-redux');
    const { MemoryRouter, Route, Routes } = await import('react-router-dom');
    render(<Provider store={store}><MemoryRouter initialEntries={[PATH]}><Routes><Route path={ROUTE} element={<DocumentView />} /></Routes></MemoryRouter></Provider>);
    await screen.findByTestId('document-view');
    expect(screen.queryByTestId('document-notice')).not.toBeInTheDocument();
  });

  it('leaves for the list when someone deletes it', async () => {
    const store = renderAt(PATH, ROUTE, <DocumentView />);
    await screen.findByTestId('document-view');
    act(() => { store.dispatch(documentEventReceived({ projectId: 'p1', action: 'deleted', documentIds: ['d1'], author: CLAUDE })); });
    expect(await screen.findByTestId('location')).toHaveTextContent('/project/p1/dashboard/documents');
  });

  it("lets a viewer read it, not edit it", async () => {
    renderAt(PATH, ROUTE, <DocumentView />, { role: 'viewer' });
    await screen.findByTestId('document-view');
    expect(screen.queryByRole('button', { name: /Edit/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /History/ })).toBeInTheDocument();
  });
});
