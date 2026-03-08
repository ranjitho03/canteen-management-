from sqlalchemy import Column, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Payment(Base):
	__tablename__ = "payments"

	id = Column(Integer, primary_key=True, index=True)
	order_id = Column(Integer, ForeignKey("orders.id"), index=True)
	user_id = Column(Integer, ForeignKey("users.id"), index=True)
	amount = Column(Float)
	method = Column(String, default="Online")
	status = Column(String, default="Success")
	transaction_id = Column(String, unique=True, index=True)
	screenshot_url = Column(String, nullable=True)
	verification_status = Column(String, default="Pending")

	order = relationship("Order")
	user = relationship("User")
