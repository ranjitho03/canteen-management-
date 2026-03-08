import { useEffect, useState } from "react";

import axios from "../api/axios";

const ORDER_STATUSES = ["Pending", "Preparing", "Completed"];

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      const res = await axios.get("/orders/all");
      setOrders(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to load orders");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const updateStatus = async (orderId, status) => {
    setError("");
    try {
      await axios.patch(`/orders/${orderId}/status`, { status });
      await loadOrders();
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to update status");
    }
  };

  return (
    <section className="admin-layout">
      <div className="page-card">
        <h1>Orders</h1>
        {error && <p className="error-text">{error}</p>}
        {!orders.length && <p>No student orders yet.</p>}

        {orders.map((order) => (
          <div key={order.id} className="order-card">
            <p><strong>Order ID:</strong> #{order.id}</p>
            <p><strong>Total:</strong> ₹{order.total_price}</p>
            <p>
              <strong>Payment:</strong>{" "}
              <span className={order.payment_status === "Success" ? "status-completed" : "status-not-completed"}>
                {order.payment_status}
              </span>
            </p>
            <p>
              <strong>Verification:</strong>{" "}
              <span
                className={
                  (order.payment_verification_status || "Pending") === "Verified"
                    ? "status-completed"
                    : "status-not-completed"
                }
              >
                {order.payment_verification_status || "Pending"}
              </span>
            </p>
            <p>
              <strong>Items:</strong>{" "}
              {order.items.map((item) => `${item.name} x${item.quantity}`).join(", ")}
            </p>

            <div className="admin-row-actions">
              {ORDER_STATUSES.map((status) => (
                <button
                  key={status}
                  disabled={
                    order.status === status ||
                    ((status === "Preparing" || status === "Completed") &&
                      (order.payment_verification_status || "Pending") !== "Verified")
                  }
                  onClick={() => updateStatus(order.id, status)}
                >
                  {status}
                </button>
              ))}
              <strong className={
                order.status === "Completed"
                  ? "status-completed"
                  : order.status === "Pending"
                    ? "status-not-completed"
                    : "status-preparing"
              }>
                {order.status}
              </strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default OrdersPage;
