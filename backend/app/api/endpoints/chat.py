from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse, ExtractedPreview, LangGraphStep
from app.ai.graph import crm_agent

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
def execute_chat_agent(req: ChatRequest, db: Session = Depends(get_db)):
    """
    POST /chat
    Executes the multi-node LangGraph Agent workflow (Intent -> NER -> Tool Select -> Tool Execute -> Summary -> DB Update).
    Returns natural reply, extracted structured preview, confidence scores, and real-time step trace.
    """
    initial_state = {
        "session_id": req.session_id,
        "user_id": req.user_id,
        "hcp_id": req.hcp_id,
        "input_message": req.message,
        "intent": "",
        "intent_confidence": 0.0,
        "entities": {},
        "selected_tool": "",
        "tool_output": {},
        "final_reply": "",
        "confidence_score": 0.96,
        "trace_steps": [],
        "db_session": db
    }

    try:
        final_state = crm_agent.invoke(initial_state)
    except Exception as e:
        print(f"[ChatRoute] Error executing LangGraph: {e}")
        raise HTTPException(status_code=500, detail=f"LangGraph Agent workflow execution error: {str(e)}")

    # Extract preview object if available from tool execution output
    tool_out = final_state.get("tool_output", {})
    raw_preview = tool_out.get("extracted_preview")
    extracted_preview_obj = None
    if raw_preview and isinstance(raw_preview, dict):
        extracted_preview_obj = ExtractedPreview(**{k: v for k, v in raw_preview.items() if k in ExtractedPreview.model_fields})

    # Format trace steps
    formatted_trace = []
    for s in final_state.get("trace_steps", []):
        formatted_trace.append(LangGraphStep(
            node=s.get("node", "Unknown"),
            tool_used=s.get("tool_used"),
            input_summary=str(s.get("input_summary", "")),
            output_summary=str(s.get("output_summary", "")),
            latency_ms=float(s.get("latency_ms", 0.0))
        ))

    return ChatResponse(
        session_id=final_state.get("session_id", req.session_id),
        reply=final_state.get("final_reply", "Done."),
        intent=final_state.get("intent", "log_interaction"),
        extracted_preview=extracted_preview_obj,
        trace=formatted_trace,
        confidence_score=final_state.get("confidence_score", 0.96)
    )
