import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ModalShell } from './ModalShell';

const renderShell = () => {
  const onClose = vi.fn();
  render(<ModalShell title="Edit shot" onClose={onClose}><textarea aria-label="Description" /></ModalShell>);
  return { onClose, overlay: screen.getByTestId('modal-overlay') };
};

describe('ModalShell', () => {
  it('shows its title and what it holds', () => {
    renderShell();
    expect(screen.getByText('Edit shot')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('closes from its ×', async () => {
    const { onClose } = renderShell();
    await userEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on a press and release outside it', () => {
    const { onClose, overlay } = renderShell();
    fireEvent.mouseDown(overlay);
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('stays open when a press inside it is released outside it (a text selection dragged out)', () => {
    const { onClose, overlay } = renderShell();
    fireEvent.mouseDown(screen.getByLabelText('Description'));
    fireEvent.click(overlay);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('stays open on a click inside it', async () => {
    const { onClose } = renderShell();
    await userEvent.click(screen.getByLabelText('Description'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
