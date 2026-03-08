from jose import JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.utils.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_db():
	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()


def get_current_user(
	token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
	credentials_exception = HTTPException(
		status_code=status.HTTP_401_UNAUTHORIZED,
		detail="Could not validate credentials",
	)

	try:
		payload = decode_access_token(token)
		username = payload.get("sub")
		if username is None:
			raise credentials_exception
	except JWTError:
		raise credentials_exception

	user = db.query(User).filter(User.username == username).first()
	if not user:
		raise credentials_exception
	return user


def get_current_admin(user: User = Depends(get_current_user)) -> User:
	if user.role != "admin":
		raise HTTPException(status_code=403, detail="Admin access required")
	return user
