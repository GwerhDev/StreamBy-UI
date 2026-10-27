import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentTree } from './DocumentTree';
import * as service from '../../../services/documents';
import { doc, renderAt } from '../../../test/documents';

const ROUTE = '/project/:id/dashboard/documents';
const PATH = '/project/p1/dashboard/documents';
const folder = doc({ id: 'f1', kind: 'folder', title: 'Concept', content: '' });
const inside = doc({ id: 'd2', title: 'Vision', parentId: 'f1', publishedVersion: 1 });

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(service, 'getDocuments').mockResolvedValue([doc(), folder, inside]);
});

describe('DocumentTree', () => {
  it("shows one folder at a time, folders first, with each document's version and whether one is published", async () => {
    renderAt(PATH, ROUTE, <DocumentTree />);
    const items = await screen.findAllByTestId(/^document-/);
    expect(items.map(i => i.getAttribute('data-testid'))).toEqual(['document-tree', 'document-f1', 'document-d1']);
    expect(screen.getByTestId('document-d1')).toHaveTextContent('v1');
    expect(screen.queryByTestId('document-d2')).not.toBeInTheDocument();
  });

  it('opens a folder or a document with a double click', async () => {
    renderAt(PATH, ROUTE, <DocumentTree />);
    fireEvent.doubleClick(await screen.findByTestId('document-f1'));
    expect(screen.getByTestId('location')).toHaveTextContent('/project/p1/dashboard/documents/f1');
  });

  it("inside a folder, shows what's in it, and creates there", async () => {
    const create = vi.spyOn(service, 'createDocument').mockResolvedValue(doc({ id: 'd9', title: 'Model', parentId: 'f1' }));
    renderAt('/project/p1/dashboard/documents/f1', '/project/:id/dashboard/documents/:docId', <DocumentTree folder={folder} />);
    expect(await screen.findByTestId('document-d2')).toHaveTextContent('published v1');
    expect(screen.queryByTestId('document-d1')).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /New document/ }));
    await user.type(screen.getByLabelText('Title'), 'Model');
    await user.click(screen.getByRole('button', { name: /Create/ }));
    await waitFor(() => expect(create).toHaveBeenCalledWith('p1', { title: 'Model', kind: 'document', parentId: 'f1' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/project/p1/dashboard/documents/d9/edit');
  });

  it('makes a new folder and lets it be named in place', async () => {
    const created = doc({ id: 'f2', kind: 'folder', title: 'New folder', content: '' });
    vi.spyOn(service, 'createDocument').mockResolvedValue(created);
    const save = vi.spyOn(service, 'saveDocument').mockResolvedValue({ ...created, title: 'Roadmap', version: 2 });
    renderAt(PATH, ROUTE, <DocumentTree />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /New folder/ }));
    const name = await screen.findByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'Roadmap{Enter}');
    await waitFor(() => expect(save).toHaveBeenCalledWith('p1', 'f2', 1, { title: 'Roadmap' }));
    expect(await screen.findByTestId('document-f2')).toHaveTextContent('Roadmap');
  });

  it('deletes a folder with everything in it, from its menu, once confirmed', async () => {
    const remove = vi.spyOn(service, 'deleteDocument').mockResolvedValue(['f1', 'd2']);
    renderAt(PATH, ROUTE, <DocumentTree />);
    fireEvent.contextMenu(await screen.findByTestId('document-f1'));
    fireEvent.click(screen.getByText('Delete'));
    expect(remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Delete it and all inside'));
    await waitFor(() => expect(remove).toHaveBeenCalledWith('p1', 'f1'));
    await waitFor(() => expect(screen.queryByTestId('document-f1')).not.toBeInTheDocument());
  });

  it('moves a document dropped on a folder into it', async () => {
    const move = vi.spyOn(service, 'updateDocument').mockResolvedValue(doc({ parentId: 'f1' }));
    renderAt(PATH, ROUTE, <DocumentTree />);
    const data = new Map<string, string>();
    const dataTransfer = { setData: (k: string, v: string) => data.set(k, v), getData: (k: string) => data.get(k) ?? '', effectAllowed: '' };
    fireEvent.dragStart(await screen.findByTestId('document-d1'), { dataTransfer });
    fireEvent.drop(screen.getByTestId('document-f1'), { dataTransfer });
    await waitFor(() => expect(move).toHaveBeenCalledWith('p1', 'd1', { parentId: 'f1' }));
    await waitFor(() => expect(screen.queryByTestId('document-d1')).not.toBeInTheDocument());
  });

  it("lets a viewer open them, not create, rename, move nor delete them", async () => {
    renderAt(PATH, ROUTE, <DocumentTree />, { role: 'viewer' });
    const item = await screen.findByTestId('document-f1');
    expect(screen.queryByRole('button', { name: /New document/ })).not.toBeInTheDocument();
    expect(item).toHaveAttribute('draggable', 'false');
    fireEvent.contextMenu(item);
    expect(screen.getByTestId('document-menu')).toHaveTextContent('Open');
    expect(screen.getByTestId('document-menu')).not.toHaveTextContent('Delete');
    expect(screen.getByTestId('document-menu')).not.toHaveTextContent('Rename');
  });
});
