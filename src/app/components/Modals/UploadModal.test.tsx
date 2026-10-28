import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import * as storage from '../../../services/storage';
import userEvent from '@testing-library/user-event';
import { UploadModal } from './UploadModal';

describe('UploadModal', () => {
  it('renders without crashing', () => {
    // TODO: implement
  });

  it('renders with required props', () => {
    // TODO: implement
  });

  it('handles user interaction', async () => {
    // TODO: implement
  });

  it('shows loading state', () => {
    // TODO: implement
  });

  it('shows empty/disabled state', () => {
    // TODO: implement
  });
});

describe('UploadModal — license metadata', () => {
  const renderModal = () => {
    const store = configureStore({ reducer: { apiResponses: (state = { responses: [] as unknown[] }) => state } });
    render(
      <Provider store={store}>
        <UploadModal projectId="p1" connId="builtin" category="images" onSuccess={vi.fn()} onClose={vi.fn()} />
      </Provider>,
    );
  };

  it('uploads the files with the license metadata given', async () => {
    const getUrl = vi.spyOn(storage, 'getStorageUploadUrl').mockResolvedValue({ url: 'https://upload.test/x', fileId: 'a1' });
    vi.spyOn(storage, 'uploadToPresignedUrl').mockResolvedValue(true);
    renderModal();
    const user = userEvent.setup();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, new File(['x'], 'rock.png', { type: 'image/png' }));
    await user.click(screen.getByTestId('upload-license-toggle'));
    await user.type(screen.getByTestId('upload-license-creatorName'), 'Jane Doe');
    await user.selectOptions(screen.getByTestId('upload-license-licenseType'), 'CC0');
    await user.click(screen.getByRole('button', { name: /Upload \(1\)/ }));
    await waitFor(() => expect(getUrl).toHaveBeenCalledWith('p1', 'builtin', 'images', 'rock.png', 'image/png',
      expect.objectContaining({ creatorName: 'Jane Doe', licenseType: 'CC0', sourceUrl: null })));
  });
});

