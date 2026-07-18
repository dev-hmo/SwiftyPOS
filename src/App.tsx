import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import POSLayout from './layouts/POSLayout';
import LandingPage from './pages/public/LandingPage';
import NotFoundPage from './pages/NotFoundPage';

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));

const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const SalesPage = lazy(() => import('./pages/admin/SalesPage'));
const InventoryPage = lazy(() => import('./pages/admin/InventoryPage'));
const CategoriesPage = lazy(() => import('./pages/admin/CategoriesPage'));
const ProductDetailPage = lazy(() => import('./pages/admin/ProductDetailPage'));
const IngredientDetailPage = lazy(() => import('./pages/admin/IngredientDetailPage'));
const IngredientsPage = lazy(() => import('./pages/admin/IngredientsPage'));
const RecipeConfiguratorPage = lazy(() => import('./pages/admin/RecipeConfiguratorPage'));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
const AccountingPage = lazy(() => import('./pages/admin/AccountingPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const RolesPage = lazy(() => import('./pages/admin/RolesPage'));
const ActivityLogPage = lazy(() => import('./pages/admin/ActivityLogPage'));

const POSPage = lazy(() => import('./pages/pos/POSPage'));
const KitchenDisplayPage = lazy(() => import('./pages/pos/KitchenDisplayPage'));

function LoadingFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <CircularProgress size={32} />
    </Box>
  );
}

const ADMIN_ROLES = ['admin'] as const;
const POS_ROLES = ['admin', 'cashier'] as const;
const KDS_ROLES = ['admin', 'kitchen'] as const;

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Suspense fallback={<LoadingFallback />}><LoginPage /></Suspense>} />
          <Route path="/" element={<LandingPage />} />

          {/* Admin Routes — admin only */}
          <Route element={<ProtectedRoute allowedRoles={[...ADMIN_ROLES]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Suspense fallback={<LoadingFallback />}><DashboardPage /></Suspense>} />
              <Route path="sales" element={<Suspense fallback={<LoadingFallback />}><SalesPage /></Suspense>} />
              <Route path="inventory">
                <Route index element={<Suspense fallback={<LoadingFallback />}><InventoryPage /></Suspense>} />
                <Route path="categories" element={<Suspense fallback={<LoadingFallback />}><CategoriesPage /></Suspense>} />
                <Route path="ingredients" element={<Suspense fallback={<LoadingFallback />}><IngredientsPage /></Suspense>} />
                <Route path="ingredients/:id" element={<Suspense fallback={<LoadingFallback />}><IngredientDetailPage /></Suspense>} />
                <Route path="recipes" element={<Suspense fallback={<LoadingFallback />}><RecipeConfiguratorPage /></Suspense>} />
                <Route path="product/:id" element={<Suspense fallback={<LoadingFallback />}><ProductDetailPage /></Suspense>} />
              </Route>
              <Route path="reports" element={<Suspense fallback={<LoadingFallback />}><ReportsPage /></Suspense>} />
              <Route path="accounting" element={<Suspense fallback={<LoadingFallback />}><AccountingPage /></Suspense>} />
              <Route path="activity" element={<Suspense fallback={<LoadingFallback />}><ActivityLogPage /></Suspense>} />
              <Route path="settings">
                <Route index element={<Suspense fallback={<LoadingFallback />}><SettingsPage /></Suspense>} />
                <Route path="roles" element={<Suspense fallback={<LoadingFallback />}><RolesPage /></Suspense>} />
              </Route>
            </Route>
          </Route>

          {/* POS Routes — admin + cashier */}
          <Route element={<ProtectedRoute allowedRoles={[...POS_ROLES]} />}>
            <Route path="/pos" element={<POSLayout />}>
              <Route index element={<Suspense fallback={<LoadingFallback />}><POSPage /></Suspense>} />
            </Route>
          </Route>

          {/* Kitchen Display Route — admin + kitchen */}
          <Route element={<ProtectedRoute allowedRoles={[...KDS_ROLES]} />}>
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
