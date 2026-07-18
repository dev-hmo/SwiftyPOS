import { useEffect, useRef } from 'react';

export interface ShortcutConfig {
  key: string;
  handler: () => void;
  description: string;
  ctrlKey?: boolean;
}

/**
 * Register global keyboard shortcuts.
 * Automatically prevents default behavior for function keys.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't fire if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      for (const shortcut of shortcutsRef.current) {
        const keyMatch = e.key === shortcut.key;
        const ctrlMatch = shortcut.ctrlKey ? e.ctrlKey || e.metaKey : true;
        if (keyMatch && ctrlMatch) {
          e.preventDefault();
          shortcut.handler();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
