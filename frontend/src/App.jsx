import { BrowserRouter, Routes, Route } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import MenuManagement from "./pages/MenuManagement";
import SalesHistory from "./pages/SalesHistory";
import BusinessProfile from "./pages/BusinessProfile";
import BillPrint from "./pages/BillPrint";
import { AuthProvider } from "./context/AuthContext";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navbar>
                <Dashboard />
              </Navbar>
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <Navbar>
                <Categories />
              </Navbar>
            </ProtectedRoute>
          }
        />
        <Route
          path="/menu"
          element={
            <ProtectedRoute>
              <Navbar>
                <MenuManagement />
              </Navbar>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales"
          element={
            <ProtectedRoute>
              <Navbar>
                <SalesHistory />
              </Navbar>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Navbar>
                <BusinessProfile />
              </Navbar>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bill/:id"
          element={
            <ProtectedRoute>
              <BillPrint />
            </ProtectedRoute>
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
