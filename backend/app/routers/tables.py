from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.table import DiningTable
from app.models.user import User
from app.utils.dependencies import get_current_admin, get_db
from services.qr_generator import generate_qr

router = APIRouter(prefix="/tables", tags=["Tables"])


@router.post("/{table_number}/qr")
def create_or_refresh_table_qr(
    table_number: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    if table_number <= 0:
        raise HTTPException(status_code=400, detail="Invalid table number")

    table = db.query(DiningTable).filter(DiningTable.table_number == table_number).first()
    qr_code_path = generate_qr(table_number)

    if table:
        table.qr_code_path = qr_code_path
    else:
        table = DiningTable(table_number=table_number, qr_code_path=qr_code_path)
        db.add(table)

    db.commit()
    db.refresh(table)

    return {
        "table_number": table.table_number,
        "qr_code_path": table.qr_code_path,
    }


@router.get("/")
def list_tables(db: Session = Depends(get_db)):
    tables = db.query(DiningTable).order_by(DiningTable.table_number.asc()).all()
    return [
        {
            "table_number": t.table_number,
            "qr_code_path": t.qr_code_path,
        }
        for t in tables
    ]
