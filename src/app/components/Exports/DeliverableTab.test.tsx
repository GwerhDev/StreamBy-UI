import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeliverableTab } from './DeliverableTab';
import * as deliverables from '../../../services/deliverables';

beforeEach(() => vi.restoreAllMocks());

describe('DeliverableTab', () => {
  it("lists the export's deliverables", async () => {
    const list = vi.spyOn(deliverables, 'getDeliverables').mockResolvedValue([{
      id: 'd1', projectId: 'p1', assetId: 'a1', versionId: null, shotId: null, exportId: 'e1', note: null, createdBy: 'u1',
      createdAt: '', asset: { displayName: 'trailer.mp4', category: 'videos', contentType: 'video/mp4' }, version: null,
      shotName: null, exportName: 'trailer',
    }]);
    const store = configureStore({ reducer: { apiResponses: (state = { responses: [] as unknown[] }) => state } });
    render(<Provider store={store}><DeliverableTab projectId="p1" exportId="e1" /></Provider>);
    expect(await screen.findByText('trailer.mp4')).toBeInTheDocument();
    expect(list).toHaveBeenCalledWith('p1', { exportId: 'e1' });
  });
});
