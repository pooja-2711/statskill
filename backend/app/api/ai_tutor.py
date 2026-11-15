
import httpx

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.user import User
from app.models.ai_conversation import AIConversation
from app.models.ai_message import AIMessage


router = APIRouter(
    prefix="/ai-tutor",
    tags=["AI Tutor"],
)

OLLAMA_URL = "http://127.0.0.1:11434/api/chat"
OLLAMA_MODEL = "qwen2.5:3b"

SYSTEM_PROMPT = """
You are Statskill AI Tutor, a friendly, patient, and expert programming
and computer science teacher.

YOUR TEACHING STYLE:
- Explain concepts in simple language suitable for college students.
- Teach step by step, starting with fundamentals.
- Use practical, relatable examples.
- Explain technical terms before using them.
- Be encouraging, clear, accurate, and concise.
- Use Markdown formatting to make answers easy to read.

STRUCTURE FOR CONCEPTUAL QUESTIONS:
## Definition
Explain what the concept means.

## Explanation
Explain how it works in simple language.

## Example
Give a practical example.

## Step-by-step breakdown
Explain the important steps.

## Summary
End with the key points to remember.

STRUCTURE FOR PROGRAMMING QUESTIONS:
## Concept
Briefly explain the programming concept.

## Code Example
Provide complete, runnable code in a fenced code block.

## Expected Output
Show the expected output in a separate code block.
Clearly label illustrative output when it has not been executed.

## Code Explanation
Explain important lines step by step.

## Summary
Highlight what the student learned.

IMPORTANT RULES:
- Adapt the structure to the question. Do not force unnecessary sections.
- Use the programming language requested by the student.
- If no language is specified, choose the most relevant language.
- For programming examples, always include a complete runnable
  example, including function calls where applicable.
- Always include an Expected Output section for runnable code.
- Show the exact expected output in a separate fenced code block.
- Explain how the code produces that output.
- Never invent code execution results.
- Explain errors and provide corrected code when appropriate.
- Use tables for comparisons when helpful.
- Keep answers focused on the actual question.
- Ask a short clarifying question if the request is ambiguous.
- Never claim to execute code unless execution is available.

YOUR GOAL:
Help students understand concepts, write better code, solve problems,
and become independent programmers.
"""


# =========================
# PYDANTIC SCHEMAS
# =========================

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


class ChatResponse(BaseModel):
    reply: str
    model: str


class ConversationCreate(BaseModel):
    title: str = Field(
        default="New conversation",
        min_length=1,
        max_length=200,
    )


class ConversationResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationDetailResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse]

    model_config = ConfigDict(from_attributes=True)


class ConversationChatResponse(BaseModel):
    conversation_id: int
    reply: str
    model: str
    user_message: MessageResponse
    assistant_message: MessageResponse


# =========================
# OLLAMA HELPER
# =========================

async def get_ollama_reply(messages: list[dict]) -> str:
    payload = {
        "model": OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                OLLAMA_URL,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        reply = data.get("message", {}).get("content", "").strip()

        if not reply:
            raise HTTPException(
                status_code=502,
                detail="The AI model returned an empty response.",
            )

        return reply

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="The AI Tutor took too long to respond. Please try again.",
        )

    except httpx.HTTPStatusError:
        raise HTTPException(
            status_code=502,
            detail="Could not get a response from the local AI model.",
        )

    except httpx.RequestError:
        raise HTTPException(
            status_code=503,
            detail="Ollama is unavailable. Please start Ollama and try again.",
        )


# =========================
# EXISTING CHAT ENDPOINT
# =========================

@router.post("/chat", response_model=ChatResponse)
async def chat_with_tutor(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT,
        },
        {
            "role": "user",
            "content": request.message,
        },
    ]

    reply = await get_ollama_reply(messages)

    return ChatResponse(
        reply=reply,
        model=OLLAMA_MODEL,
    )


# =========================
# CREATE CONVERSATION
# =========================

@router.post(
    "/conversations",
    response_model=ConversationResponse,
)
def create_conversation(
    request: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = AIConversation(
        user_id=current_user.id,
        title=request.title.strip() or "New conversation",
    )

    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return conversation


# =========================
# LIST USER CONVERSATIONS
# =========================

@router.get(
    "/conversations",
    response_model=list[ConversationResponse],
)
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversations = db.scalars(
        select(AIConversation)
        .where(AIConversation.user_id == current_user.id)
        .order_by(AIConversation.updated_at.desc())
    ).all()

    return conversations


# =========================
# OPEN EXISTING CONVERSATION
# =========================

@router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationDetailResponse,
)
def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = db.scalar(
        select(AIConversation).where(
            AIConversation.id == conversation_id,
            AIConversation.user_id == current_user.id,
        )
    )

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found.",
        )

    return conversation


# =========================
# SEND MESSAGE AND SAVE CHAT
# =========================

@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=ConversationChatResponse,
)
async def send_conversation_message(
    conversation_id: int,
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = db.scalar(
        select(AIConversation).where(
            AIConversation.id == conversation_id,
            AIConversation.user_id == current_user.id,
        )
    )

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found.",
        )

    # Retrieve previous messages from PostgreSQL.
    previous_messages = db.scalars(
        select(AIMessage)
        .where(AIMessage.conversation_id == conversation.id)
        .order_by(AIMessage.created_at, AIMessage.id)
    ).all()

    # Build conversation history for Ollama.
    messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT,
        }
    ]

    for message in previous_messages:
        messages.append({
            "role": message.role,
            "content": message.content,
        })

    messages.append({
        "role": "user",
        "content": request.message,
    })

    # Ask the local AI model.
    reply = await get_ollama_reply(messages)

    # Save both messages after a successful AI response.
    user_message = AIMessage(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
    )

    assistant_message = AIMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=reply,
    )

    db.add(user_message)
    db.add(assistant_message)

    # Set the first message as the conversation title.
    if not previous_messages and conversation.title == "New conversation":
        conversation.title = request.message[:60]

    conversation.updated_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(user_message)
        db.refresh(assistant_message)
        db.refresh(conversation)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not save the conversation messages.",
        )

    return ConversationChatResponse(
        conversation_id=conversation.id,
        reply=reply,
        model=OLLAMA_MODEL,
        user_message=user_message,
        assistant_message=assistant_message,
    )

# =========================
# DELETE CONVERSATION
# =========================

@router.delete("/conversations/{conversation_id}")
def delete_ai_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = db.execute(
        select(AIConversation).where(
            AIConversation.id == conversation_id,
            AIConversation.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found.",
        )

    db.delete(conversation)
    db.commit()

    return {
        "message": "Conversation deleted successfully.",
        "conversation_id": conversation_id,
    }