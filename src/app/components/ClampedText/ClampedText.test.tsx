import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClampedText } from './ClampedText';

// jsdom lays nothing out: a text is "cut" when its full height is past the box it's shown in.
const layOut = (scrollHeight: number, clientHeight: number) => {
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get: () => scrollHeight });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => clientHeight });
};

describe('ClampedText', () => {
  it('shows the text, with no toggle when it fits', () => {
    layOut(40, 40);
    render(<ClampedText text="A short description" />);
    expect(screen.getByTestId('clamped-text')).toHaveTextContent('A short description');
    expect(screen.queryByTestId('clamped-text-toggle')).not.toBeInTheDocument();
  });

  it('cut, offers to read it whole, and back', async () => {
    layOut(200, 60);
    render(<ClampedText text="A long description" lines={3} />);
    const toggle = screen.getByTestId('clamped-text-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(screen.getByTestId('clamped-text-toggle')).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(screen.getByTestId('clamped-text-toggle'));
    expect(screen.getByTestId('clamped-text-toggle')).toHaveAttribute('aria-expanded', 'false');
  });
});
