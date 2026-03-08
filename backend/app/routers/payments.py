import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.payment import Payment
from app.models.user import User
from app.utils.dependencies import get_current_admin, get_current_user, get_db

router = APIRouter(prefix="/payments", tags=["Payments"])


class PaymentVerifyRequest(BaseModel):
	verification_status: str


def save_payment_proof_image(image_file: UploadFile) -> str:
	if not image_file.content_type or not image_file.content_type.startswith("image/"):
		raise HTTPException(status_code=400, detail="Only image files are allowed")

	ext = Path(image_file.filename or "proof.png").suffix.lower()
	if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
		raise HTTPException(status_code=400, detail="Use JPG, PNG, or WEBP image")

	proof_dir = Path("backend/static/payment-proofs")
	proof_dir.mkdir(parents=True, exist_ok=True)
	filename = f"proof-{uuid.uuid4().hex}{ext}"
	file_path = proof_dir / filename

	with file_path.open("wb") as buffer:
		buffer.write(image_file.file.read())

	return f"/static/payment-proofs/{filename}"


@router.post("/pay/{order_id}")
def pay_order(
	order_id: int,
	proof_image: UploadFile | None = File(default=None),
	payment_method: str = Form(default="UPI"),
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
):
	order = (
		db.query(Order)
		.filter(Order.id == order_id, Order.user_id == current_user.id)
		.first()
	)
	if not order:
		raise HTTPException(status_code=404, detail="Order not found")

	existing_payment = db.query(Payment).filter(Payment.order_id == order.id).first()
	if existing_payment:
		existing_payment.method = payment_method.strip().title() if payment_method else existing_payment.method
		if proof_image:
			existing_payment.screenshot_url = save_payment_proof_image(proof_image)
			existing_payment.verification_status = "Pending"
			db.commit()
			db.refresh(existing_payment)
		return existing_payment

	proof_url = save_payment_proof_image(proof_image) if proof_image else None

	payment = Payment(
		order_id=order.id,
		user_id=current_user.id,
		amount=order.total_price,
		method=payment_method.strip().title() if payment_method else "UPI",
		status="Success",
		transaction_id=f"TXN-{uuid.uuid4().hex[:12].upper()}",
		screenshot_url=proof_url,
		verification_status="Pending",
	)
	db.add(payment)
	db.commit()
	db.refresh(payment)
	return payment


@router.get("/history")
def my_payment_history(
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
):
	payments = (
		db.query(Payment)
		.filter(Payment.user_id == current_user.id)
		.order_by(Payment.id.desc())
		.all()
	)
	return payments


@router.get("/all")
def all_payments(
	db: Session = Depends(get_db),
	_: User = Depends(get_current_admin),
):
	return db.query(Payment).order_by(Payment.id.desc()).all()


@router.patch("/verify/{payment_id}")
def verify_payment_proof(
	payment_id: int,
	payload: PaymentVerifyRequest,
	db: Session = Depends(get_db),
	_: User = Depends(get_current_admin),
):
	allowed_status = {"Pending", "Verified", "Rejected"}
	status = payload.verification_status.strip().capitalize()
	if status not in allowed_status:
		raise HTTPException(status_code=400, detail="verification_status must be Pending, Verified, or Rejected")

	payment = db.query(Payment).filter(Payment.id == payment_id).first()
	if not payment:
		raise HTTPException(status_code=404, detail="Payment not found")

	payment.verification_status = status
	db.commit()
	db.refresh(payment)
	return payment
