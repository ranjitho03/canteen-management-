import { useEffect, useState } from "react";

import axios from "../api/axios";

const initialForm = {
  name: "",
  category: "tiffen",
  price: "",
  stock: "",
  customization_options: "",
  image: null,
};

const categoryOrder = [
  "tiffen",
  "lunch",
  "dinner",
  "snack",
  "soft drinks",
  "chocolates",
  "biscuite",
  "stationary",
];

function MenuManagementPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const imageBaseUrl = import.meta.env.DEV
    ? ""
    : (import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`);

  const loadItems = async () => {
    try {
      const res = await axios.get("/menu/");
      setItems(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to load menu items");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadItems();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const submitForm = async (e) => {
    e.preventDefault();
    setError("");

    const parsedPrice = Number(form.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 1 || parsedPrice > 100) {
      setError("Price must be between 1 and 100");
      return;
    }

    const parsedStock = Number(form.stock);
    if (!Number.isFinite(parsedStock) || parsedStock < 0) {
      setError("Stock must be 0 or more");
      return;
    }

    const payload = {
      name: form.name,
      category: form.category,
      price: String(parsedPrice),
      stock: String(parsedStock),
      customization_options: form.customization_options || "",
    };

    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, value);
    });
    if (form.image) {
      formData.append("image", form.image);
    }

    try {
      if (editId) {
        await axios.put(`/menu/${editId}`, formData);
      } else {
        await axios.post("/menu/", formData);
      }
      setForm(initialForm);
      setEditId(null);
      await loadItems();
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to save menu item");
    }
  };

  const editItem = (item) => {
    setEditId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      price: String(item.price),
      stock: String(item.stock),
      customization_options: item.customization_options || "",
      image: null,
    });
  };

  const deleteItem = async (id) => {
    setError("");
    try {
      await axios.delete(`/menu/${id}`);
      if (editId === id) {
        setEditId(null);
        setForm(initialForm);
      }
      await loadItems();
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to delete item");
    }
  };

  const groupedItems = categoryOrder
    .map((category) => ({
      category,
      items: items.filter((item) => (item.category || "").toLowerCase() === category),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <section className="admin-layout">
      <div className="page-card">
        <h1>Menu Management</h1>
        {error && <p className="error-text">{error}</p>}

        <form className="admin-form" onSubmit={submitForm}>
          <input
            required
            placeholder="Food Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="tiffen">tiffen</option>
            <option value="lunch">lunch</option>
            <option value="snack">snack</option>
            <option value="chocolates">chocolates</option>
            <option value="biscuite">biscuite</option>
            <option value="soft drinks">soft drinks</option>
            <option value="dinner">dinner</option>
            <option value="stationary">stationary</option>
          </select>
          <input
            required
            type="number"
            min="1"
            max="100"
            step="1"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <input
            required
            type="number"
            min="0"
            step="1"
            placeholder="Stock quantity"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
          />
          <textarea
            rows={4}
            placeholder={"Customizations (one per line)\nExample:\nExtra Cheese:20\nNo Onion:0"}
            value={form.customization_options}
            onChange={(e) => setForm({ ...form, customization_options: e.target.value })}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })}
          />
          <button type="submit">{editId ? "Update Item" : "Add Item"}</button>
        </form>
      </div>

      <div className="page-card">
        <h2>Today's Menu</h2>
        {groupedItems.map((group) => (
          <div key={group.category} className="admin-category-block">
            <h3 className="admin-category-title">{group.category}</h3>
            {group.items.map((item) => (
              <div key={item.id} className="admin-row">
                <span>
                  {item.name} • ₹{item.price} • Stock: {item.stock}
                </span>
                {item.customization_options && (
                  <p className="admin-customize-preview">
                    Customize: {item.customization_options}
                  </p>
                )}
                {item.image_url && (
                  <img
                    className="admin-food-thumb"
                    src={`${imageBaseUrl}${item.image_url}`}
                    alt={item.name}
                  />
                )}
                <div className="admin-row-actions">
                  <button onClick={() => editItem(item)}>Edit</button>
                  <button onClick={() => deleteItem(item.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        ))}
        {groupedItems.length === 0 && (
          <p className="menu-empty">No menu items yet.</p>
        )}
      </div>
    </section>
  );
}

export default MenuManagementPage;
