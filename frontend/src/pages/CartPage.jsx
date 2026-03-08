import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "../api/axios";

function CartPage() {
  const [cart, setCart] = useState({ items: [], total_price: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tableIdFromQR = searchParams.get("table");

  const toAddonList = (raw) => {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") return raw.split("|").filter(Boolean);
    return [];
  };

  const loadCart = async () => {
    setError("");
    try {
      const res = await axios.get("/orders/cart");
      setCart(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to load cart");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCart();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const increaseQty = async (cartItem) => {
    setLoading(true);
    try {
      const res = await axios.put(`/orders/cart/${cartItem.id}`, {
        quantity: cartItem.quantity + 1,
      });
      setCart(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to update quantity");
    } finally {
      setLoading(false);
    }
  };

  const decreaseQty = async (cartItem) => {
    setLoading(true);
    try {
      if (cartItem.quantity === 1) {
        const res = await axios.delete(`/orders/cart/${cartItem.id}`);
        setCart(res.data);
      } else {
        const res = await axios.put(`/orders/cart/${cartItem.id}`, {
          quantity: cartItem.quantity - 1,
        });
        setCart(res.data);
      }
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to update quantity");
    } finally {
      setLoading(false);
    }
  };

  const placeOrder = async () => {
    if (!cart.items.length) return;
    setLoading(true);
    setCheckoutMessage("");
    try {
      const res = await axios.post("/orders/place", {
        table_id: tableIdFromQR ? Number(tableIdFromQR) : null,
      });

      localStorage.setItem("lastOrder", JSON.stringify(res.data));
      navigate("/order-confirmation", { state: { order: res.data } });
    } catch (err) {
      if (err?.response?.status === 401) {
        setCheckoutMessage("Session expired. Please login again.");
        navigate("/login");
      } else {
        setCheckoutMessage(err?.response?.data?.detail || "Unable to place order");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-card payment-history-page">
      <h1>Your Cart</h1>
      {tableIdFromQR && <p className="table-badge">Table #{tableIdFromQR}</p>}
      {error && <p className="error-text">{error}</p>}
      {!cart.items.length && <p>No items in cart.</p>}

      {cart.items.map((item) => (
        <div key={item.id} className="history-item">
          <div>
            <p><strong>{item.name}</strong></p>
            {toAddonList(item.addon_names).length > 0 && (
              <p className="addon-line">+ {toAddonList(item.addon_names).join(", ")}</p>
            )}
            <p>₹{item.price} x {item.quantity}</p>
          </div>
          <div className="qty-controls">
            <button onClick={() => decreaseQty(item)}>-</button>
            <span>{item.quantity}</span>
            <button onClick={() => increaseQty(item)}>+</button>
          </div>
          <p>₹{item.subtotal?.toFixed?.(2) || item.subtotal}</p>
        </div>
      ))}

      <hr />
      <h2 className="cart-total">Total: ₹{cart.total_price?.toFixed(2) || "0.00"}</h2>
      <button disabled={!cart.items.length || loading} onClick={placeOrder}>
        {loading ? "Processing..." : "Place Order & Continue"}
      </button>
      {checkoutMessage && <p className="error-text">{checkoutMessage}</p>}

      <p style={{ marginTop: 12 }}>
        <Link to="/menu">Back to Menu</Link>
      </p>
    </section>
  );
}

export default CartPage;
