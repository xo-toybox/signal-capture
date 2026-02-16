import type { ProcessingStatus } from './types';

export const STATUS_BG_COLORS: Record<ProcessingStatus, string> = {
  pending: 'bg-[#eab308]',
  processing: 'bg-[#3b82f6]',
  review: 'bg-[#3b82f6]',
  complete: 'bg-[#22c55e]',
  dismissed: 'bg-[#ef4444]',
  failed: 'bg-[#ef4444]',
};

export const STATUS_TEXT_COLORS: Record<ProcessingStatus, string> = {
  pending: 'text-[#eab308]',
  processing: 'text-[#3b82f6]',
  review: 'text-[#3b82f6]',
  complete: 'text-[#22c55e]',
  dismissed: 'text-[#ef4444]',
  failed: 'text-[#ef4444]',
};

export const STATUS_LABELS: Record<ProcessingStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  review: 'In Review',
  complete: 'Complete',
  dismissed: 'Dismissed',
  failed: 'Failed',
};
