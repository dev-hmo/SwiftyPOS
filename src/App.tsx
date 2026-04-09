import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import POSLayout from './layouts/POSLayout';
import DashboardPage from './pages/admin/DashboardPage';
import InventoryPage from './pages/admin/InventoryPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import ProductDetailPage from './pages/admin/ProductDetailPage';
import IngredientDetailPage from './pages/admin/IngredientDetailPage';
import ReportsPage from './pages/admin/ReportsPage';
import SalesPage from './pages/admin/SalesPage';
import AccountingPage from './pages/admin/AccountingPage';
import SettingsPage from './pages/admin/SettingsPage';
import RolesPage from './pages/admin/RolesPage';
import ActivityLogPage from './pages/admin/ActivityLogPage';
import SaaSDashboard from './pages/admin/SaaSDashboard';
import POSPage from './pages/pos/POSPage';
import KitchenDisplayPage from './pages/pos/KitchenDisplayPage';
import LoginPage from './pages/auth/LoginPage';
import LandingPage from './pages/public/LandingPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import UpgradeModal from './components/saas/UpgradeModal';

function App() {
  return (
    <ErrorBoundary>
      <UpgradeModal />
      <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="inventory">
              <Route index element={<InventoryPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="product/:id" element={<ProductDetailPage />} />
              <Route path="ingredient/:id" element={<IngredientDetailPage />} />
            </Route>
            <Route path="reports" element={<ReportsPage />} />
            <Route path="accounting" element={<AccountingPage />} />
            <Route path="activity" element={<ActivityLogPage />} />
            <Route path="saas" element={<SaaSDashboard />} />
            <Route path="settings">
              <Route index element={<SettingsPage />} />
              <Route path="roles" element={<RolesPage />} />
            </Route>
          </Route>
        </Route>

        {/* Protected POS Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']} />}>
          <Route path="/pos" element={<POSLayout />}>
            <Route index element={<POSPage />} />
          </Route>
          <Route path="/kds" element={<KitchenDisplayPage />} />
        </Route>

        {/* Public SaaS Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
    </ErrorBoundary>
  );
}

export default App;
