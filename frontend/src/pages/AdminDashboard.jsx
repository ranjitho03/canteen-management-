import { Link } from "react-router-dom";

function AdminDashboard() {
  return (
    <section className="admin-layout">
      <div className="page-card">
        <h1>Admin Dashboard</h1>
        <p>Manage canteen operations from one place.</p>
        <div className="admin-nav-grid">
          <Link className="auth-link-btn" to="/admin/menu">Menu Management</Link>
          <Link className="auth-link-btn" to="/admin/orders">Orders</Link>
          <Link className="auth-link-btn" to="/admin/inventory">Inventory</Link>
          <Link className="auth-link-btn" to="/admin/payments">Payments Verification</Link>
        </div>
      </div>
    </section>
  );
}

export default AdminDashboard;
