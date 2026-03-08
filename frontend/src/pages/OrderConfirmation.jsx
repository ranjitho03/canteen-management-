import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "../api/axios";

function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const order =
    location.state?.order || JSON.parse(localStorage.getItem("lastOrder") || "null");
  const statusClass =
    order?.status === "Completed"
      ? "status-completed"
      : order?.status === "Pending"
        ? "status-not-completed"
        : "status-preparing";
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paying, setPaying] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentVerificationStatus, setPaymentVerificationStatus] = useState("Pending");

  const toAddonList = (raw) => {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") return raw.split("|").filter(Boolean);
    return [];
  };

  const upiId = import.meta.env.VITE_UPI_ID || "rk8300089@okaxis";
  const payeeName = import.meta.env.VITE_UPI_NAME || "Ranjith Kumar";
  const amount = Number(order?.total_price || 0).toFixed(2);
  const baseParams = `pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${encodeURIComponent(amount)}&cu=INR&tn=${encodeURIComponent(`Order ${order?.id || ""}`)}`;
  const upiLink = `upi://pay?${baseParams}`;
  const gpayLink = `tez://upi/pay?${baseParams}`;
  const paytmLink = `paytmmp://pay?${baseParams}`;

  const openPaymentApp = (url) => {
    window.location.href = url;
  };

  const refreshCurrentPayment = async () => {
    if (!order?.id) return;

    try {
      const res = await axios.get("/payments/history");
      const currentPayment = (res.data || []).find((payment) => payment.order_id === order.id);
      if (!currentPayment) return;

      const nextStatus = currentPayment.verification_status || "Pending";
      setPaymentDone(true);
      setTransactionId(currentPayment.transaction_id || "");
      setPaymentVerificationStatus(nextStatus);

      if (nextStatus === "Rejected") {
        setPaymentMessage("Admin rejected your payment proof. Please upload a new screenshot and submit again.");
      } else if (nextStatus === "Verified") {
        setPaymentMessage("Payment verified by admin.");
      } else {
        setPaymentMessage("Payment submitted. Waiting for admin verification.");
      }
    } catch {
      // Ignore transient fetch errors during polling.
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshCurrentPayment();
    }, 0);

    return () => clearTimeout(timer);
  }, [order?.id]);

  useEffect(() => {
    if (!paymentDone || !order?.id) return undefined;

    const intervalId = setInterval(() => {
      refreshCurrentPayment();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [paymentDone, order?.id]);

  const markPaymentCompleted = async () => {
    if (!order?.id) return;
    if (paymentMethod === "UPI" && !proofFile) {
      setPaymentMessage("Please upload your payment screenshot to verify.");
      return;
    }

    setPaying(true);
    setPaymentMessage("");
    try {
      const formData = new FormData();
      formData.append("payment_method", paymentMethod);
      if (proofFile) {
        formData.append("proof_image", proofFile);
      }

      const res = await axios.post(`/payments/pay/${order.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setTransactionId(res.data.transaction_id || "");
      setPaymentVerificationStatus(res.data.verification_status || "Pending");
      setPaymentMessage("Payment submitted. Waiting for admin verification.");
      setPaymentDone(true);
      setShowPaymentConfirm(false);
    } catch (err) {
      setPaymentMessage(err?.response?.data?.detail || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  if (!order) {
    return (
      <section className="page-card swiggy-confirm-page">
        <h2>No recent order found.</h2>
        <Link className="confirm-link" to="/menu">Back to menu</Link>
      </section>
    );
  }

  return (
    <section className="page-card swiggy-confirm-page">
      <div className="confirm-hero">
        <h1>Order Confirmed</h1>
        <p className="confirm-order-id">Order ID: #{order.id}</p>
        <p>
          Status: <span className={statusClass}>{order.status}</span>
        </p>
        {order.table_id && <p>Table: #{order.table_id}</p>}
      </div>

      <div className="confirm-body">
        <h3>Items</h3>
        <ul className="confirm-items-list">
          {order.items?.map((item) => (
            <li key={item.id} className="confirm-item-row">
              <span>
                {item.name} x {item.quantity}
                {toAddonList(item.addon_names).length > 0 && (
                  <small className="addon-line">+ {toAddonList(item.addon_names).join(", ")}</small>
                )}
              </span>
              <strong>₹{(item.price * item.quantity).toFixed(2)}</strong>
            </li>
          ))}
        </ul>

        <p className="confirm-total">Total: ₹{order.total_price}</p>
        <p>Step 2: Complete payment using any UPI app below.</p>

        <div className="payment-app-row">
          <button
            className={`pay-option-btn ${paymentMethod === "UPI" ? "active-method" : ""}`}
            onClick={() => {
              setPaymentMethod("UPI");
              openPaymentApp(gpayLink);
            }}
            disabled={paymentDone}
          >
            Pay with GPay
          </button>
          <button
            className={`pay-option-btn ${paymentMethod === "UPI" ? "active-method" : ""}`}
            onClick={() => {
              setPaymentMethod("UPI");
              openPaymentApp(paytmLink);
            }}
            disabled={paymentDone}
          >
            Pay with Paytm
          </button>
          <button
            className={`pay-option-btn ${paymentMethod === "UPI" ? "active-method" : ""}`}
            onClick={() => {
              setPaymentMethod("UPI");
              openPaymentApp(upiLink);
            }}
            disabled={paymentDone}
          >
            Other UPI Apps
          </button>
          <button
            className={`pay-option-btn ${paymentMethod === "Cash" ? "active-method" : ""}`}
            onClick={() => setPaymentMethod("Cash")}
            disabled={paymentDone}
          >
            Pay at Counter
          </button>
        </div>

        <button
          className="confirm-pay-btn"
          onClick={() => setShowPaymentConfirm(true)}
          disabled={
            paying ||
            (paymentDone && paymentVerificationStatus !== "Rejected")
          }
        >
          {paying
            ? "Recording Payment..."
            : paymentVerificationStatus === "Rejected"
              ? "Re-submit Payment Proof"
              : "Payment Success - Confirm"}
        </button>
      </div>

      {paymentMessage && <p className="confirm-payment-message">{paymentMessage}</p>}
      {paymentDone && (
        <div
          className={
            paymentVerificationStatus === "Rejected"
              ? "payment-rejected-card"
              : paymentVerificationStatus === "Verified"
                ? "payment-success-card"
                : "payment-pending-card"
          }
          role="status"
          aria-live="polite"
        >
          <div
            className={
              paymentVerificationStatus === "Rejected"
                ? "payment-rejected-badge"
                : paymentVerificationStatus === "Verified"
                  ? "payment-success-tick"
                  : "payment-pending-badge"
            }
          >
            {paymentVerificationStatus === "Rejected"
              ? "!"
              : paymentVerificationStatus === "Verified"
                ? "✓"
                : "P"}
          </div>
          <p
            className={
              paymentVerificationStatus === "Rejected"
                ? "payment-rejected-title"
                : paymentVerificationStatus === "Verified"
                  ? "payment-success-title"
                  : "payment-pending-title"
            }
          >
            {paymentVerificationStatus === "Rejected"
              ? "Payment Rejected"
              : paymentVerificationStatus === "Verified"
                ? "Payment Verified"
                : "Payment Pending Verification"}
          </p>
          <p
            className={
              paymentVerificationStatus === "Rejected"
                ? "payment-rejected-id"
                : paymentVerificationStatus === "Verified"
                  ? "payment-success-id"
                  : "payment-pending-id"
            }
          >
            {paymentVerificationStatus === "Rejected"
              ? "Admin rejected proof. Upload a new screenshot and submit again."
              : paymentVerificationStatus === "Verified"
                ? "Admin has verified your payment."
                : "Order stays Pending until admin verifies it."}
          </p>
          {transactionId && (
            <p
              className={
                paymentVerificationStatus === "Rejected"
                  ? "payment-rejected-id"
                  : paymentVerificationStatus === "Verified"
                    ? "payment-success-id"
                    : "payment-pending-id"
              }
            >
              Transaction ID: {transactionId}
            </p>
          )}
        </div>
      )}
      {paymentDone && (
        <button className="confirm-next-btn" onClick={() => navigate("/payment-history")}>Go to Payment History</button>
      )}
      <Link className="confirm-link" to="/menu">Order More</Link>

      {showPaymentConfirm && (
        <div className="payment-confirm-overlay" onClick={() => setShowPaymentConfirm(false)}>
          <div className="payment-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Payment</h3>
            <p>Did you complete the payment in your UPI app?</p>
            <div className="payment-confirm-actions">
              <button type="button" className="confirm-link" onClick={() => setShowPaymentConfirm(false)}>
                Not Yet
              </button>
              <button type="button" className="confirm-pay-btn" onClick={markPaymentCompleted} disabled={paying}>
                {paying ? "Confirming..." : "Yes, I Paid"}
              </button>
            </div>

            <div className="payment-proof-block">
              <label htmlFor="payment-proof" className="payment-proof-label">
                Upload payment screenshot {paymentMethod === "UPI" ? "(required for UPI)" : "(optional)"}
              </label>
              <input
                id="payment-proof"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setProofFile(file);
                  if (proofPreview) {
                    URL.revokeObjectURL(proofPreview);
                  }
                  setProofPreview(file ? URL.createObjectURL(file) : "");
                }}
              />
              {proofPreview && (
                <img src={proofPreview} alt="Payment proof preview" className="payment-proof-preview" />
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default OrderConfirmation;
