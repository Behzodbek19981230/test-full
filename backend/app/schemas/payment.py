from pydantic import BaseModel
from typing import Optional


class PaymentAction(BaseModel):
    note: Optional[str] = ""
    amount: Optional[int] = None
