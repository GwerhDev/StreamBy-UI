import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StorageCard } from './StorageCard';
import { StorageFile } from '../../../interfaces';

vi.mock('./ModelThumbnail', () => ({ ModelThumbnail: () => <div data-testid="model-thumbnail" /> }));

const file = (over: Partial<StorageFile> = {}): StorageFile => ({
  id: 'f1', key: 'k', name: 'big.png', displayName: 'big.png', storageKey: 'p1/images/f1.png', size: 8_000_000,
  url: 'https://s3.test/p1/images/f1.png?sig', lastModified: '', contentType: 'image/png', category: 'images',
  uploadedBy: 'u1', createdAt: '', ...over,
});

const renderCard = (f: StorageFile) => render(<StorageCard file={f} category={f.category} />);

describe('StorageCard', () => {
  it("shows an image's thumbnail, not the image itself, when the list gives one", () => {
    renderCard(file({ thumbnailUrl: 'https://s3.test/p1/images/f1-thumb.webp?sig' }));
    expect(screen.getByAltText('big.png')).toHaveAttribute('src', 'https://s3.test/p1/images/f1-thumb.webp?sig');
  });

  it('shows the image itself without one', () => {
    renderCard(file({ thumbnailUrl: null }));
    expect(screen.getByAltText('big.png')).toHaveAttribute('src', 'https://s3.test/p1/images/f1.png?sig');
  });

  it("shows a video's thumbnail when it has one, and its icon otherwise (never the video)", () => {
    const video = (thumbnailUrl: string | null) => file({ id: 'v1', displayName: 'clip.mp4', contentType: 'video/mp4', category: 'videos', url: 'https://s3.test/clip.mp4', thumbnailUrl });
    const { unmount } = renderCard(video(null));
    expect(screen.queryByAltText('clip.mp4')).not.toBeInTheDocument();
    unmount();
    renderCard(video('https://s3.test/clip-thumb.webp'));
    expect(screen.getByAltText('clip.mp4')).toHaveAttribute('src', 'https://s3.test/clip-thumb.webp');
  });
});
