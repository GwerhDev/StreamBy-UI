import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { faShield } from '@fortawesome/free-solid-svg-icons';
import { Accordion } from './Accordion';

describe('Accordion', () => {
  it('shows its title and description, open by default', () => {
    render(<Accordion icon={faShield} title="Roles" description="What each role can do"><p>Inside</p></Accordion>);
    const head = screen.getByRole('button', { name: /Roles/ });
    expect(head).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('What each role can do')).toBeInTheDocument();
    expect(screen.getByText('Inside')).toBeInTheDocument();
    expect(document.getElementById(head.getAttribute('aria-controls')!)).toContainElement(screen.getByText('Inside'));
  });

  it('closes and opens from its head', async () => {
    const user = userEvent.setup();
    render(<Accordion icon={faShield} title="Roles"><p>Inside</p></Accordion>);
    const head = screen.getByRole('button', { name: 'Roles' });
    await user.click(head);
    expect(head).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Inside')).not.toBeInTheDocument();
    await user.click(head);
    expect(screen.getByText('Inside')).toBeInTheDocument();
  });

  it('starts closed when told', () => {
    render(<Accordion icon={faShield} title="Roles" defaultOpen={false}><p>Inside</p></Accordion>);
    expect(screen.getByRole('button', { name: 'Roles' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Inside')).not.toBeInTheDocument();
  });
});
