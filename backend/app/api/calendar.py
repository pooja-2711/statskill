import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.calendar_event import CalendarEvent
from app.models.user import User
from app.schemas.calendar_event import (
    CalendarEventCreate,
    CalendarEventOut,
    CalendarEventUpdate,
)

router = APIRouter(prefix="/calendar", tags=["calendar"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _get_owned(db: Session, event_id: uuid.UUID, user: User) -> CalendarEvent:
    ev = db.scalar(
        select(CalendarEvent).where(
            CalendarEvent.id == event_id, CalendarEvent.user_id == user.id
        )
    )
    if ev is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return ev


# ---------- CRUD ----------

@router.get("/events", response_model=list[CalendarEventOut])
def list_events(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = select(CalendarEvent).where(CalendarEvent.user_id == user.id)
    if start is not None:
        q = q.where(func.coalesce(CalendarEvent.end_at, CalendarEvent.start_at) >= _aware(start))
    if end is not None:
        q = q.where(CalendarEvent.start_at < _aware(end))
    return db.scalars(q.order_by(CalendarEvent.start_at).limit(1000)).all()


@router.post("/events", response_model=CalendarEventOut, status_code=status.HTTP_201_CREATED)
def create_event(payload: CalendarEventCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ev = CalendarEvent(user_id=user.id, **payload.model_dump())
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


@router.patch("/events/{event_id}", response_model=CalendarEventOut)
def update_event(event_id: uuid.UUID, payload: CalendarEventUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ev = _get_owned(db, event_id, user)
    data = payload.model_dump(exclude_unset=True)
    for required in ("title", "type", "start_at", "all_day"):
        if required in data and data[required] is None:
            raise HTTPException(status_code=422, detail=f"{required} cannot be null")
    if "title" in data:
        data["title"] = data["title"].strip()
        if not data["title"]:
            raise HTTPException(status_code=422, detail="Title cannot be blank")
    for field, value in data.items():
        setattr(ev, field, value)
    if ev.end_at is not None and ev.end_at < ev.start_at:
        db.rollback()
        raise HTTPException(status_code=422, detail="end_at must not be before start_at")
    db.commit()
    db.refresh(ev)
    return ev


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: uuid.UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ev = _get_owned(db, event_id, user)
    db.delete(ev)
    db.commit()


# ---------- Dashboard ----------

@router.get("/upcoming", response_model=list[CalendarEventOut])
def upcoming(
    days: int = Query(default=14, ge=1, le=90),
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    now = _now()
    return db.scalars(
        select(CalendarEvent)
        .where(
            CalendarEvent.user_id == user.id,
            func.coalesce(CalendarEvent.end_at, CalendarEvent.start_at) >= now,
            CalendarEvent.start_at <= now + timedelta(days=days),
        )
        .order_by(CalendarEvent.start_at)
        .limit(limit)
    ).all()


# ---------- Reminders ----------

@router.get("/reminders/due", response_model=list[CalendarEventOut])
def reminders_due(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Events whose reminder time has passed but which haven't started yet.
    The client must remember which ones it already showed."""
    now = _now()
    candidates = db.scalars(
        select(CalendarEvent).where(
            CalendarEvent.user_id == user.id,
            CalendarEvent.remind_minutes_before.is_not(None),
            CalendarEvent.start_at > now,
            CalendarEvent.start_at <= now + timedelta(minutes=10080),
        )
    ).all()
    return [
        ev for ev in candidates
        if ev.start_at - timedelta(minutes=ev.remind_minutes_before) <= now
    ]


# ---------- ICS export ----------

def _ics_escape(text: str) -> str:
    return (
        text.replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\r\n", "\\n")
        .replace("\n", "\\n")
    )


def _fold(line: str) -> str:
    """Fold to 75 octets per RFC 5545 without splitting a UTF-8 character."""
    raw = line.encode("utf-8")
    if len(raw) <= 75:
        return line
    parts, cur, size = [], "", 0
    limit = 75
    for ch in line:
        n = len(ch.encode("utf-8"))
        if size + n > limit:
            parts.append(cur)
            cur, size, limit = "", 1, 74  # continuation lines start with a space
        cur += ch
        size += n
    parts.append(cur)
    return "\r\n ".join(parts)


def _utc(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def build_ics(events: list[CalendarEvent]) -> str:
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Statskill//Calendar//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
    ]
    stamp = _utc(_now())
    for ev in events:
        lines += ["BEGIN:VEVENT", f"UID:{ev.id}@statskill", f"DTSTAMP:{stamp}"]
        if ev.all_day:
            d = ev.start_at.astimezone(timezone.utc).date()
            end_d = (ev.end_at or ev.start_at).astimezone(timezone.utc).date() + timedelta(days=1)
            lines += [f"DTSTART;VALUE=DATE:{d:%Y%m%d}", f"DTEND;VALUE=DATE:{end_d:%Y%m%d}"]
        else:
            lines.append(f"DTSTART:{_utc(ev.start_at)}")
            lines.append(f"DTEND:{_utc(ev.end_at or ev.start_at + timedelta(hours=1))}")
        lines.append(f"SUMMARY:{_ics_escape(ev.title)}")
        lines.append(f"CATEGORIES:{ev.type.upper()}")
        if ev.notes:
            lines.append(f"DESCRIPTION:{_ics_escape(ev.notes)}")
        if ev.remind_minutes_before is not None:
            lines += [
                "BEGIN:VALARM",
                "ACTION:DISPLAY",
                f"DESCRIPTION:{_ics_escape(ev.title)}",
                f"TRIGGER:-PT{ev.remind_minutes_before}M",
                "END:VALARM",
            ]
        lines.append("END:VEVENT")
    lines.append("END:VCALENDAR")
    return "\r\n".join(_fold(l) for l in lines) + "\r\n"


@router.get("/export.ics")
def export_ics(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    events = db.scalars(
        select(CalendarEvent)
        .where(CalendarEvent.user_id == user.id)
        .order_by(CalendarEvent.start_at)
    ).all()
    return Response(
        content=build_ics(list(events)),
        media_type="text/calendar; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="statskill.ics"'},
    )