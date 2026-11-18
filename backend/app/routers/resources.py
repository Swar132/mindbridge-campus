import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.user import User
from app.models.resource import WellbeingResource
from app.schemas.resource import ResourceCreate, ResourceResponse
from app.auth import get_current_user, require_admin

router = APIRouter(prefix="/resources", tags=["Wellbeing Resources"])

@router.get("/", response_model=List[ResourceResponse])
def get_resources(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search keyword in title or summary"),
    db: Session = Depends(get_db)
):
    query = db.query(WellbeingResource)

    if category and category.lower() != "all":
        query = query.filter(WellbeingResource.category.ilike(f"%{category}%"))

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                WellbeingResource.title.ilike(search_pattern),
                WellbeingResource.summary.ilike(search_pattern),
                WellbeingResource.content.ilike(search_pattern)
            )
        )

    resources = query.order_by(WellbeingResource.is_featured.desc(), WellbeingResource.created_at.desc()).all()
    for r in resources:
        try:
            r.tags = json.loads(r.tags) if isinstance(r.tags, str) else r.tags
        except Exception:
            r.tags = []
    return resources

@router.get("/{resource_id}", response_model=ResourceResponse)
def get_resource(resource_id: int, db: Session = Depends(get_db)):
    r = db.query(WellbeingResource).filter(WellbeingResource.id == resource_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Resource not found")
    r.tags = json.loads(r.tags) if isinstance(r.tags, str) else r.tags
    return r

@router.post("/", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
def create_resource(
    res_in: ResourceCreate,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    r = WellbeingResource(
        title=res_in.title,
        category=res_in.category,
        content_type=res_in.content_type,
        summary=res_in.summary,
        content=res_in.content,
        read_time_minutes=res_in.read_time_minutes,
        tags=json.dumps(res_in.tags or []),
        is_featured=res_in.is_featured or False
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    r.tags = json.loads(r.tags) if isinstance(r.tags, str) else r.tags
    return r

@router.put("/{resource_id}", response_model=ResourceResponse)
def update_resource(
    resource_id: int,
    res_in: ResourceCreate,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    r = db.query(WellbeingResource).filter(WellbeingResource.id == resource_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Resource not found")

    r.title = res_in.title
    r.category = res_in.category
    r.content_type = res_in.content_type
    r.summary = res_in.summary
    r.content = res_in.content
    r.read_time_minutes = res_in.read_time_minutes
    r.tags = json.dumps(res_in.tags or [])
    r.is_featured = res_in.is_featured or False

    db.commit()
    db.refresh(r)
    r.tags = json.loads(r.tags) if isinstance(r.tags, str) else r.tags
    return r

@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resource(
    resource_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    r = db.query(WellbeingResource).filter(WellbeingResource.id == resource_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Resource not found")
    db.delete(r)
    db.commit()
    return None
