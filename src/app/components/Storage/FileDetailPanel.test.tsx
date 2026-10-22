import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FileDetailPanel } from './FileDetailPanel';
import * as storage from '../../../services/storage';
import { StorageFile } from '../../../interfaces';

const FILE: StorageFile = {
  id: 'f1', key: 'p1/images/f1.png', name: 'f1.png', displayName: 'poster.png', storageKey: 'p1/images/f1.png', size: 2048,
  url: 'https://storage.test/f1.png', lastModified: '', contentType: 'image/png', category: 'images', uploadedBy: 'u1', createdAt: '',
};

const renderPanel = () => {
  const store = configureStore({ reducer: { currentJob: () => ({ jobs: {} }) } });
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
