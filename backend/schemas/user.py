from pydantic import BaseModel, EmailStr


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_approved: bool

    class Config:
        from_attributes = True
