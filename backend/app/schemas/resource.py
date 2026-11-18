from pydantic import BaseModel
from typing import Optional, List, Union
from datetime import datetime

class ResourceCreate(BaseModel):
    title: str
    category: str
    content_type: str = "article"
    summary: str
    content: str
    read_time_minutes: int = 5
    tags: Optional[List[str]] = []
    is_featured: Optional[bool] = False

class ResourceResponse(BaseModel):
    id: int
    title: str
    category: str
    content_type: str
    summary: str
    content: str
    read_time_minutes: int
    tags: Union[List[str], str]
    is_featured: bool
    created_at: datetime

    class Config:
        from_attributes = True
