import ReactMarkdown from 'react-markdown';

export default function Prose({ content }: { content: string }) {
  return (
    <div className="
      prose prose-invert max-w-none
      prose-p:text-[#e5e5e5] prose-p:leading-relaxed
      prose-headings:text-[#e5e5e5] prose-headings:font-semibold
      prose-h2:text-base prose-h2:mt-8 prose-h2:mb-3
      prose-h3:text-sm prose-h3:mt-6 prose-h3:mb-2
      prose-a:text-[#3b82f6] prose-a:no-underline hover:prose-a:underline
      prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-white/[0.03] prose-pre:border prose-pre:border-white/5 prose-pre:rounded prose-pre:p-4 prose-pre:font-mono prose-pre:text-[13px]
      prose-table:text-sm
      prose-th:text-[#737373] prose-th:font-normal prose-th:border-white/5
      prose-td:text-[#e5e5e5] prose-td:border-white/5
      prose-li:text-[#e5e5e5] marker:prose-li:text-[#525252]
      prose-blockquote:border-l-2 prose-blockquote:border-white/10 prose-blockquote:pl-4 prose-blockquote:text-[#737373] prose-blockquote:italic prose-blockquote:not-italic
      prose-hr:border-white/[0.06]
      prose-strong:text-[#e5e5e5]
    ">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
