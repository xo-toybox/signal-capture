'use client';

interface Props {
  count: number;
  onPreview: () => void;
  onCancel: () => void;
}

export default function SelectionBar({ count, onPreview, onCancel }: Props) {
  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-between px-4 py-3 border-t border-white/[0.06]"
      style={{
        background: 'rgba(14,14,14,0.95)',
        backdropFilter: 'blur(12px)',
        animation: 'selbar-slideUp 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <span className="font-mono text-sm text-[#e5e5e5]">
        {count} selected
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 font-mono text-[13px] text-white/30 transition-colors duration-150 hover:text-white/50 min-h-[44px]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onPreview}
          disabled={count === 0}
          className="px-5 py-2 rounded-xl font-mono text-[13px] font-medium text-white transition-all duration-200 disabled:opacity-20 min-h-[44px]"
          style={{
            background: count > 0 ? '#3b82f6' : 'rgba(255,255,255,0.05)',
            boxShadow: count > 0 ? '0 2px 16px -4px rgba(59,130,246,0.3)' : 'none',
          }}
        >
          Preview
        </button>
      </div>

      <style jsx>{`
        @keyframes selbar-slideUp {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
