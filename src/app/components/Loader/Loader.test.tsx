import { render, screen } from '@testing-library/react';
import { Loader } from './index';

describe('Loader', () => {
  it('renders without crashing', () => {
    const { container } = render(<Loader />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders logo image', () => {
    const { container } = render(<Loader />);
    expect(container.querySelector('img')).toBeInTheDocument();
  });

  it('shows a loading bar under the logo', () => {
    render(<Loader />);
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();
  });
});
