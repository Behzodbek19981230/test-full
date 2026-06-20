from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_admin
from app.schemas.topic import TopicCreate, TopicUpdate, QuestionCreate, QuestionUpdate, BulkQuestionsCreate
from app.services import topic_service, audit_service
from app.models.admin import Admin

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("")
def get_topics(subject_id: int, db: Session = Depends(get_db)):
    return topic_service.get_topics(db, subject_id, active_only=True)


@router.get("/all")
def get_all_topics(subject_id: int = None, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    if not subject_id:
        raise HTTPException(status_code=400, detail="subject_id kerak")
    return topic_service.get_topics(db, subject_id)


@router.get("/{topic_id}")
def get_topic(topic_id: int, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = topic_service.get_topic_with_questions(db, topic_id)
    if not result:
        raise HTTPException(status_code=404, detail="Mavzu topilmadi")
    return result


@router.post("", status_code=201)
def create_topic(body: TopicCreate, request: Request, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = topic_service.create_topic(db, body.model_dump())
    audit_service.log_action(db, admin.id, "create", "topic", result["id"], f'Mavzu yaratildi: {result["name"]}', request.client.host)
    return result


@router.put("/{topic_id}")
def update_topic(topic_id: int, body: TopicUpdate, request: Request, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = topic_service.update_topic(db, topic_id, body.model_dump(exclude_none=True))
    if not result:
        raise HTTPException(status_code=404, detail="Mavzu topilmadi")
    audit_service.log_action(db, admin.id, "update", "topic", topic_id, f'Mavzu yangilandi: {result["name"]}', request.client.host)
    return result


@router.delete("/{topic_id}")
def delete_topic(topic_id: int, request: Request, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    if not topic_service.delete_topic(db, topic_id):
        raise HTTPException(status_code=404, detail="Mavzu topilmadi")
    audit_service.log_action(db, admin.id, "delete", "topic", topic_id, "Mavzu o'chirildi", request.client.host)
    return {"message": "Mavzu o'chirildi"}


# ===== Questions =====

@router.post("/{topic_id}/questions", status_code=201)
def add_question(topic_id: int, body: QuestionCreate, request: Request, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = topic_service.add_question(db, topic_id, body.model_dump())
    audit_service.log_action(db, admin.id, "create", "question", result["id"], f"Savol qo'shildi (mavzu #{topic_id})", request.client.host)
    return result


@router.post("/{topic_id}/questions/bulk", status_code=201)
def add_questions_bulk(topic_id: int, body: BulkQuestionsCreate, request: Request, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    count = topic_service.add_questions_bulk(db, topic_id, [q.model_dump() for q in body.questions])
    audit_service.log_action(db, admin.id, "create", "question", topic_id, f"{count} ta savol qo'shildi", request.client.host)
    return {"added": count}


@router.put("/questions/{question_id}")
def update_question(question_id: int, body: QuestionUpdate, request: Request, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = topic_service.update_question(db, question_id, body.model_dump(exclude_none=True))
    if not result:
        raise HTTPException(status_code=404, detail="Savol topilmadi")
    audit_service.log_action(db, admin.id, "update", "question", question_id, f"Savol yangilandi #{question_id}", request.client.host)
    return result


@router.delete("/questions/{question_id}")
def delete_question(question_id: int, request: Request, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    if not topic_service.delete_question(db, question_id):
        raise HTTPException(status_code=404, detail="Savol topilmadi")
    audit_service.log_action(db, admin.id, "delete", "question", question_id, f"Savol o'chirildi #{question_id}", request.client.host)
    return {"message": "Savol o'chirildi"}
