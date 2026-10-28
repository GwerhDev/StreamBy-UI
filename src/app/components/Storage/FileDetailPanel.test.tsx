import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FileDetailPanel } from './FileDetailPanel';
import * as storage from '../../../services/storage';
import { AssetRights, StorageFile } from '../../../interfaces';
import creditsSheets, { assetRightsEventReceived } from '../../../store/creditsSheetsSlice';

const FILE: StorageFile = {
  id: 'f1', key: 'p1/images/f1.png', name: 'f1.png', displayName: 'poster.png', storageKey: 'p1/images/f1.png', size: 2048,
  url: 'https://storage.test/f1.png', lastModified: '', contentType: 'image/png', category: 'images', uploadedBy: 'u1', createdAt: '',
};

const renderPanel = () => {
  const store = configureStore({ reducer: { currentJob: () => ({ jobs: {} }), creditsSheets } });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/project/p1/storage']}>
        <Routes>
          <Route path="/project/:id/storage" element={
            <FileDetailPanel file={FILE} category="images" onClose={vi.fn()} onDelete={vi.fn()} onUpdate={vi.fn()} />
          } />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
};

beforeEach(() => vi.restoreAllMocks());

describe('FileDetailPanel', () => {
  it("shows the file's custom tags in its Metadata tab", async () => {
    const get = vi.spyOn(storage, 'getAssetMetadata').mockResolvedValue({ assetId: 'f1', customTags: { shot: 'SH010', pass: 'layout' } });
    renderPanel();
    await userEvent.setup().click(screen.getByRole('button', { name: /Metadata/ }));
    const tags = await screen.findByTestId('custom-tags');
    expect(tags).toHaveTextContent('shot');
    expect(tags).toHaveTextContent('SH010');
    expect(tags).toHaveTextContent('layout');
    expect(get).toHaveBeenCalledWith('p1', 'f1');
  });

  it('shows no custom tags section when it has none', async () => {
    vi.spyOn(storage, 'getAssetMetadata').mockResolvedValue(null);
    renderPanel();
    await userEvent.setup().click(screen.getByRole('button', { name: /Metadata/ }));
    expect(await screen.findByText('Content type')).toBeInTheDocument();
    expect(screen.queryByTestId('custom-tags')).not.toBeInTheDocument();
  });
});

const RIGHTS: AssetRights = {
  assetId: 'f1', projectId: 'p1', sourceUrl: 'https://sketchfab.com/poster', creatorName: null, creatorUrl: null, licenseType: 'CC BY', comments: null,
};

describe('FileDetailPanel — Rights', () => {
  const openRights = async () => {
    const store = renderPanel();
    await userEvent.setup().click(screen.getByRole('button', { name: /Rights/ }));
    return store;
  };

  it('shows its license metadata, and what crediting it still lacks', async () => {
    vi.spyOn(storage, 'getAssetRights').mockResolvedValue(RIGHTS);
    await openRights();
    expect(await screen.findByTestId('rights-missing')).toHaveTextContent('Missing its creator: its credits are incomplete');
    expect(screen.getByText('CC BY')).toBeInTheDocument();
    expect(screen.getByText('https://sketchfab.com/poster')).toBeInTheDocument();
  });

  it('saves every field (an emptied one cleared), with the license picked from the list', async () => {
    vi.spyOn(storage, 'getAssetRights').mockResolvedValue(RIGHTS);
    const put = vi.spyOn(storage, 'putAssetRights').mockImplementation(async (_p, _a, payload) => ({ ...RIGHTS, ...payload } as AssetRights));
    await openRights();
    const user = userEvent.setup();
    await user.click(await screen.findByTestId('rights-edit'));
    await user.type(screen.getByTestId('rights-creatorName'), 'Jane Doe');
    await user.selectOptions(screen.getByTestId('rights-licenseType'), 'CC BY-SA');
    await user.clear(screen.getByTestId('rights-sourceUrl'));
    await user.click(screen.getByTestId('rights-save'));
    await waitFor(() => expect(put).toHaveBeenCalledWith('p1', 'f1', {
      sourceUrl: '', creatorName: 'Jane Doe', creatorUrl: '', licenseType: 'CC BY-SA', comments: '',
    }));
  });

  it("won't send a link that isn't one, and shows what the server refused", async () => {
    vi.spyOn(storage, 'getAssetRights').mockResolvedValue(null);
    const put = vi.spyOn(storage, 'putAssetRights').mockRejectedValue(new Error('licenseType is one of: CC BY, CC BY-SA'));
    await openRights();
    const user = userEvent.setup();
    await user.click(await screen.findByTestId('rights-edit'));
    await user.type(screen.getByTestId('rights-creatorUrl'), 'jane');
    await user.click(screen.getByTestId('rights-save'));
    expect(screen.getByTestId('rights-error')).toHaveTextContent('Creator link must be an http(s) URL.');
    expect(put).not.toHaveBeenCalled();
    await user.clear(screen.getByTestId('rights-creatorUrl'));
    await user.click(screen.getByTestId('rights-save'));
    expect(await screen.findByTestId('rights-error')).toHaveTextContent('licenseType is one of');
  });

  it('shows a change made elsewhere (a credits sheet) at once', async () => {
    vi.spyOn(storage, 'getAssetRights').mockResolvedValue(RIGHTS);
    const store = await openRights();
    await screen.findByTestId('rights-missing');
    act(() => { store.dispatch(assetRightsEventReceived({ projectId: 'p1', action: 'saved', assetIds: ['f1'], rights: { ...RIGHTS, creatorName: 'Jane Doe' } })); });
    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
    expect(screen.queryByTestId('rights-missing')).not.toBeInTheDocument();
  });
});

