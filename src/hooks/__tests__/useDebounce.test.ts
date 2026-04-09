import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should delay updating the value until the specified time has elapsed', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 300 }
    });

    rerender({ value: 'updated', delay: 300 });
    expect(result.current).toBe('initial');

    act(() => { vi.advanceTimersByTime(150); });
    expect(result.current).toBe('initial');

    act(() => { vi.advanceTimersByTime(150); });
    expect(result.current).toBe('updated');
  });

  it('should reset the timer if the value changes before the delay completes', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'first' }
    });

    rerender({ value: 'second' });
    act(() => { vi.advanceTimersByTime(200); });

    rerender({ value: 'third' });
    
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe('first');

    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current).toBe('third');
  });
});
