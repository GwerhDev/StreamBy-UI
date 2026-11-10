import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { StorageCard } from './StorageCard';
import { StorageFile } from '../../../interfaces';

vi.mock('./ModelThumbnail', () => ({ ModelThumbnail: () => <div data-testid="model-thumbnail" /> }));
vi.mock('./ModelViewer', () => ({ ModelViewer: () => <div data-testid="model-viewer" /> }));

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

  it("opens a 3D model's inspector from its preview", async () => {
    const model = file({ id: 'm1', displayName: 'nhexa-icon.glb', contentType: 'model/gltf-binary', category: '3d-models', url: 'https://s3.test/m1.glb?sig' });
    render(
      <MemoryRouter initialEntries={['/project/p1/storage/c-builtin']}>
        <Routes>
          <Route path="/project/:id/storage/:connId" element={<StorageCard file={model} category="3d-models" />} />
          <Route path="/project/:id/storage/:connId/3d-models/:assetId" element={<p data-testid="inspector-page" />} />
        </Routes>
      </MemoryRouter>,
    );
    const user = userEvent.setup();
    await user.dblClick(screen.getByText('nhexa-icon.glb'));
    const inspect = await screen.findByTestId('inspect-asset');
    expect(inspect).toHaveAttribute('href', '/project/p1/storage/c-builtin/3d-models/m1');
    await user.click(inspect);
    expect(await screen.findByTestId('inspector-page')).toBeInTheDocument();
  });

  it("has no Inspect in the preview of what isn't a 3D model", async () => {
    render(<MemoryRouter initialEntries={['/project/p1/storage/c-builtin']}><Routes><Route path="/project/:id/storage/:connId" element={<StorageCard file={file()} category="images" />} /></Routes></MemoryRouter>);
    await userEvent.setup().dblClick(screen.getAllByText('big.png')[0]);
    expect(screen.queryByTestId('inspect-asset')).not.toBeInTheDocument();
  });
});
