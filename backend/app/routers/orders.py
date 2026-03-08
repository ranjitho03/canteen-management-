from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.cart import CartItem
from app.models.menu import Menu
from app.models.order import Order, OrderItem
from app.models.payment import Payment
from app.models.user import User
from app.utils.dependencies import get_current_admin, get_current_user, get_db
from schemas.order_schema import (
    AdminOrderOut,
    CartAddRequest,
    CartItemOut,
    CartResponse,
    CartUpdateRequest,
    OrderStatusUpdate,
    OrderOut,
    PlaceOrderRequest,
)

router = APIRouter(prefix="/orders", tags=["Orders"])


def _parse_addon_names(raw: str | None) -> list[str]:
    if not raw:
        return []
    return [name for name in raw.split("|") if name]


def _stringify_addon_names(addon_names: list[str]) -> str:
    return "|".join(name.strip() for name in addon_names if name.strip())


def _cart_summary(cart_items: list[CartItem]) -> CartResponse:
    items: list[CartItemOut] = []
    total_price = 0.0
    for row in cart_items:
        unit_price = row.menu_item.price + (row.addon_total or 0)
        subtotal = unit_price * row.quantity
        total_price += subtotal
        items.append(
            CartItemOut(
                id=row.id,
                menu_id=row.menu_id,
                name=row.menu_item.name,
                price=row.menu_item.price,
                quantity=row.quantity,
                addon_names=_parse_addon_names(row.addon_names),
                addon_total=row.addon_total or 0,
                subtotal=subtotal,
            )
        )
    return CartResponse(items=items, total_price=total_price)


@router.get("/cart", response_model=CartResponse)
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart_items = db.query(CartItem).filter(CartItem.user_id == current_user.id).all()
    return _cart_summary(cart_items)


@router.post("/cart", response_model=CartResponse)
def add_to_cart(
    payload: CartAddRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    menu_item = db.query(Menu).filter(Menu.id == payload.menu_id).first()
    if not menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    if menu_item.stock < payload.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock")

    cart_row = (
        db.query(CartItem)
        .filter(
            CartItem.user_id == current_user.id,
            CartItem.menu_id == payload.menu_id,
            CartItem.addon_signature == payload.addon_signature,
        )
        .first()
    )

    if cart_row:
        next_quantity = cart_row.quantity + payload.quantity
        if menu_item.stock < next_quantity:
            raise HTTPException(status_code=400, detail="Stock limit exceeded")
        cart_row.quantity = next_quantity
    else:
        db.add(
            CartItem(
                user_id=current_user.id,
                menu_id=payload.menu_id,
                quantity=payload.quantity,
                addon_signature=payload.addon_signature,
                addon_names=_stringify_addon_names(payload.addon_names),
                addon_total=payload.addon_total,
            )
        )

    db.commit()
    cart_items = db.query(CartItem).filter(CartItem.user_id == current_user.id).all()
    return _cart_summary(cart_items)


@router.put("/cart/{cart_item_id}", response_model=CartResponse)
def update_cart_item(
    cart_item_id: int,
    payload: CartUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart_item = (
        db.query(CartItem)
        .filter(CartItem.id == cart_item_id, CartItem.user_id == current_user.id)
        .first()
    )
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    if payload.quantity > cart_item.menu_item.stock:
        raise HTTPException(status_code=400, detail="Stock limit exceeded")

    cart_item.quantity = payload.quantity
    db.commit()
    cart_items = db.query(CartItem).filter(CartItem.user_id == current_user.id).all()
    return _cart_summary(cart_items)


@router.delete("/cart/{cart_item_id}", response_model=CartResponse)
def remove_cart_item(
    cart_item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart_item = (
        db.query(CartItem)
        .filter(CartItem.id == cart_item_id, CartItem.user_id == current_user.id)
        .first()
    )
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.delete(cart_item)
    db.commit()
    cart_items = db.query(CartItem).filter(CartItem.user_id == current_user.id).all()
    return _cart_summary(cart_items)


@router.post("/place", response_model=OrderOut)
def place_order(
    payload: PlaceOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart_items = db.query(CartItem).filter(CartItem.user_id == current_user.id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    total_price = 0.0
    order = Order(
        user_id=current_user.id,
        table_id=payload.table_id,
        status="Pending",
    )
    db.add(order)
    db.flush()

    for cart_item in cart_items:
        menu_item = cart_item.menu_item
        if menu_item.stock < cart_item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {menu_item.name}",
            )

        menu_item.stock -= cart_item.quantity
        unit_price = menu_item.price + (cart_item.addon_total or 0)
        total_price += unit_price * cart_item.quantity

        db.add(
            OrderItem(
                order_id=order.id,
                menu_id=menu_item.id,
                name=menu_item.name,
                price=unit_price,
                quantity=cart_item.quantity,
                addon_names=cart_item.addon_names,
                addon_total=cart_item.addon_total or 0,
            )
        )
        db.delete(cart_item)

    order.total_price = total_price
    db.commit()
    db.refresh(order)
    return order


@router.get("/history", response_model=list[OrderOut])
def get_order_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Order)
        .filter(Order.user_id == current_user.id)
        .order_by(Order.id.desc())
        .all()
    )


@router.get("/all", response_model=list[AdminOrderOut])
def get_all_orders(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    orders = db.query(Order).order_by(Order.id.desc()).all()
    response: list[AdminOrderOut] = []

    for ord_row in orders:
        payment = db.query(Payment).filter(Payment.order_id == ord_row.id).first()
        response.append(
            AdminOrderOut(
                id=ord_row.id,
                user_id=ord_row.user_id,
                items=ord_row.items,
                total_price=ord_row.total_price,
                status=ord_row.status,
                payment_status=payment.status if payment else "Unpaid",
            )
        )

    return response


@router.patch("/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = payload.status
    db.commit()
    db.refresh(order)
    return order