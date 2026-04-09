import { describe, it, expect, beforeEach } from 'vitest';
import { useConfigStore } from '../useConfigStore';

describe('useConfigStore', () => {
  beforeEach(() => {
    // Reset to default state
    useConfigStore.setState({
      categories: [
        { id: '1', name: 'Coffee Beans', productCount: 15 },
        { id: '2', name: 'Equipment', productCount: 8 },
        { id: '3', name: 'Pastries', productCount: 12 },
      ],
      taxes: [
        { id: '1', name: 'Standard Sales Tax (8%)', rate: 8 },
        { id: '2', name: 'Tax Exempt', rate: 0 },
      ],
      incomeAccounts: [
        { id: '1', code: '4000', name: 'Sales Revenue' },
        { id: '2', code: '4100', name: 'Service Revenue' },
      ],
      expenseAccounts: [
        { id: '1', code: '5000', name: 'Cost of Goods Sold (COGS)' },
        { id: '2', code: '5100', name: 'Supplies Expense' },
      ],
    });
  });

  describe('default data', () => {
    it('has 3 default categories', () => {
      expect(useConfigStore.getState().categories).toHaveLength(3);
    });

    it('has 2 default tax configurations', () => {
      expect(useConfigStore.getState().taxes).toHaveLength(2);
    });

    it('has income and expense accounts', () => {
      expect(useConfigStore.getState().incomeAccounts).toHaveLength(2);
      expect(useConfigStore.getState().expenseAccounts).toHaveLength(2);
    });
  });

  describe('addCategory', () => {
    it('appends a new category with unique ID', () => {
      const result = useConfigStore.getState().addCategory('Beverages');
      expect(result.name).toBe('Beverages');
      expect(result.productCount).toBe(0);
      expect(useConfigStore.getState().categories).toHaveLength(4);
    });
  });

  describe('addTax', () => {
    it('appends a new tax configuration', () => {
      const result = useConfigStore.getState().addTax('Luxury Tax', 15);
      expect(result.name).toBe('Luxury Tax');
      expect(result.rate).toBe(15);
      expect(useConfigStore.getState().taxes).toHaveLength(3);
    });
  });

  describe('addIncomeAccount', () => {
    it('appends a new income account', () => {
      const result = useConfigStore.getState().addIncomeAccount('4200', 'Interest Income');
      expect(result.code).toBe('4200');
      expect(result.name).toBe('Interest Income');
      expect(useConfigStore.getState().incomeAccounts).toHaveLength(3);
    });
  });

  describe('addExpenseAccount', () => {
    it('appends a new expense account', () => {
      const result = useConfigStore.getState().addExpenseAccount('5200', 'Rent');
      expect(result.code).toBe('5200');
      expect(useConfigStore.getState().expenseAccounts).toHaveLength(3);
    });
  });
});
