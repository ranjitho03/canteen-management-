from pathlib import Path
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.models.menu import Menu
from app.models.user import User
from app.utils.dependencies import get_current_admin, get_current_user, get_db
from schemas.menu_schema import MenuOut
from schemas.order_schema import StockUpdateRequest

router = APIRouter(prefix="/menu", tags=["Menu"])

ALLOWED_CATEGORIES = {
    "tiffen",
    "lunch",
    "snack",
    "chocolates",
    "biscuite",
    "soft drinks",
    "dinner",
    "stationary",
}

FOOD_IMAGE_DIR = Path("backend/static/food-images")
FOOD_IMAGE_DIR.mkdir(parents=True, exist_ok=True)


def _save_food_image(image: UploadFile | None) -> str | None:
    if not image or not image.filename:
        return None

    extension = Path(image.filename).suffix.lower() or ".jpg"
    file_name = f"{uuid.uuid4().hex}{extension}"
    file_path = FOOD_IMAGE_DIR / file_name

    with file_path.open("wb") as output:
        output.write(image.file.read())

    return f"/static/food-images/{file_name}"


@router.get("/", response_model=list[MenuOut])
def get_menu(db: Session = Depends(get_db)):
    return db.query(Menu).order_by(Menu.id.asc()).all()


@router.post("/", response_model=MenuOut)
def add_item(
    name: str = Form(...),
    category: str = Form(...),
    price: float = Form(...),
    stock: int = Form(...),
    customization_options: str = Form(default=""),
    image: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    if category not in ALLOWED_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    if price < 1 or price > 100:
        raise HTTPException(status_code=400, detail="Price must be between 1 and 100")
    if stock < 0:
        raise HTTPException(status_code=400, detail="Stock cannot be negative")

    image_url = _save_food_image(image)
    item = Menu(
        name=name,
        price=price,
        category=category,
        stock=stock,
        customization_options=customization_options,
        image_url=image_url,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=MenuOut)
def update_item(
    item_id: int,
    name: str | None = Form(default=None),
    category: str | None = Form(default=None),
    price: float | None = Form(default=None),
    stock: int | None = Form(default=None),
    customization_options: str | None = Form(default=None),
    image: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    item = db.query(Menu).filter(Menu.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")

    if category is not None and category not in ALLOWED_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    if price is not None and (price < 1 or price > 100):
        raise HTTPException(status_code=400, detail="Price must be between 1 and 100")
    if stock is not None and stock < 0:
        raise HTTPException(status_code=400, detail="Stock cannot be negative")

    if name is not None:
        item.name = name
    if category is not None:
        item.category = category
    if price is not None:
        item.price = price
    if stock is not None:
        item.stock = stock
    if customization_options is not None:
        item.customization_options = customization_options

    image_url = _save_food_image(image)
    if image_url is not None:
        item.image_url = image_url

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    item = db.query(Menu).filter(Menu.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")

    db.delete(item)
    db.commit()
    return {"message": "Menu item deleted"}


@router.get("/inventory", response_model=list[MenuOut])
def get_inventory(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return db.query(Menu).order_by(Menu.id.asc()).all()


@router.patch("/{item_id}/stock", response_model=MenuOut)
def update_stock(
    item_id: int,
    payload: StockUpdateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    item = db.query(Menu).filter(Menu.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")

    item.stock = payload.stock
    db.commit()
    db.refresh(item)
    return item


@router.get("/recommendations", response_model=list[MenuOut])
def get_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    preferred_category = ""
    if current_user.orders and current_user.orders[-1].items:
        preferred_category = current_user.orders[-1].items[0].menu_item.category

    if preferred_category:
        items = (
            db.query(Menu)
            .filter(Menu.category == preferred_category, Menu.stock > 0)
            .limit(4)
            .all()
        )
    else:
        items = db.query(Menu).filter(Menu.stock > 0).limit(4).all()

    return items
