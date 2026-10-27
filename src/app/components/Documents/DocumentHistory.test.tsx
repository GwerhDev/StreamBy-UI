import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentHistory } from './DocumentHistory';
import * as service from '../../../services/documents';
import { ADA, CLAUDE, doc, renderAt } from '../../../test/documents';

const ROUTE = '/project/:id/dashboard/documents/:docId/versions';
const PATH = '/project/p1/dashboard/documents/d1/versions';
const v1 = { documentId: 'd1', projectId: 'p1', version: 1, title: 'Architecture', content: 'First line.\n', author: ADA, createdAt: '2026-10-27T10:00:00Z' };
const v2 = { ...v1, version: 2, content: 'First line.\nAdded by Claude.\n', author: CLAUDE, createdAt: '2026-10-27T11:00:00Z' };

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(service, 'getDocument').mockResolvedValue(doc({ version: 2, content: v2.content, updatedBy: CLAUDE, exportable: true }));
  vi.spyOn(service, 'getDocumentVersions').mockResolvedValue([v2, v1].map(({ content: _c, ...summary }) => summary));
  vi.spyOn(service, 'getDocumentVersion').mockImplementation(async (_p, _d, version) => (version === 1 ? v1 : v2));
});

describe('DocumentHistory', () => {
  it('lists every version with who saved it, the current one shown', async () => {
    renderAt(PATH, ROUTE, <DocumentHistory />);
    expect(await screen.findByTestId('version-2')).toHaveTextContent('Claude on behalf of ada');
    expect(screen.getByTestId('version-2')).toHaveTextContent('Current');
    expect(screen.getByTestId('version-1')).toHaveTextContent('ada');
    expect(screen.getByTestId('markdown-view')).toHaveTextContent('Added by Claude.');
  });

  it('shows what changed from another version', async () => {
    renderAt(PATH, ROUTE, <DocumentHistory />);
    await screen.findByTestId('markdown-view');
    fireEvent.click(screen.getByRole('button', { name: /None: show it as it reads/ }));
    fireEvent.mouseDown(screen.getByText('Version 1', { selector: 'li' }));
    expect(await screen.findByTestId('diff-added')).toHaveTextContent('Added by Claude.');
  });

  it('publishes the version chosen: what its exports deliver', async () => {
    const publish = vi.spyOn(service, 'publishDocument').mockResolvedValue(doc({ version: 2, publishedVersion: 1, exportable: true }));
    renderAt(PATH, ROUTE, <DocumentHistory />);
    const user = userEvent.setup();
    await user.click(await screen.findByTestId('version-1'));
    await user.click(await screen.findByRole('button', { name: 'Publish version 1' }));
    await waitFor(() => expect(publish).toHaveBeenCalledWith('p1', 'd1', 1));
    expect(await screen.findByTestId('version-1')).toHaveTextContent('Published');
  });

  it("lets a viewer read the history, not publish", async () => {
    renderAt(PATH, ROUTE, <DocumentHistory />, { role: 'viewer' });
    await screen.findByTestId('markdown-view');
    expect(screen.queryByRole('button', { name: /Publish/ })).not.toBeInTheDocument();
  });
});
