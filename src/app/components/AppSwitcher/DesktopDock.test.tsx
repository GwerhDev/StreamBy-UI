import { render, screen, fireEvent } from '@testing-library/react';
import { DesktopDock } from './DesktopDock';

const originalLocation = window.location;
beforeEach(() => {
  Object.defineProperty(window, 'location', { writable: true, configurable: true, value: { href: 'https://streamby.nhexa.cl/' } });
});
afterEach(() => {
  Object.defineProperty(window, 'location', { writable: true, configurable: true, value: originalLocation });
});

describe('DesktopDock', () => {
  it("goes to Nhexa's home", () => {
    render(<DesktopDock />);
    fireEvent.click(screen.getByTestId('dock-home'));
    expect(window.location.href).toBe('https://nhexa.cl');
  });

  it('goes to the account', () => {
    render(<DesktopDock />);
    fireEvent.click(screen.getByTestId('dock-account'));
    expect(window.location.href).toBe('https://accounts.nhexa.cl');
  });

  it("shows the settings, but they can't be opened yet", () => {
    render(<DesktopDock />);
    expect(screen.getByTestId('dock-settings')).toBeDisabled();
  });
});
