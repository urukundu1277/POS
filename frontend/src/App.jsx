import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import toast, { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import Login from "./pages/Login";
import { AuthProvider } from "./context/AuthContext";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Categories = lazy(() => import("./pages/Categories"));
const MenuManagement = lazy(() => import("./pages/MenuManagement"));
const SalesHistory = lazy(() => import("./pages/SalesHistory"));
const BusinessProfile = lazy(() => import("./pages/BusinessProfile"));
const BillPrint = lazy(() => import("./pages/BillPrint"));
const SuperAdminLogin = lazy(() => import("./pages/SuperAdminLogin"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const RevenueAnalytics = lazy(() => import("./pages/RevenueAnalytics"));
const Expenses = lazy(() => import("./pages/Expenses"));

const LazyComponent = ({ element }) => (
  <Suspense fallback={<div className="flex h-full items-center justify-center">Loading...</div>}>
    {element}
  </Suspense>
);

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<SuperAdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <SuperAdminDashboard />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <LazyComponent element={
              <ProtectedRoute>
                <Navbar>
                  <Dashboard />
                </Navbar>
              </ProtectedRoute>
            } />
          }
        />
        <Route
          path="/categories"
          element={
            <LazyComponent element={
              <ProtectedRoute>
                <Navbar>
                  <Categories />
                </Navbar>
              </ProtectedRoute>
            } />
          }
        />
        <Route
          path="/menu"
          element={
            <LazyComponent element={
              <ProtectedRoute>
                <Navbar>
                  <MenuManagement />
                </Navbar>
              </ProtectedRoute>
            } />
          }
        />
        <Route
          path="/sales"
          element={
            <LazyComponent element={
              <ProtectedRoute>
                <Navbar>
                  <SalesHistory />
                </Navbar>
              </ProtectedRoute>
            } />
          }
        />
        <Route
          path="/revenue"
          element={
            <LazyComponent element={
              <ProtectedRoute>
                <Navbar>
                  <RevenueAnalytics />
                </Navbar>
              </ProtectedRoute>
            } />
          }
        />
        <Route
          path="/expenses"
          element={
            <LazyComponent element={
              <ProtectedRoute>
                <Navbar>
                  <Expenses />
                </Navbar>
              </ProtectedRoute>
            } />
          }
        />
        <Route
          path="/profile"
          element={
            <LazyComponent element={
              <ProtectedRoute>
                <Navbar>
                  <BusinessProfile />
                </Navbar>
              </ProtectedRoute>
            } />
          }
        />
        <Route
          path="/bill/:id"
          element={
            <LazyComponent element={
              <ProtectedRoute>
                <BillPrint />
              </ProtectedRoute>
            } />
          }
        />
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
