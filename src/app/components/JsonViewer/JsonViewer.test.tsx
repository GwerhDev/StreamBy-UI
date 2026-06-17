import { render, screen } from '@testing-library/react';
import JsonViewer from './JsonViewer';

describe('JsonViewer', () => {
  it('renders string values with quotes', () => {
    render(<JsonViewer data={{ name: 'Alice' }} />);
    expect(screen.getByText(/"Alice"/)).toBeInTheDocument();
  });

  it('renders number values', () => {
    render(<JsonViewer data={{ age: 30 }} />);
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('renders boolean values', () => {
    render(<JsonViewer data={{ active: true }} />);
    expect(screen.getByText('true')).toBeInTheDocument();
  });

  it('renders null values', () => {
    render(<JsonViewer data={{ value: null }} />);
    expect(screen.getByText('null')).toBeInTheDocument();
  });

  it('renders object keys', () => {
    render(<JsonViewer data={{ username: 'bob' }} />);
    expect(screen.getByText(/"username"/)).toBeInTheDocument();
  });

  it('renders empty object', () => {
    const { container } = render(<JsonViewer data={{}} />);
    expect(container.querySelector('pre')).toBeInTheDocument();
  });
});
