import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useNotificationStore } from '../useNotificationStore';

describe('useNotificationStore', () => {
  beforeEach(() => {
    useNotificationStore.getState().clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-22T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start with an empty queue', () => {
    expect(useNotificationStore.getState().queue).toEqual([]);
  });

  it('should enqueue a notification with default severity (info)', () => {
    useNotificationStore.getState().enqueue('Test msg');
    const queue = useNotificationStore.getState().queue;
    
    expect(queue).toHaveLength(1);
    expect(queue[0].message).toBe('Test msg');
    expect(queue[0].severity).toBe('info');
    expect(queue[0].id).toBeDefined();
    expect(queue[0].timestamp).toBe(Date.now());
  });

  it('should enqueue a notification with specific severity', () => {
    useNotificationStore.getState().enqueue('Success msg', 'success');
    const queue = useNotificationStore.getState().queue;
    
    expect(queue).toHaveLength(1);
    expect(queue[0].message).toBe('Success msg');
    expect(queue[0].severity).toBe('success');
  });

  it('should stack multiple notifications', () => {
    useNotificationStore.getState().enqueue('First');
    useNotificationStore.getState().enqueue('Second');
    const queue = useNotificationStore.getState().queue;
    
    expect(queue).toHaveLength(2);
    expect(queue[0].message).toBe('First');
    expect(queue[1].message).toBe('Second');
  });

  it('should dequeue the oldest notification', () => {
    useNotificationStore.getState().enqueue('First');
    useNotificationStore.getState().enqueue('Second');
    
    useNotificationStore.getState().dequeue();
    const queue = useNotificationStore.getState().queue;
    
    expect(queue).toHaveLength(1);
    expect(queue[0].message).toBe('Second');
  });

  it('should clear all notifications', () => {
    useNotificationStore.getState().enqueue('First');
    useNotificationStore.getState().enqueue('Second');
    
    useNotificationStore.getState().clear();
    const queue = useNotificationStore.getState().queue;
    
    expect(queue).toHaveLength(0);
  });

  it('should cap queue at 50 items', () => {
    for (let i = 0; i < 60; i++) {
      useNotificationStore.getState().enqueue(`Notification ${i}`);
    }
    const queue = useNotificationStore.getState().queue;
    expect(queue).toHaveLength(50);
    // Oldest dropped, newest kept
    expect(queue[0].message).toBe('Notification 10');
    expect(queue[49].message).toBe('Notification 59');
  });
});
