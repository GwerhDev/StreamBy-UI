import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as reviews from '../../../services/reviews';
import * as measurements from '../../../services/assetMeasurements';
import { ReviewSession } from '../../../interfaces';
import { isAudioVersion } from '../../../utils/audioVersion';
import { ReviewPlayer } from './ReviewPlayer';

// The audio review itself is AudioReview's (its own tests): here, only whether it's the one shown.
vi.mock('./AudioReview', () => ({ AudioReview: () => <div data-testid="audio-review" /> }));

const SESSION = {
  id: 'r1', projectId: 'p1', assetId: 'a1', assetVersionId: 'v2', status: 'open', requiredApprovers: 1, approvals: [],
  createdAt: '2026-11-18T10:00:00.000Z', updatedAt: '',
} as ReviewSession;

const renderPlayer = () => {
  const store = configureStore({
    reducer: {
      session: () => ({ logged: true, loader: false, username: 'ada', userId: 'u1' }),
      currentProject: () => ({ data: { id: 'p1', members: [{ userId: 'u1', role: 'admin', status: 'active' }] }, loading: false, error: null }),
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/project/p1/reviews/r1']}>
        <Routes><Route path="/project/:id/reviews/:sessionId" element={<ReviewPlayer />} /></Routes>
      </MemoryRouter>
    </Provider>,
  );
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(reviews, 'getReview').mockResolvedValue(SESSION);
});

describe('ReviewPlayer', () => {
  it('reviews an audio version on its waveform', async () => {
    vi.spyOn(measurements, 'getAssetVersions').mockResolvedValue([{ versionId: 'v2', version: 2, fileName: 'mix.wav', contentType: 'audio/wav', createdAt: '' }]);
    renderPlayer();
    expect(await screen.findByTestId('audio-review')).toBeInTheDocument();
    expect(screen.queryByText('Asset player coming soon')).not.toBeInTheDocument();
  });

  it('keeps the placeholder for what it has no player for yet', async () => {
    vi.spyOn(measurements, 'getAssetVersions').mockResolvedValue([{ versionId: 'v2', version: 2, fileName: 'goblin.glb', contentType: 'model/gltf-binary', createdAt: '' }]);
    renderPlayer();
    expect(await screen.findByText('Asset player coming soon')).toBeInTheDocument();
    expect(screen.queryByTestId('audio-review')).not.toBeInTheDocument();
  });

  it("says so when the session isn't there", async () => {
    vi.spyOn(reviews, 'getReview').mockRejectedValue(new Error('Review not found'));
    vi.spyOn(measurements, 'getAssetVersions').mockResolvedValue([]);
    renderPlayer();
    expect(await screen.findByText('Review not found')).toBeInTheDocument();
  });
});

describe('isAudioVersion', () => {
  it('by its type, its file name, or what it was measured as', () => {
    const base = { versionId: 'v', version: 1, createdAt: '' };
    expect(isAudioVersion({ ...base, fileName: 'x.bin', contentType: 'audio/mpeg' })).toBe(true);
    expect(isAudioVersion({ ...base, fileName: 'Mix FINAL.FLAC' })).toBe(true);
    expect(isAudioVersion({ ...base, fileName: null, measurements: { kind: 'audio' } as never })).toBe(true);
    expect(isAudioVersion({ ...base, fileName: 'goblin.glb', contentType: 'model/gltf-binary' })).toBe(false);
    expect(isAudioVersion(undefined)).toBe(false);
  });
});
