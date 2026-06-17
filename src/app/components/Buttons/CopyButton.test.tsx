import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import apiResponsesReducer from '../../../store/apiResponsesSlice';
import CopyButton from './CopyButton';

const makeStore = () =>
  configureStore({ reducer: { apiResponses: apiResponsesReducer } });

const renderWithStore = (props: { title: string; textToCopy: string; children?: React.ReactNode }) =>
  render(
    <Provider store={makeStore()}>
      <CopyButton {...props} />
    </Provider>
  );

describe('CopyButton', () => {
  it('renders button with title', () => {
    renderWithStore({ title: 'Copy endpoint', textToCopy: 'https://example.com' });
    expect(screen.getByRole('button', { name: /copy endpoint/i })).toBeInTheDocument();
  });

  it('renders children content', () => {
    renderWithStore({ title: 'Copy', textToCopy: 'text', children: 'Copy URL' });
    expect(screen.getByText('Copy URL')).toBeInTheDocument();
  });

  it('renders copy icon', () => {
    renderWithStore({ title: 'Copy', textToCopy: 'text' });
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});
