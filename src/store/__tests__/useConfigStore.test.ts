import { describe, it, expect, beforeEach } from 'vitest';
import { useConfigStore } from '../useConfigStore';

describe('useConfigStore', () => {
  beforeEach(() => {
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
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Beverages');
      expect(result!.productCount).toBe(0);
      expect(useConfigStore.getState().categories).toHaveLength(4);
    });

    it('rejects duplicate category names', () => {
      const result = useConfigStore.getState().addCategory('Coffee Beans');
      expect(result).toBeNull();
      expect(useConfigStore.getState().categories).toHaveLength(3);
    });

    it('rejects empty names', () => {
      const result = useConfigStore.getState().addCategory('');
      expect(result).toBeNull();
    });

    it('trims whitespace', () => {
      const result = useConfigStore.getState().addCategory('  Beverages  ');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Beverages');
    });
  });

  describe('addTax', () => {
    it('appends a new tax configuration', () => {
      const result = useConfigStore.getState().addTax('Luxury Tax', 15);
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Luxury Tax');
      expect(result!.rate).toBe(15);
      expect(useConfigStore.getState().taxes).toHaveLength(3);
    });

    it('rejects duplicate tax names', () => {
      const result = useConfigStore.getState().addTax('Tax Exempt', 5);
      expect(result).toBeNull();
    });

    it('rejects invalid rates', () => {
      expect(useConfigStore.getState().addTax('Bad Tax', -5)).toBeNull();
      expect(useConfigStore.getState().addTax('Bad Tax', 150)).toBeNull();
    });
  });

  describe('addIncomeAccount', () => {
    it('appends a new income account', () => {
      const result = useConfigStore.getState().addIncomeAccount('4200', 'Interest Income');
      expect(result).not.toBeNull();
      expect(result!.code).toBe('4200');
      expect(result!.name).toBe('Interest Income');
      expect(useConfigStore.getState().incomeAccounts).toHaveLength(3);
    });

    it('rejects duplicate codes', () => {
      const result = useConfigStore.getState().addIncomeAccount('4000', 'New Name');
      expect(result).toBeNull();
    });
  });

  describe('addExpenseAccount', () => {
    it('appends a new expense account', () => {
      const result = useConfigStore.getState().addExpenseAccount('5200', 'Rent');
      expect(result).not.toBeNull();
      expect(result!.code).toBe('5200');
      expect(result!.name).toBe('Rent');
      expect(useConfigStore.getState().expenseAccounts).toHaveLength(3);
    });

    it('rejects duplicate names', () => {
      const result = useConfigStore.getState().addExpenseAccount('5200', 'Supplies Expense');
      expect(result).toBeNull();
    });
  });
});
