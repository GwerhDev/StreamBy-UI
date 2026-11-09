import { act, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';
import { StorageCard } from './StorageCard';
import assetThumbnails, { assetThumbnailReceived } from '../../../store/assetThumbnailsSlice';
import { StorageFile } from '../../../interfaces';

vi.mock('./ModelThumbnail', () => ({ ModelThumbnail: () => <div data-testid="model-thumbnail" /> }));

const file = (over: Partial<StorageFile> = {}): StorageFile => ({
  id: 'f1', key: 'k', name: 'big.png', displayName: 'big.png', storageKey: 'p1/images/f1.png', size: 8_000_000,
  url: 'https://s3.test/p1/images/f1.png?sig', lastModified: '', contentType: 'image/png', category: 'images',
  uploadedBy: 'u1', createdAt: '', ...over,
});

const renderCard = (f: StorageFile) => {
  const store = configureStore({ reducer: { assetThumbnails } });
  render(<Provider store={store}><StorageCard file={f} category={f.category} /></Provider>);
  return store;
};

describe('StorageCard', () => {
  it("shows an image's thumbnail, not the image itself, once there's one", () => {
    renderCard(file({ thumbnailUrl: 'https://s3.test/p1/images/f1.png.thumb.webp?sig' }));
    expect(screen.getByAltText('big.png')).toHaveAttribute('src', 'https://s3.test/p1/images/f1.png.thumb.webp?sig');
  });

  it('shows the image until its thumbnail is made, then the thumbnail the server tells', () => {
    const store = renderCard(file());
    expect(screen.getByAltText('big.png')).toHaveAttribute('src', 'https://s3.test/p1/images/f1.png?sig');
    act(() => { store.dispatch(assetThumbnailReceived({ fileId: 'f1', thumbnailUrl: 'https://s3.test/thumb.webp' })); });
    expect(screen.getByAltText('big.png')).toHaveAttribute('src', 'https://s3.test/thumb.webp');
  });

  it("shows a video's frame once it has a thumbnail, and its icon before (never the video)", () => {
    const video = file({ id: 'v1', displayName: 'clip.mp4', contentType: 'video/mp4', category: 'videos', url: 'https://s3.test/clip.mp4' });
    const store = renderCard(video);
    expect(screen.queryByAltText('clip.mp4')).not.toBeInTheDocument();
    act(() => { store.dispatch(assetThumbnailReceived({ fileId: 'v1', thumbnailUrl: 'https://s3.test/clip.thumb.webp' })); });
    expect(screen.getByAltText('clip.mp4')).toHaveAttribute('src', 'https://s3.test/clip.thumb.webp');
  });
});
