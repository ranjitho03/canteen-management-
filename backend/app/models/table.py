from sqlalchemy import Column, Integer, String

from app.database import Base


class DiningTable(Base):
	__tablename__ = "tables"

	id = Column(Integer, primary_key=True, index=True)
	table_number = Column(Integer, unique=True, index=True)
	qr_code_path = Column(String, nullable=True)
