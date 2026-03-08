import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "../api/axios";

function Menu({ user }) {

  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({ items: [], total_price: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedRows, setExpandedRows] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customizeItem, setCustomizeItem] = useState(null);
  const [customQty, setCustomQty] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [customMessage, setCustomMessage] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [searchParams] = useSearchParams();
  const menuRef = useRef(null);
  const sectionRefs = useRef({});
  const navigate = useNavigate();

  const tableIdFromQR = searchParams.get("table");
  const imageBaseUrl = import.meta.env.DEV
    ? ""
    : (import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`);
  const categoryOptions = ["all", ...new Set(menu.map((item) => item.category))];
  const filteredMenu = menu.filter((item) => {
    const nameMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = activeCategory === "all" || item.category === activeCategory;
    return nameMatch && categoryMatch;
  });

  const rowSections = [
    {
      key: "food",
      title: "Food Items",
      items: filteredMenu.filter((item) => ["tiffen", "lunch", "dinner", "soft drinks"].includes((item.category || "").toLowerCase())),
    },
    {
      key: "snacks",
      title: "Snacks",
      items: filteredMenu.filter((item) => ["snack", "biscuite"].includes((item.category || "").toLowerCase())),
    },
    {
      key: "chocolate",
      title: "Chocolate",
      items: filteredMenu.filter((item) => (item.category || "").toLowerCase() === "chocolates" || /choco|chocolate|cocoa|bar/i.test(item.name || "")),
    },
    {
      key: "stationary",
      title: "Stationary Items",
      items: filteredMenu.filter((item) => (item.category || "").toLowerCase() === "stationary" || /pen|pencil|notebook|eraser|scale|marker|station/i.test(item.name || "")),
    },
  ];

  const getItemEta = (category) => {
    const key = (category || "").toLowerCase();
    if (key === "soft drinks") return "5-8 mins";
    if (key === "snack") return "10-15 mins";
    if (key === "biscuite") return "8-12 mins";
    if (key === "chocolates") return "5-10 mins";
    if (key === "tiffen") return "12-18 mins";
    if (key === "lunch") return "20-30 mins";
    if (key === "dinner") return "20-30 mins";
    if (key === "stationary") return "2-5 mins";
    return "15-25 mins";
  };

  const parseCustomizationOptions = (rawText) => {
    if (!rawText || typeof rawText !== "string") return [];

    return rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const [namePart, pricePart] = line.split(":");
        const addonName = (namePart || "").trim();
        const parsedPrice = Number((pricePart || "0").trim());
        return {
          id: `${addonName.toLowerCase().replace(/\s+/g, "-") || "addon"}-${index}`,
          name: addonName || `Addon ${index + 1}`,
          price: Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0,
        };
      });
  };

  const getAddonsForItem = (item) => {
    const fromAdmin = parseCustomizationOptions(item?.customization_options);
    if (fromAdmin.length) return fromAdmin;

    const category = item?.category || "";
    const key = (category || "").toLowerCase();
    if (key === "soft drinks") {
      return [
        { id: "ice", name: "Extra Ice", price: 10 },
        { id: "mint", name: "Mint Flavor", price: 15 },
      ];
    }
    if (key === "snack") {
      return [
        { id: "dip", name: "Cheese Dip", price: 25 },
        { id: "sauce", name: "Spicy Sauce", price: 20 },
      ];
    }
    if (key === "lunch") {
      return [
        { id: "extra-rice", name: "Extra Rice", price: 40 },
        { id: "boiled-egg", name: "Boiled Egg", price: 25 },
        { id: "raita", name: "Raita", price: 20 },
      ];
    }
    return [
      { id: "chutney", name: "Extra Chutney", price: 15 },
      { id: "sambar", name: "Extra Sambar", price: 20 },
      { id: "ghee", name: "Ghee Roast", price: 30 },
    ];
  };

  const toAddonList = (raw) => {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") return raw.split("|").filter(Boolean);
    return [];
  };

  const totalQty = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const overallEta = totalQty > 3 ? "25-35 mins" : "15-25 mins";

  const loadData = async () => {
    setError("");
    try {
      const menuRes = await axios.get("/menu/");
      setMenu(menuRes.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load menu");
      return;
    }

    const [cartRes] = await Promise.allSettled([axios.get("/orders/cart")]);

    if (cartRes.status === "fulfilled") {
      setCart(cartRes.value.data);
    } else {
      setCart({ items: [], total_price: 0 });
    }

  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const openCustomize = (item) => {
    setCustomizeItem(item);
    setCustomQty(1);
    setSelectedAddons([]);
    setCustomMessage("");
  };

  const closeCustomize = () => {
    setCustomizeItem(null);
    setSelectedAddons([]);
    setCustomQty(1);
  };

  const toggleAddon = (addon) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((entry) => entry.id === addon.id);
      if (exists) {
        return prev.filter((entry) => entry.id !== addon.id);
      }
      return [...prev, addon];
    });
  };

  const confirmCustomizedAdd = async () => {
    if (!customizeItem) return;

    setLoading(true);
    try {
      const addonSignature = selectedAddons
        .map((addon) => addon.id)
        .sort()
        .join("|");
      const res = await axios.post("/orders/cart", {
        menu_id: customizeItem.id,
        quantity: customQty,
        addon_names: selectedAddons.map((addon) => addon.name),
        addon_total: selectedAddons.reduce((sum, addon) => sum + addon.price, 0),
        addon_signature: addonSignature,
      });
      setCart(res.data);
      setCustomMessage("Item added to cart with selected customization.");
      setTimeout(() => {
        closeCustomize();
      }, 300);
    } catch (err) {
      setCustomMessage(err?.response?.data?.detail || "Unable to add customized item");
    } finally {
      setLoading(false);
    }
  };

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
    <section className="menu-layout swiggy-menu-layout">
      <div className="menu-column swiggy-menu-column">
        <div className="swiggy-menu-hero">
          <p className="swiggy-menu-label">DMI Canteen</p>
          <h1 className="swiggy-menu-title">Discover Good Food</h1>
          <p className="swiggy-menu-subtitle">Freshly prepared campus meals and snacks.</p>
          <p className="swiggy-menu-eta">Estimated completion: {overallEta}</p>

          <input
            className="swiggy-menu-search"
            placeholder="Search for food, snacks or drinks"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="swiggy-category-row">
            {categoryOptions.map((category) => (
              <button
                key={category}
                className={category === activeCategory ? "category-chip active" : "category-chip"}
                onClick={() => setActiveCategory(category)}
                type="button"
              >
                {category === "all" ? "All" : category}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="menu-card-btn"
            onClick={() => menuRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            See Our Menu
          </button>

          <button
            type="button"
            className="menu-card-btn secondary"
            onClick={() => navigate("/orders-history")}
          >
            View Order History
          </button>

          <div className="row-quick-nav">
            {rowSections.map((section) => (
              <button
                key={section.key}
                type="button"
                className="row-nav-chip"
                onClick={() => sectionRefs.current[section.key]?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>

        {tableIdFromQR && <p className="table-badge">Ordering for Table #{tableIdFromQR}</p>}
        {error && <p className="error-text">{error}</p>}

        <div ref={menuRef} className="sectioned-menu-wrap">
          {!filteredMenu.length && (
            <div className="menu-empty-box">
              <p className="menu-empty">No items found for this filter.</p>
              <button
                type="button"
                className="clear-filter-btn"
                onClick={() => {
                  setSearchTerm("");
                  setActiveCategory("all");
                }}
              >
                Clear Filters
              </button>
            </div>
          )}

          {rowSections.map((section) => (
            <section
              key={section.key}
              className="menu-row-section"
              ref={(el) => {
                sectionRefs.current[section.key] = el;
              }}
            >
              <div className="menu-row-header">
                <h3>
                  {section.title} <span className="row-count">({section.items.length})</span>
                </h3>
                <div className="row-controls">
                  {section.items.length > 0 && (
                    <button
                      type="button"
                      className="view-more-btn"
                      onClick={() =>
                        setExpandedRows((prev) => ({
                          ...prev,
                          [section.key]: !prev[section.key],
                        }))
                      }
                    >
                      {expandedRows[section.key] ? "View Less ^" : "View More v"}
                    </button>
                  )}
                </div>
              </div>

              {!section.items.length ? (
                <p className="menu-empty-row">No items in this row.</p>
              ) : (
                <div
                  className={expandedRows[section.key] ? "menu-row-strip expanded" : "menu-row-strip"}
                >
                  {section.items.map((item) => (
                    <article key={item.id} className="food-card row-food-card">
                      <img
                        className="food-card-image"
                        src={item.image_url ? `${imageBaseUrl}${item.image_url}` : "https://placehold.co/320x200?text=Food"}
                        onError={(e) => {
                          e.currentTarget.src = "https://placehold.co/320x200?text=Food";
                        }}
                        alt={item.name}
                      />
                      <span className={item.stock > 0 ? "stock-pill" : "stock-pill out"}>
                        {item.stock > 0 ? `${item.stock} left` : "Out of stock"}
                      </span>
                      <h3>{item.name}</h3>
                      <p className="item-eta">Ready in {getItemEta(item.category)}</p>
                      <p>₹{item.price}</p>
                      <button
                        disabled={item.stock === 0 || loading}
                        onClick={() => openCustomize(item)}
                      >
                        Add / Customize
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>

      <aside className="cart-panel swiggy-cart-panel">
        <h2>Cart</h2>
        {!cart.items.length && <p>No items in cart.</p>}

        {cart.items.map((item) => (
          <div key={item.id} className="cart-item">
            <div>
              <strong>{item.name}</strong>
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
            <p>₹{item.subtotal}</p>
          </div>
        ))}

        <hr />
        <h3 className="cart-total">Total: ₹{cart.total_price?.toFixed(2) || "0.00"}</h3>
        <p>Step 1: Place order to open confirmation and online transaction page.</p>
        <button disabled={!cart.items.length || loading} onClick={placeOrder}>
          {loading ? "Processing..." : "Place Order & Continue"}
        </button>
        {checkoutMessage && <p className="error-text">{checkoutMessage}</p>}

        {user?.role === "admin" && <p className="admin-note">Admin access enabled.</p>}
      </aside>

      {cart.items.length > 0 && (
        <div className="view-cart-bar" role="status" aria-live="polite">
          <p>{totalQty} item(s) | ₹{cart.total_price?.toFixed(2) || "0.00"}</p>
          <button
            type="button"
            onClick={() => navigate(tableIdFromQR ? `/cart?table=${tableIdFromQR}` : "/cart")}
          >
            View Cart
          </button>
        </div>
      )}

      {customizeItem && (
        <div className="customize-overlay" onClick={closeCustomize}>
          <div className="customize-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="customize-head">
              <p className="customize-item-name">{customizeItem.name}</p>
              <button type="button" className="customize-close" onClick={closeCustomize}>x</button>
            </div>

            <p className="customize-base-price">Base Price: ₹{customizeItem.price}</p>
            <h3>Customize as per your taste</h3>
            <p className="customize-sub">Choose add-ons (optional)</p>

            <div className="addon-list">
              {getAddonsForItem(customizeItem).map((addon) => {
                const checked = selectedAddons.some((entry) => entry.id === addon.id);
                return (
                  <label key={addon.id} className="addon-row">
                    <span>{addon.name}</span>
                    <span>+ ₹{addon.price}</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAddon(addon)}
                    />
                  </label>
                );
              })}
            </div>

            <div className="customize-qty-row">
              <p>Quantity</p>
              <div className="qty-controls">
                <button type="button" onClick={() => setCustomQty((q) => Math.max(1, q - 1))}>-</button>
                <span>{customQty}</span>
                <button type="button" onClick={() => setCustomQty((q) => q + 1)}>+</button>
              </div>
            </div>

            <div className="customize-footer">
              <p>
                Total: ₹{((customizeItem.price + selectedAddons.reduce((sum, addon) => sum + addon.price, 0)) * customQty).toFixed(2)}
              </p>
              <button type="button" onClick={confirmCustomizedAdd} disabled={loading}>
                {loading ? "Adding..." : "Add Item to Cart"}
              </button>
            </div>
            {customMessage && <p className="customize-message">{customMessage}</p>}
          </div>
        </div>
      )}
    </section>
  );
}

export default Menu;