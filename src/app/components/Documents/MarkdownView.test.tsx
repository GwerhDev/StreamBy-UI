import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarkdownView } from './MarkdownView';

describe('MarkdownView', () => {
  it('renders markdown, with tables and task lists', () => {
    render(<MarkdownView content={'## Title\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n- [x] done\n'} />);
    const view = screen.getByTestId('markdown-view');
    expect(view.querySelector('h2')).toHaveTextContent('Title');
    expect(view.querySelector('table')).not.toBeNull();
    expect(view.querySelector('input[type="checkbox"]')).not.toBeNull();
  });

  // A document is anyone's text (an agent's too): its HTML is never run.
  it("never runs a document's HTML", () => {
    render(<MarkdownView content={'<script>window.hacked = true</script>\n\n<img src="x" onerror="window.hacked = true">'} />);
    const view = screen.getByTestId('markdown-view');
    expect(view.querySelector('script')).toBeNull();
    expect(view.querySelector('img')).toBeNull();
  });

  it('says when nothing is written yet', () => {
    render(<MarkdownView content="  " />);
    expect(screen.getByTestId('markdown-view')).toHaveTextContent('Nothing written yet.');
  });
});
