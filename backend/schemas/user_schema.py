from pydantic import BaseModel


class UserRegister(BaseModel):
	username: str
	email: str
	password: str


class UserLogin(BaseModel):
	username: str
	password: str


class GmailLoginRequest(BaseModel):
	email: str
	name: str | None = None


class GoogleTokenLoginRequest(BaseModel):
	id_token: str


class UserOut(BaseModel):
	id: int
	username: str
	email: str
	role: str

	class Config:
		from_attributes = True


class TokenResponse(BaseModel):
	access_token: str
	token_type: str = "bearer"
