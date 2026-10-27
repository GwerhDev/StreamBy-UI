import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentEditor } from './DocumentEditor';
import * as service from '../../../services/documents';
import { documentEventReceived } from '../../../store/documentsSlice';
import { CLAUDE, doc, renderAt } from '../../../test/documents';

const ROUTE = '/project/:id/dashboard/documents/:docId/edit';
const PATH = '/project/p1/dashboard/documents/d1/edit';
const theirs = doc({ version: 2, content: '## Storage\n\nIndexedDB, persisted.\n', updatedBy: CLAUDE });

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(service, 'getDocument').mockResolvedValue(doc());
});

const typeMine = async () => {
  const user = userEvent.setup();
  const content = await screen.findByTestId('document-content');
  await user.clear(content);
  await user.type(content, 'Mine');
  return user;
};

describe('DocumentEditor', () => {
  it('saves a new version on the one it opened, and goes back to the document', async () => {
    const save = vi.spyOn(service, 'saveDocument').mockResolvedValue(doc({ version: 2, content: 'Mine' }));
    renderAt(PATH, ROUTE, <DocumentEditor />);
    const user = await typeMine();
    await user.click(screen.getByRole('button', { name: /Save/ }));
    await waitFor(() => expect(save).toHaveBeenCalledWith('p1', 'd1', 1, { title: 'Architecture', content: 'Mine' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/project/p1/dashboard/documents/d1');
  });

  it("when someone saved meanwhile, overwrites nothing: says who, shows what they changed, and lets the editor choose", async () => {
    const save = vi.spyOn(service, 'saveDocument')
      .mockRejectedValueOnce(new service.ApiError('The document changed', 409, { document: theirs }))
      .mockResolvedValueOnce(doc({ version: 3, content: 'Mine' }));
    renderAt(PATH, ROUTE, <DocumentEditor />);
    const user = await typeMine();
    await user.click(screen.getByRole('button', { name: /Save/ }));

    const newer = await screen.findByTestId('document-newer');
    expect(newer).toHaveTextContent('Claude on behalf of ada saved version 2');
    expect(screen.getByTestId('document-content')).toHaveValue('Mine');
    expect(screen.getByRole('button', { name: /Save/ })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'See their changes' }));
    expect(screen.getByTestId('diff-added')).toHaveTextContent('IndexedDB, persisted.');

    await user.click(screen.getByRole('button', { name: 'Keep mine on top of it' }));
    await user.click(screen.getByRole('button', { name: /Save/ }));
    await waitFor(() => expect(save).toHaveBeenLastCalledWith('p1', 'd1', 2, { title: 'Architecture', content: 'Mine' }));
  });

  it('warns of a version saved while editing, as it arrives, and can take it', async () => {
    const store = renderAt(PATH, ROUTE, <DocumentEditor />);
    const user = await typeMine();
    vi.spyOn(service, 'getDocument').mockResolvedValue(theirs);
    act(() => { store.dispatch(documentEventReceived({ projectId: 'p1', action: 'saved', documentIds: ['d1'], version: 2, author: CLAUDE })); });

    expect(await screen.findByTestId('document-newer')).toHaveTextContent('saved version 2 while you were editing');
    expect(screen.getByTestId('document-content')).toHaveValue('Mine');
    await user.click(screen.getByRole('button', { name: 'Take their version' }));
    expect(screen.getByTestId('document-content')).toHaveValue(theirs.content);
  });

  it("isn't bothered by changes to other documents", async () => {
    const store = renderAt(PATH, ROUTE, <DocumentEditor />);
    await typeMine();
    act(() => { store.dispatch(documentEventReceived({ projectId: 'p1', action: 'saved', documentIds: ['d2'], version: 5, author: CLAUDE })); });
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(screen.queryByTestId('document-newer')).not.toBeInTheDocument();
  });
});
