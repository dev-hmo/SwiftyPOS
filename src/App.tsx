import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminRoute from './components/auth/SuperAdminRoute';
import AdminLayout from './layouts/AdminLayout';
import POSLayout from './layouts/POSLayout';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import LandingPage from './pages/public/LandingPage';
import NotFoundPage from './pages/NotFoundPage';

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const UpgradeModal = lazy(() => import('./components/saas/UpgradeModal'));

const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const SalesPage = lazy(() => import('./pages/admin/SalesPage'));
const InventoryPage = lazy(() => import('./pages/admin/InventoryPage'));
const CategoriesPage = lazy(() => import('./pages/admin/CategoriesPage'));
const ProductDetailPage = lazy(() => import('./pages/admin/ProductDetailPage'));
const IngredientDetailPage = lazy(() => import('./pages/admin/IngredientDetailPage'));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
const AccountingPage = lazy(() => import('./pages/admin/AccountingPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const RolesPage = lazy(() => import('./pages/admin/RolesPage'));
const ActivityLogPage = lazy(() => import('./pages/admin/ActivityLogPage'));
const BillingPage = lazy(() => import('./pages/admin/BillingPage'));

const POSPage = lazy(() => import('./pages/pos/POSPage'));
const KitchenDisplayPage = lazy(() => import('./pages/pos/KitchenDisplayPage'));

const SuperAdminDashboard = lazy(() => import('./pages/super-admin/SuperAdminDashboard'));

function LoadingFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <CircularProgress size={32} />
    </Box>
  );
}

const TENANT_ROUTES_READ = ['tenant_admin', 'manager', 'cashier'] as const;
const TENANT_ROUTES_WRITE = ['tenant_admin', 'manager'] as const;

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <UpgradeModal />
      </Suspense>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Suspense fallback={<LoadingFallback />}><LoginPage /></Suspense>} />
          <Route path="/" element={<LandingPage />} />

          {/* Super Admin Routes — completely isolated from tenant data */}
          <Route element={<SuperAdminRoute />}>
            <Route path="/super-admin" element={<SuperAdminLayout />}>
              <Route index element={<Suspense fallback={<LoadingFallback />}><SuperAdminDashboard /></Suspense>} />
            </Route>
          </Route>

          {/* Protected Tenant Admin Routes — all tenant roles (no super_admin) */}
          <Route element={<ProtectedRoute allowedRoles={[...TENANT_ROUTES_READ]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Suspense fallback={<LoadingFallback />}><DashboardPage /></Suspense>} />
              <Route path="sales" element={<Suspense fallback={<LoadingFallback />}><SalesPage /></Suspense>} />
            </Route>
          </Route>

          {/* Protected Tenant Admin Routes — tenant_admin + manager only (inventory, settings, etc.) */}
          <Route element={<ProtectedRoute allowedRoles={[...TENANT_ROUTES_WRITE]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="inventory">
                <Route index element={<Suspense fallback={<LoadingFallback />}><InventoryPage /></Suspense>} />
                <Route path="categories" element={<Suspense fallback={<LoadingFallback />}><CategoriesPage /></Suspense>} />
                <Route path="product/:id" element={<Suspense fallback={<LoadingFallback />}><ProductDetailPage /></Suspense>} />
                <Route path="ingredient/:id" element={<Suspense fallback={<LoadingFallback />}><IngredientDetailPage /></Suspense>} />
              </Route>
              <Route path="reports" element={<Suspense fallback={<LoadingFallback />}><ReportsPage /></Suspense>} />
              <Route path="accounting" element={<Suspense fallback={<LoadingFallback />}><AccountingPage /></Suspense>} />
              <Route path="activity" element={<Suspense fallback={<LoadingFallback />}><ActivityLogPage /></Suspense>} />
              <Route path="settings">
                <Route index element={<Suspense fallback={<LoadingFallback />}><SettingsPage /></Suspense>} />
                <Route path="roles" element={<Suspense fallback={<LoadingFallback />}><RolesPage /></Suspense>} />
              </Route>
              <Route path="billing" element={<Suspense fallback={<LoadingFallback />}><BillingPage /></Suspense>} />
            </Route>
          </Route>

          {/* Protected POS Routes — no super_admin */}
          <Route element={<ProtectedRoute allowedRoles={[...TENANT_ROUTES_READ]} />}>
            <Route path="/pos" element={<POSLayout />}>
              <Route index element={<Suspense fallback={<LoadingFallback />}><POSPage /></Suspense>} />
            </Route>
            <Route path="/kds" element={<Suspense fallback={<LoadingFallback />}><KitchenDisplayPage /></Suspense>} />
          </Route>

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
