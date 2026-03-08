import { useEffect, useState } from "react";

import axios from "../api/axios";

const VERIFY_FILTERS = ["All", "Pending", "Verified", "Rejected"];

function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");
  const [verifyFilter, setVerifyFilter] = useState("All");

  const loadHistory = async () => {
    setError("");
    try {
      const res = await axios.get("/payments/history");
      setPayments(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to load payment history");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadHistory();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const visiblePayments = payments.filter((payment) => {
    if (verifyFilter === "All") return true;
    return (payment.verification_status || "Pending") === verifyFilter;
  });

  return (
    <section className="page-card payment-history-page swiggy-payment-page">
      <div className="payment-history-hero">
        <h1>Payment History</h1>
        <p>Track all your successful and pending transactions.</p>
        <div className="payment-filter-row">
          {VERIFY_FILTERS.map((filterName) => (
            <button
              key={filterName}
              type="button"
              className={`payment-filter-btn ${verifyFilter === filterName ? "active" : ""}`}
              onClick={() => setVerifyFilter(filterName)}
            >
              {filterName}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="error-text">{error}</p>}
      {!visiblePayments.length && !error && <p>No payment records for this filter.</p>}

      {visiblePayments.map((payment) => (
        <div key={payment.id} className="history-item payment-history-item">
          <div className="payment-history-left">
            <p><strong>Order #{payment.order_id}</strong></p>
            <p>Transaction: {payment.transaction_id}</p>
            <p className="payment-verify-text">
              Verification: {payment.verification_status || "Pending"}
            </p>
            {payment.screenshot_url && (
              <a href={payment.screenshot_url} target="_blank" rel="noreferrer" className="payment-proof-link">
                <img
                  src={payment.screenshot_url}
                  alt={`Payment proof for order ${payment.order_id}`}
                  className="payment-proof-thumb"
                />
              </a>
            )}
          </div>
          <div className="payment-history-right">
            <p className="payment-amount">₹{payment.amount}</p>
            <p className={payment.status === "Success" ? "status-completed payment-chip" : "status-not-completed payment-chip"}>
              {payment.status}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}

export default PaymentHistory;
