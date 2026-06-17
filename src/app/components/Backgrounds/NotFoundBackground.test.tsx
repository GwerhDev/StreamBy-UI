import { render, screen } from '@testing-library/react';
import { NotFoundBackground } from './NotFoundBackground';

describe('NotFoundBackground', () => {
  it('renders 404 message', () => {
    render(<NotFoundBackground />);
    expect(screen.getByText(/404/i)).toBeInTheDocument();
  });

  it('renders icon', () => {
    render(<NotFoundBackground />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});
