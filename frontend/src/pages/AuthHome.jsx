import { Link } from "react-router-dom";

function AuthHome() {
  const foodOptions = [
    "Biryani",
    "South Indian",
    "North Indian",
    "Desserts",
    "Pizza",
    "Ice Cream",
    "Dosa",
    "Noodles",
  ];

  const groceryOptions = [
    "Fresh Vegetables",
    "Fresh Fruits",
    "Dairy & Eggs",
    "Rice & Dals",
  ];

  return (
    <section className="auth-page swiggy-home">
      <div className="swiggy-hero">
        <div className="swiggy-hero-row">
          <p className="swiggy-location">Home</p>
          <div className="swiggy-avatar">DK</div>
        </div>

        <div className="swiggy-search">Search for restaurant, item or more</div>

        <div className="swiggy-hero-copy">
          <h2>Order food and groceries from your campus favorites</h2>
          <p>Fast delivery. Great taste. Student-friendly prices.</p>
        </div>

        <div className="swiggy-promo-grid">
          <article className="promo-card promo-card-wide">
            <p className="promo-title">FOOD DELIVERY</p>
            <p className="promo-sub">From canteen kitchens</p>
            <span className="promo-chip">UP TO 60% OFF</span>
          </article>
          <article className="promo-card">
            <p className="promo-title">INSTA MART</p>
            <p className="promo-sub">Daily essentials</p>
            <span className="promo-chip">FREE DELIVERY</span>
          </article>
          <article className="promo-card">
            <p className="promo-title">DINEOUT</p>
            <p className="promo-sub">Campus specials</p>
            <span className="promo-chip">UP TO 50% OFF</span>
          </article>
        </div>
      </div>

      <section className="swiggy-section">
        <h3>Order our best food options</h3>
        <div className="food-option-grid">
          {foodOptions.map((item) => (
            <div key={item} className="food-option-tile">
              <div className="food-option-image" />
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="swiggy-section">
        <h3>Shop groceries on Instamart</h3>
        <div className="grocery-grid">
          {groceryOptions.map((item) => (
            <div key={item} className="grocery-tile">
              <div className="grocery-image" />
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="swiggy-section auth-links-panel">
        <h3>Get Started</h3>
        <div className="auth-action-grid">
          <Link className="auth-link-btn swiggy-action-btn" to="/login">Student Login</Link>
          <Link className="auth-link-btn swiggy-action-btn" to="/admin-login">Admin Login</Link>
          <Link className="auth-link-btn swiggy-action-btn" to="/register">Register</Link>
          <Link className="auth-link-btn swiggy-action-btn solid" to="/menu">Explore Menu</Link>
        </div>
      </section>

      <nav className="mobile-bottom-nav" aria-label="Bottom navigation">
        <Link to="/">Home</Link>
        <Link to="/menu">Menu</Link>
        <Link to="/login">Login</Link>
      </nav>
    </section>
  );
}

export default AuthHome;
