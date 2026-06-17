import { render, screen } from '@testing-library/react';
import { Spinner } from './index';

describe('Spinner', () => {
  it('renders nothing when isLoading is false', () => {
    const { container } = render(<Spinner isLoading={false} bg={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders spinner when isLoading is true', () => {
    const { container } = render(<Spinner isLoading bg={false} />);
    expect(container.firstChild).not.toBeNull();
  });

  it('applies background container class when bg is true', () => {
    const { container } = render(<Spinner isLoading bg />);
    expect((container.firstChild as HTMLElement).className).toContain('spinnerContainer');
  });

  it('applies no-background container class when bg is false', () => {
    const { container } = render(<Spinner isLoading bg={false} />);
    expect((container.firstChild as HTMLElement).className).toContain('noBgSpinnerContainer');
  });
});
