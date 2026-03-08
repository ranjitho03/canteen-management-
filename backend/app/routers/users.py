from fastapi import APIRouter, Depends

from app.models.user import User
from app.utils.dependencies import get_current_user
from schemas.user_schema import UserOut

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
	return current_user
