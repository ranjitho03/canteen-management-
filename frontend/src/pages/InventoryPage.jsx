import { useEffect, useState } from "react";

import axios from "../api/axios";

function InventoryPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  const loadInventory = async () => {
    try {
      const res = await axios.get("/menu/inventory");
      setItems(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to load inventory");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadInventory();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const updateStock = async (id, stock) => {
    setError("");
    try {
      await axios.patch(`/menu/${id}/stock`, { stock: Number(stock) });
      await loadInventory();
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to update stock");
    }
  };

  return (
    <section className="admin-layout">
      <div className="page-card">
        <h1>Inventory</h1>
        {error && <p className="error-text">{error}</p>}

        {items.map((item) => (
          <div key={item.id} className="admin-row">
            <span>
              {item.name} ({item.category})
            </span>
            <div className="admin-row-actions">
              <input
                type="number"
                min="0"
                defaultValue={item.stock}
                onBlur={(e) => updateStock(item.id, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default InventoryPage;
