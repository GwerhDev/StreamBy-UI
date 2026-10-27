import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import s from './MarkdownView.module.css';

// A document's markdown, rendered. Raw HTML in it is shown as text, never run.
export const MarkdownView = ({ content }: { content: string }) => (
  <div className={s.markdown} data-testid="markdown-view">
    {content.trim()
      ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      : <p className={s.empty}>Nothing written yet.</p>}
  </div>
);
