from sqlalchemy import Column, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    menu_id = Column(Integer, ForeignKey("menu.id"), index=True)
    quantity = Column(Integer, default=1)
    addon_signature = Column(String, default="")
    addon_names = Column(String, default="")
    addon_total = Column(Float, default=0)

    user = relationship("User", back_populates="cart_items")
    menu_item = relationship("Menu", back_populates="cart_items")
