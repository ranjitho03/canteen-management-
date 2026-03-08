import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";

function getStatusClass(status) {
  if (status === "Completed") return "status-completed";
  if (status === "Pending") return "status-not-completed";
  return "status-preparing";
}

function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  const toAddonList = (raw) => {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") return raw.split("|").filter(Boolean);
    return [];
  };

  const loadOrders = async () => {
    setError("");
    try {
      const res = await axios.get("/orders/history");
      setOrders(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to load order history");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="page-card payment-history-page">
      <h1>Order History</h1>
      {error && <p className="error-text">{error}</p>}
      {!orders.length && !error && <p>No previous orders.</p>}

      {orders.map((order) => (
        <div key={order.id} className="history-item">
          <div>
            <p>
              <strong>Order #{order.id}</strong>{" "}
              <span className={getStatusClass(order.status)}>{order.status}</span>
            </p>
            {order.items?.map((item) => (
              <p key={item.id}>
                {item.name} x {item.quantity}
                {toAddonList(item.addon_names).length > 0 && (
                  <span className="addon-line">+ {toAddonList(item.addon_names).join(", ")}</span>
                )}
              </p>
            ))}
          </div>
          <p><strong>₹{order.total_price}</strong></p>
        </div>
      ))}

      <p style={{ marginTop: 12 }}>
        <Link to="/menu">Back to Menu</Link>
      </p>
    </section>
  );
}

export default OrderHistoryPage;
