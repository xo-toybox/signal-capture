// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ArchiveButton from '@/components/ArchiveButton';

vi.mock('@/lib/signal-actions', () => ({
  toggleArchive: vi.fn(),
}));

import { toggleArchive } from '@/lib/signal-actions';
const mockToggleArchive = vi.mocked(toggleArchive);

beforeEach(() => {
  mockToggleArchive.mockReset();
  mockToggleArchive.mockResolvedValue(true);
});

describe('ArchiveButton', () => {
  it('renders unarchived state', () => {
    render(<ArchiveButton signalId="s1" isArchived={false} />);
    expect(screen.getByRole('button', { name: 'Archive signal' })).toBeTruthy();
  });

  it('renders archived state', () => {
    render(<ArchiveButton signalId="s1" isArchived={true} />);
    expect(screen.getByRole('button', { name: 'Unarchive signal' })).toBeTruthy();
  });

  it('toggles optimistically on click', async () => {
    let resolveFetch!: (v: boolean) => void;
    mockToggleArchive.mockImplementation(
      () => new Promise((r) => { resolveFetch = r; }),
    );

    render(<ArchiveButton signalId="s1" isArchived={false} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Archive signal' }));
    });

    expect(screen.getByRole('button', { name: 'Unarchive signal' })).toBeTruthy();

    await act(async () => resolveFetch(true));
  });

  it('reverts on API failure', async () => {
    mockToggleArchive.mockRejectedValue(new Error('fail'));

    render(<ArchiveButton signalId="s1" isArchived={false} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Archive signal' }));
    });

    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: 'Archive signal' })).toBeTruthy();
    });
  });

  it('calls onChange on toggle', async () => {
    const onChange = vi.fn();

    render(<ArchiveButton signalId="s1" isArchived={false} onChange={onChange} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Archive signal' }));
    });

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false on revert', async () => {
    const onChange = vi.fn();
    mockToggleArchive.mockRejectedValue(new Error('fail'));

    render(<ArchiveButton signalId="s1" isArchived={false} onChange={onChange} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Archive signal' }));
    });

    await vi.waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(false);
    });
  });

  it('syncs state when isArchived prop changes (realtime update)', async () => {
    const { rerender } = render(<ArchiveButton signalId="s1" isArchived={false} />);
    expect(screen.getByRole('button', { name: 'Archive signal' })).toBeTruthy();

    rerender(<ArchiveButton signalId="s1" isArchived={true} />);

    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: 'Unarchive signal' })).toBeTruthy();
    });
  });

  it('syncs state when isArchived prop changes from true to false', async () => {
    const { rerender } = render(<ArchiveButton signalId="s1" isArchived={true} />);
    expect(screen.getByRole('button', { name: 'Unarchive signal' })).toBeTruthy();

    rerender(<ArchiveButton signalId="s1" isArchived={false} />);

    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: 'Archive signal' })).toBeTruthy();
    });
  });

  it('ignores clicks while busy', async () => {
    let resolveFetch!: (v: boolean) => void;
    mockToggleArchive.mockImplementation(
      () => new Promise((r) => { resolveFetch = r; }),
    );

    render(<ArchiveButton signalId="s1" isArchived={false} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Archive signal' }));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Unarchive signal' }));
    });

    expect(mockToggleArchive).toHaveBeenCalledTimes(1);

    await act(async () => resolveFetch(true));
  });
});
