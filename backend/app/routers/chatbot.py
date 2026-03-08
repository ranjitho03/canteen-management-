from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.menu import Menu
from app.models.order import Order
from app.models.user import User
from app.utils.dependencies import get_current_user, get_db
from services.ai_recommender import recommend_menu, suggest_from_query

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])


class ChatRequest(BaseModel):
	message: str


@router.get("/recommendation")
def get_recommendation(
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
):
	orders = db.query(Order).filter(Order.user_id == current_user.id).all()
	user_history = []
	for order in orders:
		for item in order.items:
			user_history.append(item.name)

	recommendation = recommend_menu(user_history)
	return {"recommendation": recommendation}


@router.post("/chat")
def chat_recommendation(
	payload: ChatRequest,
	db: Session = Depends(get_db),
	_: User = Depends(get_current_user),
):
	menu_rows = db.query(Menu).filter(Menu.stock > 0).all()
	menu_items = [
		{"name": row.name, "category": row.category, "price": row.price}
		for row in menu_rows
	]

	answer = suggest_from_query(payload.message, menu_items)
	return {"reply": answer}
