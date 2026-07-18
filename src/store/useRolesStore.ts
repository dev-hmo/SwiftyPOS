import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role } from '../types/rbac';
import { SYSTEM_MODULES, DEFAULT_ROLE_PERMISSIONS } from '../types/rbac';
import { createTenantStorage } from '../utils/storage';
import { useAuthStore } from './useAuthStore';

const DEFAULT_ROLES: Role[] = [
  {
    id: 'tenant_admin',
    name: 'Tenant Admin',
    description: 'Full workspace access and control',
    isCustom: false,
    permissions: [...SYSTEM_MODULES],
  },
  {
    id: 'manager',
    name: 'Store Manager',
    description: 'Manage inventory, sales, and reports',
    isCustom: false,
    permissions: DEFAULT_ROLE_PERMISSIONS['manager'] ?? [],
  },
  {
    id: 'cashier',
    name: 'Cashier',
    description: 'Process sales and view basic history',
    isCustom: false,
    permissions: DEFAULT_ROLE_PERMISSIONS['cashier'] ?? [],
  },
];

/** Built-in roles that can never be deleted or have their permissions removed. */
const IMMUTABLE_ROLE_IDS = new Set(['tenant_admin', 'manager', 'cashier']);

interface RolesState {
  roles: Role[];
  addRole: (role: Role) => void;
  updateRole: (id: string, updates: Partial<Role>) => void;
  deleteRole: (id: string) => void;
  hasPermission: (roleId: string, moduleName: string) => boolean;
  getRolePermissions: (roleId: string) => string[];
}

export const useRolesStore = create<RolesState>()(
  persist(
    (set, get) => ({
      roles: DEFAULT_ROLES,

      addRole: (role) => {
        // SECURITY: Only tenant_admin can create custom roles.
        const user = useAuthStore.getState().user;
        if (!user || user.role !== 'tenant_admin') return;

        // SECURITY: Prevent creating roles with the same ID as a system role.
        if (IMMUTABLE_ROLE_IDS.has(role.id)) return;

        set((state) => ({
          roles: [...state.roles, { ...role, isCustom: true }],
        }));
      },

      updateRole: (id, updates) => {
        // SECURITY: Only tenant_admin can modify roles.
        const user = useAuthStore.getState().user;
        if (!user || user.role !== 'tenant_admin') return;

        // SECURITY: System roles can only have their permissions updated, not their ID or name.
        if (IMMUTABLE_ROLE_IDS.has(id)) {
          const { permissions, description } = updates;
          set((state) => ({
            roles: state.roles.map((r) =>
              r.id === id ? { ...r, permissions: permissions ?? r.permissions, description: description ?? r.description } : r,
            ),
          }));
          return;
        }

        set((state) => ({
          roles: state.roles.map((r) =>
            r.id === id ? { ...r, ...updates } : r,
          ),
        }));
      },

      deleteRole: (id) => {
        // SECURITY: Only tenant_admin can delete roles.
        const user = useAuthStore.getState().user;
        if (!user || user.role !== 'tenant_admin') return;

        // SECURITY: Never allow deletion of system roles.
        if (IMMUTABLE_ROLE_IDS.has(id)) return;

        set((state) => ({
          roles: state.roles.filter((r) => r.id !== id || !r.isCustom),
        }));
      },

      hasPermission: (roleId, moduleName) => {
        const normalized = roleId.toLowerCase();
        if (normalized === 'super_admin') return true;

        // SECURITY: Cashiers cannot access restricted modules even if the
        // local store is tampered with — the server-side RLS is the real
        // enforcement, but we add a client-side belt-and-suspenders check.
        const user = useAuthStore.getState().user;
        const restrictedModulesForCashier = [
          'Accounting', 'Settings', 'Roles & Access',
        ];
        if (user?.role === 'cashier' && restrictedModulesForCashier.includes(moduleName)) {
          return false;
        }

        const role = get().roles.find(
          (r) =>
            r.id.toLowerCase() === normalized ||
            r.name.toLowerCase() === normalized,
        );
        if (!role) return false;
        return role.permissions.some(p => p.toLowerCase() === moduleName.toLowerCase());
      },

      getRolePermissions: (roleId) => {
        const normalized = roleId.toLowerCase();
        if (normalized === 'super_admin') return [...SYSTEM_MODULES];

        const role = get().roles.find(
          (r) =>
            r.id.toLowerCase() === normalized ||
            r.name.toLowerCase() === normalized,
        );
        return role?.permissions ?? [];
      },
    }),
    {
      name: 'pos-roles',
      storage: createTenantStorage('pos-roles'),
    },
  ),
);

export type { Role };
export { SYSTEM_MODULES };
