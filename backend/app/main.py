from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from sqlalchemy import text
from app.database import Base, engine
from app.database import SessionLocal
from app.routers import auth, menu, orders, payments, tables, users
from app.models import cart, menu as menu_model, order, payment, table, user
from app.models.user import User
from app.config import settings
from app.utils.security import hash_password

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    # Allow localhost and private LAN origins so mobile devices can access the API.
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_origin_regex=r"^https?://(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


def ensure_menu_image_column():
    if not settings.DATABASE_URL.startswith("sqlite"):
        return

    with engine.connect() as connection:
        rows = connection.execute(text("PRAGMA table_info(menu)")).fetchall()
        columns = {row[1] for row in rows}
        if "image_url" not in columns:
            connection.execute(text("ALTER TABLE menu ADD COLUMN image_url VARCHAR"))
            connection.commit()
        if "customization_options" not in columns:
            connection.execute(text("ALTER TABLE menu ADD COLUMN customization_options VARCHAR DEFAULT ''"))
            connection.commit()


def ensure_orders_table_columns():
    if not settings.DATABASE_URL.startswith("sqlite"):
        return

    with engine.connect() as connection:
        rows = connection.execute(text("PRAGMA table_info(orders)")).fetchall()
        columns = {row[1] for row in rows}
        altered = False

        if "total_price" not in columns:
            connection.execute(text("ALTER TABLE orders ADD COLUMN total_price FLOAT DEFAULT 0"))
            altered = True
        if "table_id" not in columns:
            connection.execute(text("ALTER TABLE orders ADD COLUMN table_id INTEGER"))
            altered = True
        if "status" not in columns:
            connection.execute(text("ALTER TABLE orders ADD COLUMN status VARCHAR DEFAULT 'Pending'"))
            altered = True

        if altered:
            connection.commit()


def ensure_customization_columns():
    if not settings.DATABASE_URL.startswith("sqlite"):
        return

    with engine.connect() as connection:
        cart_rows = connection.execute(text("PRAGMA table_info(cart_items)")).fetchall()
        cart_columns = {row[1] for row in cart_rows}
        cart_altered = False

        if "addon_signature" not in cart_columns:
            connection.execute(text("ALTER TABLE cart_items ADD COLUMN addon_signature VARCHAR DEFAULT ''"))
            cart_altered = True
        if "addon_names" not in cart_columns:
            connection.execute(text("ALTER TABLE cart_items ADD COLUMN addon_names VARCHAR DEFAULT ''"))
            cart_altered = True
        if "addon_total" not in cart_columns:
            connection.execute(text("ALTER TABLE cart_items ADD COLUMN addon_total FLOAT DEFAULT 0"))
            cart_altered = True

        order_item_rows = connection.execute(text("PRAGMA table_info(order_items)")).fetchall()
        order_item_columns = {row[1] for row in order_item_rows}
        order_item_altered = False

        if "addon_names" not in order_item_columns:
            connection.execute(text("ALTER TABLE order_items ADD COLUMN addon_names VARCHAR DEFAULT ''"))
            order_item_altered = True
        if "addon_total" not in order_item_columns:
            connection.execute(text("ALTER TABLE order_items ADD COLUMN addon_total FLOAT DEFAULT 0"))
            order_item_altered = True

        if cart_altered or order_item_altered:
            connection.commit()


def ensure_payment_columns():
    if not settings.DATABASE_URL.startswith("sqlite"):
        return

    with engine.connect() as connection:
        rows = connection.execute(text("PRAGMA table_info(payments)")).fetchall()
        columns = {row[1] for row in rows}
        altered = False

        if "screenshot_url" not in columns:
            connection.execute(text("ALTER TABLE payments ADD COLUMN screenshot_url VARCHAR"))
            altered = True
        if "verification_status" not in columns:
            connection.execute(text("ALTER TABLE payments ADD COLUMN verification_status VARCHAR DEFAULT 'Pending'"))
            altered = True

        if altered:
            connection.commit()


def ensure_single_owner_admin():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        owner = db.query(User).filter(User.username == settings.ADMIN_USERNAME).first()

        if not owner:
            owner = User(
                username=settings.ADMIN_USERNAME,
                email=settings.ADMIN_EMAIL,
                password=hash_password(settings.ADMIN_PASSWORD),
                role="admin",
            )
            db.add(owner)
            db.flush()

        # Keep configured owner identity in sync with env settings.
        owner.email = settings.ADMIN_EMAIL
        owner.password = hash_password(settings.ADMIN_PASSWORD)

        owner.role = "admin"

        for usr in users:
            if usr.id != owner.id and usr.role == "admin":
                usr.role = "student"

        db.commit()
    finally:
        db.close()

static_dir = Path("backend/static")
static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
ensure_menu_image_column()
ensure_orders_table_columns()
ensure_customization_columns()
ensure_payment_columns()
ensure_single_owner_admin()
app.include_router(auth.router)
app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(users.router)
app.include_router(tables.router)

@app.get("/")
def root():
    return {"message": "Smart Canteen AI Running 🚀"}