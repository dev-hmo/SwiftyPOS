import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from '../useThemeStore';

describe('useThemeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ mode: 'light' });
  });

  it('defaults to light mode', () => {
    expect(useThemeStore.getState().mode).toBe('light');
  });

  it('toggles from light to dark', () => {
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().mode).toBe('dark');
  });

  it('toggles back from dark to light', () => {
    useThemeStore.getState().toggleTheme(); // → dark
    useThemeStore.getState().toggleTheme(); // → light
    expect(useThemeStore.getState().mode).toBe('light');
  });
});
