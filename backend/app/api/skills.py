from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.core.dependencies import get_current_user

from app.models.user import User
from app.models.skill import Skill
from app.models.user_skill import UserSkill

from app.schemas.skills import (
    SkillCreate,
    SkillResponse,
    UserSkillCreate,
    UserSkillResponse,
    UserSkillUpdate,
)


router = APIRouter(prefix="/skills", tags=["Skills Management"])


# CREATE A SKILL
@router.post(
    "/",
    response_model=SkillResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_skill(
    skill_data: SkillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing_skill = db.query(Skill).filter(
        Skill.name.ilike(skill_data.name.strip())
    ).first()

    if existing_skill:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Skill already exists",
        )

    skill = Skill(
        name=skill_data.name.strip(),
        description=skill_data.description,
        category=skill_data.category,
    )

    db.add(skill)
    db.commit()
    db.refresh(skill)

    return skill


# GET ALL SKILLS
@router.get(
    "/",
    response_model=list[SkillResponse],
)
def get_all_skills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Skill).order_by(Skill.name).all()


# GET CURRENT USER'S SKILLS
# Keep /me BEFORE /{skill_id} to avoid route conflicts.
@router.get(
    "/me",
    response_model=list[UserSkillResponse],
)
def get_my_skills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(UserSkill).filter(
        UserSkill.user_id == current_user.id
    ).all()


# ADD SKILL TO CURRENT USER
@router.post(
    "/me",
    response_model=UserSkillResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_user_skill(
    skill_data: UserSkillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    skill = db.query(Skill).filter(
        Skill.id == skill_data.skill_id
    ).first()

    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found",
        )

    existing_user_skill = db.query(UserSkill).filter(
        UserSkill.user_id == current_user.id,
        UserSkill.skill_id == skill_data.skill_id,
    ).first()

    if existing_user_skill:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This skill is already in your profile",
        )

    user_skill = UserSkill(
        user_id=current_user.id,
        skill_id=skill_data.skill_id,
        proficiency_level=skill_data.proficiency_level,
    )

    db.add(user_skill)
    db.commit()
    db.refresh(user_skill)

    return user_skill


# UPDATE USER SKILL PROFICIENCY
@router.put(
    "/me/{user_skill_id}",
    response_model=UserSkillResponse,
)
def update_user_skill(
    user_skill_id: int,
    skill_data: UserSkillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_skill = db.query(UserSkill).filter(
        UserSkill.id == user_skill_id,
        UserSkill.user_id == current_user.id,
    ).first()

    if not user_skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User skill not found",
        )

    user_skill.proficiency_level = skill_data.proficiency_level

    db.commit()
    db.refresh(user_skill)

    return user_skill


# DELETE USER SKILL
@router.delete(
    "/me/{user_skill_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_user_skill(
    user_skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_skill = db.query(UserSkill).filter(
        UserSkill.id == user_skill_id,
        UserSkill.user_id == current_user.id,
    ).first()

    if not user_skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User skill not found",
        )

    db.delete(user_skill)
    db.commit()

    return None


# GET A SPECIFIC SKILL
@router.get(
    "/{skill_id}",
    response_model=SkillResponse,
)
def get_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    skill = db.query(Skill).filter(
        Skill.id == skill_id
    ).first()

    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found",
        )

    return skill