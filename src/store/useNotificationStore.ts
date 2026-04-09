import { create } from 'zustand';

export type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  message: string;
  severity: NotificationSeverity;
  timestamp: number;
}

interface NotificationState {
  queue: Notification[];
  enqueue: (message: string, severity?: NotificationSeverity) => void;
  dequeue: () => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  queue: [],
  enqueue: (message, severity = 'info') =>
    set((state) => ({
      queue: [
        ...state.queue,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          message,
          severity,
          timestamp: Date.now(),
        },
      ],
    })),
  dequeue: () => set((state) => ({ queue: state.queue.slice(1) })),
  clear: () => set({ queue: [] }),
}));
