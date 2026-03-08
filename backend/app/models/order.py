from sqlalchemy import Column, Integer, ForeignKey, String, Float
from sqlalchemy.orm import relationship
from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    total_price = Column(Float, default=0)
    table_id = Column(Integer, nullable=True)
    status = Column(String, default="Pending")

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    menu_id = Column(Integer, ForeignKey("menu.id"))
    name = Column(String)
    price = Column(Float)
    quantity = Column(Integer)
    addon_names = Column(String, default="")
    addon_total = Column(Float, default=0)

    order = relationship("Order", back_populates="items")
    menu_item = relationship("Menu", back_populates="order_items")