import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../useSettingsStore';

describe('useSettingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      businessName: 'My Enterprise',
      businessType: 'retail',
      currencySymbol: '$',
      taxRate: 0,
      receiptHeader: 'Welcome to our store!',
      receiptFooter: 'Thank you for your purchase!',
    });
  });

  describe('default values', () => {
    it('has correct defaults', () => {
      const state = useSettingsStore.getState();
      expect(state.businessName).toBe('My Enterprise');
      expect(state.businessType).toBe('retail');
      expect(state.currencySymbol).toBe('$');
      expect(state.taxRate).toBe(0);
    });
  });

  describe('updateSettings', () => {
    it('partially updates settings', () => {
      useSettingsStore.getState().updateSettings({ businessName: 'Swifty POS' });
      expect(useSettingsStore.getState().businessName).toBe('Swifty POS');
      // Other fields should remain unchanged
      expect(useSettingsStore.getState().currencySymbol).toBe('$');
    });

    it('updates multiple fields at once', () => {
      useSettingsStore.getState().updateSettings({
        businessName: 'New Corp',
        currencySymbol: '€',
        taxRate: 10,
      });
      const state = useSettingsStore.getState();
      expect(state.businessName).toBe('New Corp');
      expect(state.currencySymbol).toBe('€');
      expect(state.taxRate).toBe(10);
    });

    it('updates business type', () => {
      useSettingsStore.getState().updateSettings({ businessType: 'fb' });
      expect(useSettingsStore.getState().businessType).toBe('fb');
    });
  });
});
