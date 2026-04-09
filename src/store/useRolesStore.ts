import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isCustom: boolean;
  permissions: string[]; // List of permission IDs
}

export const SYSTEM_MODULES = [
  'Overview',
  'Sales & History',
  'Inventory',
  'Reports Hub',
  'Accounting',
  'Activity Log',
  'Settings',
  'Roles & Access',
  'POS Terminal',
  'Kitchen Display'
];

const DEFAULT_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access and control',
    isCustom: false,
    permissions: SYSTEM_MODULES,
  },
  {
    id: 'manager',
    name: 'Store Manager',
    description: 'Manage inventory, sales, and reports',
    isCustom: false,
    permissions: ['Overview', 'Sales & History', 'Inventory', 'Reports Hub', 'Activity Log', 'POS Terminal', 'Kitchen Display'],
  },
  {
    id: 'cashier',
    name: 'Cashier',
    description: 'Process sales and view basic history',
    isCustom: false,
    permissions: ['Overview', 'Sales & History', 'POS Terminal', 'Kitchen Display'],
  }
];

interface RolesState {
  roles: Role[];
  addRole: (role: Role) => void;
  updateRole: (id: string, updates: Partial<Role>) => void;
  deleteRole: (id: string) => void;
  hasPermission: (roleId: string, moduleName: string) => boolean;
}

export const useRolesStore = create<RolesState>()(
  persist(
    (set, get) => ({
      roles: DEFAULT_ROLES,
      
      addRole: (role) => set((state) => ({ 
        roles: [...state.roles, { ...role, isCustom: true }] 
      })),
      
      updateRole: (id, updates) => set((state) => ({
        roles: state.roles.map(r => r.id === id ? { ...r, ...updates } : r)
      })),
      
      deleteRole: (id) => set((state) => ({
        roles: state.roles.filter(r => r.id !== id || !r.isCustom) // Can't delete system roles
      })),

      hasPermission: (roleId, moduleName) => {
        const role = get().roles.find(r => r.id === roleId || r.name.toLowerCase() === roleId.toLowerCase());
        if (!role) return false;
        if (role.id === 'admin') return true; // Admin explicitly has everything
        return role.permissions.includes(moduleName);
      }
    }),
    {
      name: 'pos-roles-storage',
    }
  )
);
