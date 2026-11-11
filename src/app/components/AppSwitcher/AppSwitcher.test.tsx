import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AppSwitcher } from './AppSwitcher';
import { DesktopProvider, useDesktop } from '../../../context/DesktopContext';

const State = () => <p data-testid="minimized">{String(useDesktop().minimized)}</p>;

describe('AppSwitcher', () => {
  it('is the apps icon (hexagon nodes)', () => {
    render(<DesktopProvider><AppSwitcher /></DesktopProvider>);
    const trigger = screen.getByRole('button', { name: 'Nhexa apps' });
    expect(trigger.querySelector('svg[data-icon="hexagon-nodes"]')).toBeInTheDocument();
    expect(trigger.querySelector('img')).not.toBeInTheDocument();
  });

  it("opens Nhexa's apps, and closes them", async () => {
    render(<DesktopProvider><AppSwitcher /><State /></DesktopProvider>);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Nhexa apps' }));
    expect(screen.getByTestId('minimized')).toHaveTextContent('true');
    await user.click(screen.getByRole('button', { name: 'Nhexa apps' }));
    expect(screen.getByTestId('minimized')).toHaveTextContent('false');
  });
});
