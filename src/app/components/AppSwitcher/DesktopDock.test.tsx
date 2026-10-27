import { render, screen, fireEvent } from '@testing-library/react';
import { DesktopDock } from './DesktopDock';

// Where each tool goes comes from the app's configuration (its .env): fixed ones here.
vi.mock('../../../config/api', () => ({
  NHEXA_BASE: 'https://home.example.com',
  ACCOUNT_BASE: 'https://accounts.example.com',
}));

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
    expect(window.location.href).toBe('https://home.example.com');
  });

  it('goes to the account', () => {
    render(<DesktopDock />);
    fireEvent.click(screen.getByTestId('dock-account'));
    expect(window.location.href).toBe('https://accounts.example.com');
  });

  it("shows the settings, but they can't be opened yet", () => {
    render(<DesktopDock />);
    expect(screen.getByTestId('dock-settings')).toBeDisabled();
  });
});
