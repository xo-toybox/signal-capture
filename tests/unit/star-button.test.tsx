// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import StarButton from '@/components/StarButton';

vi.mock('@/lib/signal-actions', () => ({
  toggleStar: vi.fn(),
}));

import { toggleStar } from '@/lib/signal-actions';
const mockToggleStar = vi.mocked(toggleStar);

beforeEach(() => {
  mockToggleStar.mockReset();
  mockToggleStar.mockResolvedValue(true);
});

describe('StarButton', () => {
  it('renders unstarred state', () => {
    render(<StarButton signalId="s1" isStarred={false} />);
    const btn = screen.getByRole('button', { name: 'Star signal' });
    expect(btn.textContent).toBe('\u2606');
  });

  it('renders starred state', () => {
    render(<StarButton signalId="s1" isStarred={true} />);
    const btn = screen.getByRole('button', { name: 'Unstar signal' });
    expect(btn.textContent).toBe('\u2605');
  });

  it('toggles optimistically on click', async () => {
    let resolveFetch!: (v: boolean) => void;
    mockToggleStar.mockImplementation(
      () => new Promise((r) => { resolveFetch = r; }),
    );

    render(<StarButton signalId="s1" isStarred={false} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Star signal' }));
    });

    // Optimistic: should show starred immediately
    expect(screen.getByRole('button', { name: 'Unstar signal' }).textContent).toBe('\u2605');

    await act(async () => resolveFetch(true));
  });

  it('reverts on API failure', async () => {
    mockToggleStar.mockRejectedValue(new Error('fail'));

    render(<StarButton signalId="s1" isStarred={false} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Star signal' }));
    });

    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: 'Star signal' }).textContent).toBe('\u2606');
    });
  });

  it('calls onChange on toggle', async () => {
    const onChange = vi.fn();

    render(<StarButton signalId="s1" isStarred={false} onChange={onChange} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Star signal' }));
    });

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false on revert', async () => {
    const onChange = vi.fn();
    mockToggleStar.mockRejectedValue(new Error('fail'));

    render(<StarButton signalId="s1" isStarred={false} onChange={onChange} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Star signal' }));
    });

    await vi.waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(false);
    });
  });

  it('syncs state when isStarred prop changes (realtime update)', async () => {
    const { rerender } = render(<StarButton signalId="s1" isStarred={false} />);
    expect(screen.getByRole('button', { name: 'Star signal' }).textContent).toBe('\u2606');

    // Simulate realtime update changing the prop
    rerender(<StarButton signalId="s1" isStarred={true} />);

    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: 'Unstar signal' }).textContent).toBe('\u2605');
    });
  });

  it('syncs state when isStarred prop changes from true to false', async () => {
    const { rerender } = render(<StarButton signalId="s1" isStarred={true} />);
    expect(screen.getByRole('button', { name: 'Unstar signal' }).textContent).toBe('\u2605');

    rerender(<StarButton signalId="s1" isStarred={false} />);

    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: 'Star signal' }).textContent).toBe('\u2606');
    });
  });

  it('ignores clicks while busy', async () => {
    let resolveFetch!: (v: boolean) => void;
    mockToggleStar.mockImplementation(
      () => new Promise((r) => { resolveFetch = r; }),
    );

    render(<StarButton signalId="s1" isStarred={false} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Star signal' }));
    });

    // Second click while first is in-flight
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Unstar signal' }));
    });

    expect(mockToggleStar).toHaveBeenCalledTimes(1);

    await act(async () => resolveFetch(true));
  });
});
