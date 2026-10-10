
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from adaptive_engine import (
    analyze_performance,
    create_next_quiz_plan
)

app = FastAPI(
    title="StatSkill AI Personalization API",
    description="Analyzes learner performance and creates adaptive quiz plans."
)


class PerformanceRequest(BaseModel):
    topic_scores: dict[str, float]


@app.get("/")
def home():
    return {
        "message": "Welcome to StatSkill AI Personalization API!"
    }


@app.post("/personalize")
def personalize(request: PerformanceRequest):

    scores = request.topic_scores

    if not scores:
        raise HTTPException(
            status_code=400,
            detail="Please provide at least one topic score."
        )

    for topic, score in scores.items():
        if not topic.strip():
            raise HTTPException(
                status_code=400,
                detail="Topic names cannot be empty."
            )

        if not 0 <= score <= 100:
            raise HTTPException(
                status_code=400,
                detail="Scores must be between 0 and 100."
            )

    analysis = analyze_performance(scores)
    quiz_plan = create_next_quiz_plan(analysis, total_questions=10)

    recommendations = []

    for topic, details in analysis.items():
        if details["score"] < 50:
            advice = "Study the basics and practise easy questions."
        elif details["score"] < 75:
            advice = "Revise the topic and practise more questions."
        else:
            advice = "Try advanced questions."

        recommendations.append({
            "topic": topic,
            "score": details["score"],
            "status": details["status"],
            "recommendation": advice
        })

    return {
        "performance_analysis": analysis,
        "recommendations": recommendations,
        "next_quiz_plan": quiz_plan
    }
