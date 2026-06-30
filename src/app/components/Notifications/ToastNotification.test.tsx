import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import apiResponsesReducer, { addApiResponse } from '../../../store/apiResponsesSlice';
import { ToastNotification } from './ToastNotification';

const makeStore = (responses: { id: string; message: string; type: 'success' | 'error' }[] = []) =>
  configureStore({
    reducer: { apiResponses: apiResponsesReducer },
    preloadedState: { apiResponses: { responses } },
  });

const renderToast = (responses: { id: string; message: string; type: 'success' | 'error' }[] = []) =>
  render(
    <Provider store={makeStore(responses)}>
      <ToastNotification />
    </Provider>,
  );

describe('ToastNotification', () => {
  it('renders no toast items when there are no responses', () => {
    renderToast();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(document.querySelectorAll('[class*="_toast_"]')).toHaveLength(0);
  });

  it('renders a success toast with the message', () => {
    renderToast([{ id: 't1', message: 'File saved.', type: 'success' }]);
    expect(screen.getByText('File saved.')).toBeInTheDocument();
  });

  it('renders an error toast with the message', () => {
    renderToast([{ id: 't1', message: 'Upload failed.', type: 'error' }]);
    expect(screen.getByText('Upload failed.')).toBeInTheDocument();
  });

  it('renders multiple toasts', () => {
    renderToast([
      { id: 't1', message: 'First', type: 'success' },
      { id: 't2', message: 'Second', type: 'error' },
    ]);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('dispatches removeApiResponse when a toast is clicked', async () => {
    const user = userEvent.setup();
    const store = makeStore([{ id: 't1', message: 'Click me', type: 'success' }]);
    render(
      <Provider store={store}>
        <ToastNotification />
      </Provider>,
    );
    await user.click(screen.getByText('Click me'));
    expect(store.getState().apiResponses.responses).toHaveLength(0);
  });
});
