import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreditsSheetView } from './CreditsSheetView';
import { CreditsSheetPanel } from './CreditsSheetPanel';
import * as sheets from '../../../services/creditsSheets';
import * as storage from '../../../services/storage';
import * as documents from '../../../services/documents';
import { assetRightsEventReceived } from '../../../store/creditsSheetsSlice';
import { CreditsSheet, CreditsSheetRow } from '../../../interfaces';
import { doc, renderAt } from '../../../test/documents';

const ROUTE = '/project/:id/dashboard/documents/:docId';
const PATH = '/project/p1/dashboard/documents/s1';

const row = (over: Partial<CreditsSheetRow> = {}): CreditsSheetRow => ({
  assetId: 'a1', name: 'rock.glb', category: '3d-models', sourceUrl: 'https://sketchfab.com/rock', creatorName: 'Jane Doe',
  creatorUrl: null, licenseType: 'CC BY', comments: null, missing: [], from: ['asset'], ...over,
});
const sheetOf = (rows: CreditsSheetRow[], sources = { assetIds: ['a1', 'a2'], folderIds: [] as string[] }): CreditsSheet => ({
  document: doc({ id: 's1', kind: 'credits', title: 'Trailer credits', content: JSON.stringify(sources), version: 3 }),
  sources, rows, status: rows.length && rows.every(r => !r.missing.length) ? 'complete' : 'incomplete',
});
const noCreator = row({ assetId: 'a2', name: 'sky.png', category: 'images', creatorName: null, licenseType: null, missing: ['creatorName', 'licenseType'] });

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(storage, 'getStorageFolders').mockResolvedValue([{ id: 'f1', name: 'Props', parentId: null, projectId: 'p1', createdBy: 'u1', createdAt: '' }]);
  vi.spyOn(sheets, 'getCreditsSheets').mockResolvedValue([]);
});

describe('CreditsSheetView', () => {
  it("shows a row per asset with its metadata, marking those that lack something, and the sheet's status", async () => {
    vi.spyOn(sheets, 'getCreditsSheet').mockResolvedValue(sheetOf([row(), noCreator]));
    renderAt(PATH, ROUTE, <CreditsSheetView />);
    expect(await screen.findByTestId('row-a1')).toBeInTheDocument();
    expect(screen.getByTestId('cell-a1-creatorName')).toHaveValue('Jane Doe');
    expect(screen.getByTestId('cell-a1-licenseType')).toHaveValue('CC BY');
    expect(screen.getByTestId('row-a2').className).toMatch(/rowIncomplete/);
    expect(screen.getByTestId('row-a1').className).not.toMatch(/rowIncomplete/);
    expect(screen.getByTestId('cell-a2-creatorName').closest('td')!.className).toMatch(/cellMissing/);
    expect(screen.getByTestId('credits-sheet-incomplete')).toHaveTextContent('1 of 2 without their creator, link or license.');
    expect(screen.getByTestId('credits-sheet')).toHaveTextContent('Incomplete');
  });

  it("saves an edited cell to its asset's metadata, and reads the sheet again", async () => {
    const get = vi.spyOn(sheets, 'getCreditsSheet')
      .mockResolvedValueOnce(sheetOf([row(), noCreator]))
      .mockResolvedValueOnce(sheetOf([row(), { ...noCreator, creatorName: 'Sam', missing: ['licenseType'] }]))
      .mockResolvedValue(sheetOf([row(), { ...noCreator, creatorName: 'Sam', licenseType: 'Standard', missing: [] }]));
    const put = vi.spyOn(storage, 'putAssetRights').mockResolvedValue({} as never);
    renderAt(PATH, ROUTE, <CreditsSheetView />);
    const user = userEvent.setup();
    await user.type(await screen.findByTestId('cell-a2-creatorName'), 'Sam{Enter}');
    await waitFor(() => expect(put).toHaveBeenCalledWith('p1', 'a2', { creatorName: 'Sam' }));
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    await user.selectOptions(screen.getByTestId('cell-a2-licenseType'), 'Standard');
    await waitFor(() => expect(put).toHaveBeenCalledWith('p1', 'a2', { licenseType: 'Standard' }));
    expect(await screen.findByTestId('credits-sheet')).toHaveTextContent('Complete');
  });

  it("refuses a link that isn't one before sending it", async () => {
    vi.spyOn(sheets, 'getCreditsSheet').mockResolvedValue(sheetOf([row()]));
    const put = vi.spyOn(storage, 'putAssetRights').mockResolvedValue({} as never);
    const store = renderAt(PATH, ROUTE, <CreditsSheetView />);
    const user = userEvent.setup();
    const link = await screen.findByTestId('cell-a1-sourceUrl');
    await user.clear(link);
    await user.type(link, 'sketchfab{Enter}');
    expect(put).not.toHaveBeenCalled();
    expect(store.getState().apiResponses.responses).toEqual([expect.objectContaining({ message: 'Source link must be an http(s) URL.' })]);
    expect(link).toHaveValue('https://sketchfab.com/rock');
  });

  // Another sheet (or the Rights tab, or an agent) edits an asset: this one shows it, unreloaded.
  it("reads itself again when an asset's metadata changes elsewhere in the project", async () => {
    vi.spyOn(sheets, 'getCreditsSheet')
      .mockResolvedValueOnce(sheetOf([row()]))
      .mockResolvedValue(sheetOf([row({ creatorName: 'Jane D.' })]));
    const store = renderAt(PATH, ROUTE, <CreditsSheetView />);
    expect(await screen.findByTestId('cell-a1-creatorName')).toHaveValue('Jane Doe');
    act(() => { store.dispatch(assetRightsEventReceived({ projectId: 'p1', action: 'saved', assetIds: ['a1'] })); });
    await waitFor(() => expect(screen.getByTestId('cell-a1-creatorName')).toHaveValue('Jane D.'));
  });

  it('is read only for whom may not edit the assets', async () => {
    vi.spyOn(sheets, 'getCreditsSheet').mockResolvedValue(sheetOf([row()]));
    renderAt(PATH, ROUTE, <CreditsSheetView />, { role: 'viewer' });
    expect(await screen.findByTestId('cell-a1-creatorName')).toHaveTextContent('Jane Doe');
    expect(screen.getByTestId('cell-a1-creatorName').tagName).toBe('TD');
    expect(screen.queryByTestId('credits-sheet-add-assets')).not.toBeInTheDocument();
  });
});

describe('CreditsSheetSources', () => {
  it('saves the assets and folders picked as the sheet\'s content, on its version', async () => {
    vi.spyOn(sheets, 'getCreditsSheet').mockResolvedValue(sheetOf([row(), noCreator]));
    const save = vi.spyOn(documents, 'saveDocument').mockResolvedValue(doc());
    renderAt(PATH, ROUTE, <CreditsSheetView />);
    const user = userEvent.setup();
    await user.click(within(await screen.findByTestId('source-asset-a2')).getByRole('button', { name: /Remove/ }));
    await waitFor(() => expect(save).toHaveBeenCalledWith('p1', 's1', 3, { content: JSON.stringify({ assetIds: ['a1'], folderIds: [] }) }));
    await user.selectOptions(await screen.findByTestId('credits-sheet-add-folder'), 'f1');
    await waitFor(() => expect(save).toHaveBeenLastCalledWith('p1', 's1', 3, { content: JSON.stringify({ assetIds: ['a1', 'a2'], folderIds: ['f1'] }) }));
  });

  it('shows the assets the connected Ingest nodes bring', async () => {
    vi.spyOn(sheets, 'getCreditsSheet').mockResolvedValue(sheetOf([row({ assetId: 'a9', name: 'ingested.mp4', from: ['ingest'] })], { assetIds: [], folderIds: [] }));
    renderAt(PATH, ROUTE, <CreditsSheetView />);
    expect(await screen.findByTestId('source-ingest-a9')).toHaveTextContent('ingested.mp4 (Ingest)');
  });
});

describe('CreditsSheetPanel', () => {
  it("shows its node's sheet status and opens the sheet", async () => {
    vi.spyOn(sheets, 'getCreditsSheet').mockResolvedValue(sheetOf([row(), noCreator]));
    renderAt('/project/p1/workflow', '/project/:id/workflow', <CreditsSheetPanel projectId="p1" documentId="s1" editMode />);
    expect(await screen.findByTestId('credits-sheet-status')).toHaveTextContent('Incomplete');
    expect(screen.getByTestId('credits-sheet-panel')).toHaveTextContent('2 assets · 1 incomplete');
    await userEvent.setup().click(screen.getByRole('button', { name: /Open sheet/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/project/p1/dashboard/documents/s1');
  });
});
