export type Feature = 'kds' | 'recipes' | 'advanced_reports' | 'custom_rbac';

export const SYSTEM_MODULES = [
  'Overview',
  'Sales & History',
  'Inventory',
  'Products',
  'Ingredients',
  'Variants',
  'Reports Hub',
  'Accounting',
  'Activity Log',
  'Settings',
  'Roles & Access',
  'POS Terminal',
  'Kitchen Display',
] as const;

export type ModuleId = (typeof SYSTEM_MODULES)[number];

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: ModuleId;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isCustom: boolean;
  permissions: string[];
}

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [...SYSTEM_MODULES],
  cashier: ['Overview', 'Sales & History', 'POS Terminal'],
  kitchen: ['Kitchen Display'],
};
