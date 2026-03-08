import { Navigate, Route, Routes, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import "./App.css";
import axios from "./api/axios";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Register from "./pages/Register";
import Menu from "./pages/Menu";
import OrderConfirmation from "./pages/OrderConfirmation";
import AdminDashboard from "./pages/AdminDashboard";
import InventoryPage from "./pages/InventoryPage";
import MenuManagementPage from "./pages/MenuManagementPage";
import OrdersPage from "./pages/OrdersPage";
import PaymentHistory from "./pages/PaymentHistory";
import AdminPaymentsPage from "./pages/AdminPaymentsPage";
import CartPage from "./pages/CartPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AdminRoute({ children, role, loadingUser }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (loadingUser) {
    return null;
  }
  if (role !== "admin") {
    return <Navigate to="/menu" replace />;
  }
  return children;
}

function Header({ user, onLogout }) {
  return (
    <header className="app-header">
      <div className="app-brand-block">
        <h2 className="app-brand-title">DMI Canteen</h2>
        <p className="app-brand-subtitle">Fast campus ordering</p>
      </div>
      <nav className="app-nav" aria-label="Primary navigation">
        <Link className="nav-link" to="/menu">Menu</Link>
        {user && <Link className="nav-link" to="/cart">Cart</Link>}
        {user && <Link className="nav-link" to="/orders-history">Orders</Link>}
        {user && <Link className="nav-link" to="/payment-history">Payment History</Link>}
        {user?.role === "admin" && <Link className="nav-link" to="/admin">Admin</Link>}
        {user && <button className="logout-btn" onClick={onLogout}>Logout</button>}
      </nav>
    </header>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();

  const loadCurrentUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoadingUser(false);
      return;
    }

    try {
      const res = await axios.get("/users/me");
      setUser(res.data);
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCurrentUser();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <div className="app-shell">
      {user && <Header user={user} onLogout={handleLogout} />}
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login onLogin={loadCurrentUser} />} />
          <Route path="/admin-login" element={<AdminLogin onLogin={loadCurrentUser} />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/menu"
            element={
              <ProtectedRoute>
                <Menu user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-confirmation"
            element={
              <ProtectedRoute>
                <OrderConfirmation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders-history"
            element={
              <ProtectedRoute>
                <OrderHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-history"
            element={
              <ProtectedRoute>
                <PaymentHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute role={user?.role} loadingUser={loadingUser}>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/menu"
            element={
              <AdminRoute role={user?.role} loadingUser={loadingUser}>
                <MenuManagementPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminRoute role={user?.role} loadingUser={loadingUser}>
                <OrdersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/inventory"
            element={
              <AdminRoute role={user?.role} loadingUser={loadingUser}>
                <InventoryPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <AdminRoute role={user?.role} loadingUser={loadingUser}>
                <AdminPaymentsPage />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;