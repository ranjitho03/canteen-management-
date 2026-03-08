from pydantic import BaseModel, Field
from typing import Literal


MenuCategory = Literal[
	"tiffen",
	"lunch",
	"snack",
	"chocolates",
	"biscuite",
	"soft drinks",
	"dinner",
	"stationary",
]


class MenuCreate(BaseModel):
	name: str
	category: MenuCategory
	price: float = Field(ge=1, le=100)
	stock: int = Field(ge=0)
	image_url: str | None = None
	customization_options: str | None = None


class MenuUpdate(BaseModel):
	name: str | None = None
	category: MenuCategory | None = None
	price: float | None = Field(default=None, ge=1, le=100)
	stock: int | None = Field(default=None, ge=0)
	image_url: str | None = None
	customization_options: str | None = None


class MenuOut(BaseModel):
	id: int
	name: str
	category: str
	price: float
	stock: int
	image_url: str | None = None
	customization_options: str | None = ""

	class Config:
		from_attributes = True
