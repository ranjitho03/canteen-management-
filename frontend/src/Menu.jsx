import { useEffect, useState } from "react";
import axios from "./api/axios";

function Menu() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    axios.get("/menu/")
      .then(res => {
        console.log("API DATA:", res.data);
        setItems(res.data);
      })
      .catch(err => console.log(err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Canteen Menu</h2>

      {items.length === 0 ? (
        <p>Loading or No Items...</p>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            style={{
              border: "1px solid #ccc", // Changed to a lighter grey for better UI
              padding: "10px",
              margin: "10px 0",
              borderRadius: "8px"
            }}
          >
            <h3>{item.name}</h3>
            <p>Price: ₹ {item.price}</p>
            <p>Stock: {item.stock}</p>
          </div>
        ))
      )}
    </div>
  );
} 
export default Menu;