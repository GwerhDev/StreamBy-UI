import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WaitingWorkers } from './WaitingWorkers';

describe('WaitingWorkers', () => {
  it('says the workers are waiting, and starts them for who can', async () => {
    const onStart = vi.fn();
    render(<WaitingWorkers canStart starting={false} onStart={onStart} />);
    expect(screen.getByTestId('workers-waiting')).toHaveTextContent('Workers waiting');
    await userEvent.setup().click(screen.getByRole('button', { name: /Start workers/ }));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("only says so to who can't run jobs", () => {
    render(<WaitingWorkers canStart={false} starting={false} onStart={() => {}} />);
    expect(screen.getByTestId('workers-waiting')).toHaveTextContent('Workers waiting');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it("can't be started twice while starting", () => {
    render(<WaitingWorkers canStart starting onStart={() => {}} />);
    expect(screen.getByRole('button', { name: /Starting/ })).toBeDisabled();
  });
});
