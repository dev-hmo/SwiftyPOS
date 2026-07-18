import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role } from '../types/rbac';
import { SYSTEM_MODULES, DEFAULT_ROLE_PERMISSIONS } from '../types/rbac';
import { createAppStorage } from '../utils/storage';
import { useAuthStore } from './useAuthStore';

const DEFAULT_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full system access and control',
    isCustom: false,
    permissions: [...SYSTEM_MODULES],
  },
  {
    id: 'cashier',
    name: 'Cashier',
    description: 'Process sales and view history',
    isCustom: false,
    permissions: DEFAULT_ROLE_PERMISSIONS['cashier'] ?? [],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    description: 'View and manage kitchen display orders',
    isCustom: false,
    permissions: DEFAULT_ROLE_PERMISSIONS['kitchen'] ?? [],
  },
];

/** Built-in roles that can never be deleted or have their permissions removed. */
const IMMUTABLE_ROLE_IDS = new Set(['admin', 'cashier', 'kitchen']);

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
        const user = useAuthStore.getState().user;
        if (!user || user.role !== 'admin') return;

        if (IMMUTABLE_ROLE_IDS.has(role.id)) return;

        set((state) => ({
          roles: [...state.roles, { ...role, isCustom: true }],
        }));
      },

      updateRole: (id, updates) => {
        const user = useAuthStore.getState().user;
        if (!user || user.role !== 'admin') return;

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
        const user = useAuthStore.getState().user;
        if (!user || user.role !== 'admin') return;

        if (IMMUTABLE_ROLE_IDS.has(id)) return;

        set((state) => ({
          roles: state.roles.filter((r) => r.id !== id || !r.isCustom),
        }));
      },

      hasPermission: (roleId, moduleName) => {
        const normalized = roleId.toLowerCase();

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
      storage: createAppStorage('pos-roles'),
    },
  ),
);

export type { Role };
export { SYSTEM_MODULES };
