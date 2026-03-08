import { useEffect, useState } from "react";

import axios from "../api/axios";

const VERIFY_STATUSES = ["Pending", "Verified", "Rejected"];

function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");

  const loadPayments = async () => {
    setError("");
    try {
      const res = await axios.get("/payments/all");
      setPayments(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to load payments");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPayments();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const updateVerification = async (paymentId, verificationStatus) => {
    setError("");
    try {
      await axios.patch(`/payments/verify/${paymentId}`, {
        verification_status: verificationStatus,
      });
      await loadPayments();
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to update verification status");
    }
  };

  return (
    <section className="admin-layout">
      <div className="page-card admin-payments-page">
        <h1>Payment Verification</h1>
        {error && <p className="error-text">{error}</p>}
        {!payments.length && !error && <p>No payments yet.</p>}

        {payments.map((payment) => (
          <article key={payment.id} className="payment-verify-card">
            <div className="payment-verify-info">
              <p><strong>Order #{payment.order_id}</strong></p>
              <p>Transaction: {payment.transaction_id || "-"}</p>
              <p>Method: {payment.method || "UPI"}</p>
              <p>Amount: ₹{payment.amount}</p>
              <p>
                Verification: <strong>{payment.verification_status || "Pending"}</strong>
              </p>
            </div>

            {payment.screenshot_url ? (
              <a href={payment.screenshot_url} target="_blank" rel="noreferrer" className="payment-proof-link">
                <img src={payment.screenshot_url} alt={`Payment proof for order ${payment.order_id}`} className="payment-proof-thumb" />
              </a>
            ) : (
              <p className="admin-note">No screenshot uploaded.</p>
            )}

            <div className="admin-row-actions">
              {VERIFY_STATUSES.map((status) => (
                <button
                  key={`${payment.id}-${status}`}
                  disabled={(payment.verification_status || "Pending") === status}
                  onClick={() => updateVerification(payment.id, status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default AdminPaymentsPage;
