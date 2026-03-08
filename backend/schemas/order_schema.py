from pydantic import BaseModel, Field
from typing import Literal


class CartAddRequest(BaseModel):
	menu_id: int
	quantity: int = Field(ge=1, default=1)
	addon_names: list[str] = Field(default_factory=list)
	addon_total: float = Field(ge=0, default=0)
	addon_signature: str = ""


class CartUpdateRequest(BaseModel):
	quantity: int = Field(ge=1)


class CartItemOut(BaseModel):
	id: int
	menu_id: int
	name: str
	price: float
	quantity: int
	addon_names: list[str] | str = Field(default_factory=list)
	addon_total: float = 0
	subtotal: float


class CartResponse(BaseModel):
	items: list[CartItemOut]
	total_price: float


class PlaceOrderRequest(BaseModel):
	table_id: int | None = None


class OrderItemOut(BaseModel):
	id: int
	menu_id: int
	name: str
	price: float
	quantity: int
	addon_names: list[str] | str = Field(default_factory=list)
	addon_total: float = 0

	class Config:
		from_attributes = True


class OrderOut(BaseModel):
	id: int
	user_id: int
	total_price: float
	table_id: int | None
	status: str
	items: list[OrderItemOut]

	class Config:
		from_attributes = True


class OrderStatusUpdate(BaseModel):
	status: Literal["Pending", "Preparing", "Completed"]


class StockUpdateRequest(BaseModel):
	stock: int = Field(ge=0)


class AdminOrderOut(BaseModel):
	id: int
	user_id: int
	items: list[OrderItemOut]
	total_price: float
	status: str
	payment_status: str
	payment_verification_status: str
